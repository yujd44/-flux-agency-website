// Tiny, dependency-free Web Audio sound effects. Every sound here is
// synthesized on the fly (oscillators + a noise burst) rather than loaded
// from an audio file, so there is nothing to fetch, license, or ship as a
// static asset.
//
// Browsers suspend a freshly-created AudioContext until a user gesture
// resumes it. Every function below is written to fail silently: if Web
// Audio isn't available, or the context is still suspended (e.g. a sound
// tries to play automatically before the user has interacted at all), the
// call is just a no-op instead of throwing or queuing up silently-broken
// audio.

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!sharedContext) {
    try {
      sharedContext = new AudioContextCtor();
    } catch {
      return null;
    }
  }

  if (sharedContext.state === "suspended") {
    // Only actually resumes when called as part of a user gesture; if it's
    // not (e.g. the logo-intro chime firing on an untouched page), this
    // rejects/no-ops and the context stays suspended, which we check for
    // below before scheduling anything audible.
    void sharedContext.resume().catch(() => {});
  }

  return sharedContext;
}

/** Nudges the shared AudioContext awake. Safe to call from any user gesture. */
export function primeAudio(): void {
  getContext();
}

type ToneOptions = {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  peak?: number;
  attack?: number;
  delay?: number;
};

function playTone(ctx: AudioContext, opts: ToneOptions): void {
  const { frequency, duration, type = "sine", peak = 0.06, attack = 0.005, delay = 0 } = opts;
  const start = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playNoiseBurst(
  ctx: AudioContext,
  opts: { duration: number; peak: number; filterFrequency: number; q?: number },
): void {
  const { duration, peak, filterFrequency, q = 0.7 } = opts;
  const start = ctx.currentTime;

  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFrequency;
  filter.Q.value = q;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
  source.stop(start + duration + 0.03);
}

/** Very short, soft tick -- fired on any button/link/interactive click. */
export function playClickSound(): void {
  try {
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;
    playTone(ctx, { frequency: 720, duration: 0.045, type: "triangle", peak: 0.05, attack: 0.003 });
  } catch {
    // Never let a decorative sound break an interaction.
  }
}

/** Soft filtered "whoosh", distinctly lower and longer than the click. */
export function playScrollSound(): void {
  try {
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;
    playNoiseBurst(ctx, { duration: 0.12, peak: 0.035, filterFrequency: 200, q: 0.9 });
  } catch {
    // Never let a decorative sound break scrolling.
  }
}

/** Small two-note chime for the logo intro's reveal beat. */
export function playChimeSound(): void {
  try {
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;
    // A fundamental plus a fifth above it, the second note landing just
    // after the first so it reads as a gentle "ding" rather than a chord.
    playTone(ctx, { frequency: 523.25, duration: 0.55, type: "sine", peak: 0.07, attack: 0.015 });
    playTone(ctx, {
      frequency: 784.0,
      duration: 0.5,
      type: "sine",
      peak: 0.05,
      attack: 0.015,
      delay: 0.09,
    });
  } catch {
    // Never let a decorative sound break the intro.
  }
}
