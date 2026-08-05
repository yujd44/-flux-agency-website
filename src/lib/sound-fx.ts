// Lightweight sound effects. Typing uses short royalty-free WAV clicks from
// /public/sounds/; UI ticks stay synthesized. AudioContext must be resumed
// from a user gesture — every play path fails silently if still suspended.

let sharedContext: AudioContext | null = null;
let typeBuffers: AudioBuffer[] | null = null;
let typeBuffersLoading: Promise<AudioBuffer[] | null> | null = null;

const TYPE_SAMPLE_URLS = [
  "/sounds/key-1.wav",
  "/sounds/key-2.wav",
  "/sounds/key-3.wav",
] as const;

/** Peak gain for typewriter key clicks — intentionally audible. */
const TYPE_GAIN = 0.72;

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
    void sharedContext.resume().catch(() => {});
  }

  return sharedContext;
}

async function loadTypeBuffers(ctx: AudioContext): Promise<AudioBuffer[] | null> {
  if (typeBuffers) return typeBuffers;
  if (typeBuffersLoading) return typeBuffersLoading;

  typeBuffersLoading = (async () => {
    try {
      const decoded = await Promise.all(
        TYPE_SAMPLE_URLS.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`failed ${url}`);
          const raw = await res.arrayBuffer();
          return ctx.decodeAudioData(raw.slice(0));
        }),
      );
      typeBuffers = decoded;
      return decoded;
    } catch {
      typeBuffers = null;
      return null;
    } finally {
      typeBuffersLoading = null;
    }
  })();

  return typeBuffersLoading;
}

/**
 * Resume AudioContext and preload typewriter samples.
 * Call from a user gesture. Resolves true when audio is ready to play.
 */
export async function primeAudio(): Promise<boolean> {
  const ctx = getContext();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    await loadTypeBuffers(ctx);
    return ctx.state === "running";
  } catch {
    return false;
  }
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

/** Fallback synthetic key click when WAV samples are unavailable. */
function playTypeSoundFallback(ctx: AudioContext): void {
  const freq = 1600 + Math.random() * 600;
  playTone(ctx, {
    frequency: freq,
    duration: 0.04,
    type: "square",
    peak: 0.22,
    attack: 0.001,
  });
  playNoiseBurst(ctx, { duration: 0.028, peak: 0.28, filterFrequency: 3200, q: 1.4 });
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

/** Audible key-click for typewriter letters (real WAV samples when loaded). */
export function playTypeSound(): void {
  try {
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;

    const buffers = typeBuffers;
    if (buffers && buffers.length > 0) {
      const buffer = buffers[Math.floor(Math.random() * buffers.length)];
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = 0.92 + Math.random() * 0.18;

      const gain = ctx.createGain();
      const peak = TYPE_GAIN * (0.85 + Math.random() * 0.2);
      gain.gain.setValueAtTime(peak, ctx.currentTime);

      source.connect(gain).connect(ctx.destination);
      source.start(0);
      return;
    }

    // Kick off load for subsequent letters; play loud synthetic fallback now.
    void loadTypeBuffers(ctx);
    playTypeSoundFallback(ctx);
  } catch {
    // Never let a decorative sound break the intro.
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
    playTone(ctx, { frequency: 523.25, duration: 0.55, type: "sine", peak: 0.12, attack: 0.015 });
    playTone(ctx, {
      frequency: 784.0,
      duration: 0.5,
      type: "sine",
      peak: 0.09,
      attack: 0.015,
      delay: 0.09,
    });
  } catch {
    // Never let a decorative sound break the intro.
  }
}
