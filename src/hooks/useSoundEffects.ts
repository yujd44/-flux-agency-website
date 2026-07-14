import { playClickSound, playScrollSound, playChimeSound, primeAudio } from "@/lib/sound-fx";

/**
 * Thin, stable-identity wrapper around the synthesized sound effects in
 * `@/lib/sound-fx` for components that want to trigger them directly (e.g.
 * the logo intro's reveal chime) rather than relying on the global
 * click/scroll listeners set up by `SoundProvider`.
 */
export function useSoundEffects() {
  return {
    playClick: playClickSound,
    playScroll: playScrollSound,
    playChime: playChimeSound,
    primeAudio,
  };
}
