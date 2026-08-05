import { playClickSound, playScrollSound, playChimeSound, playTypeSound, primeAudio } from "@/lib/sound-fx";

/**
 * Thin wrapper around synthesized sound effects for components that trigger
 * them directly (e.g. logo intro typewriter / chime).
 */
export function useSoundEffects() {
  return {
    playClick: playClickSound,
    playScroll: playScrollSound,
    playChime: playChimeSound,
    playType: playTypeSound,
    primeAudio,
  };
}
