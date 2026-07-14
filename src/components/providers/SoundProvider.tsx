"use client";

import { useEffect } from "react";
import { playClickSound, playScrollSound } from "@/lib/sound-fx";

const SCROLL_VELOCITY_THRESHOLD = 0.5; // px/ms -- ignores tiny jitter/momentum tail-off
const SCROLL_SOUND_MIN_INTERVAL_MS = 500;

/**
 * Mounts the two global, delegated listeners behind the site's subtle sound
 * effects: a click tick on any button/link/interactive element, and a
 * throttled "whoosh" while the user is actively scrolling. Renders nothing.
 * Both listeners are passive/no-op friendly -- if Web Audio isn't available
 * or the AudioContext hasn't been unlocked yet, the underlying sound calls
 * simply do nothing.
 */
export default function SoundProvider() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest('button, a, [role="button"]');
      if (interactive) playClickSound();
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let lastPlayedAt = 0;

    function handleScroll() {
      const now = performance.now();
      const y = window.scrollY;
      const dt = now - lastTime;
      const dy = Math.abs(y - lastY);
      lastY = y;
      lastTime = now;
      if (dt <= 0) return;

      const velocity = dy / dt;
      if (velocity > SCROLL_VELOCITY_THRESHOLD && now - lastPlayedAt > SCROLL_SOUND_MIN_INTERVAL_MS) {
        lastPlayedAt = now;
        playScrollSound();
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
