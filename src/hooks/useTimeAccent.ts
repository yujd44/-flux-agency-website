"use client";

import { useEffect } from "react";

type AccentTriplet = [string, string, string];

/** Subtle coral→magenta→violet shift by local hour. */
function accentsForHour(h: number): AccentTriplet {
  if (h >= 5 && h < 11) {
    // morning — warmer coral
    return ["#ff7a4d", "#e84a7a", "#9b6cf6"];
  }
  if (h >= 11 && h < 17) {
    // midday — balanced brand
    return ["#ff6a3d", "#e83a8a", "#8b5cf6"];
  }
  if (h >= 17 && h < 21) {
    // evening — deeper magenta
    return ["#ff5c38", "#d62f8f", "#7c4dff"];
  }
  // night — cooler violet lean
  return ["#ff6540", "#c73a9a", "#7a52e8"];
}

/**
 * Writes CSS custom properties for time-of-day accent gradient.
 * Lightweight — runs once + hourly check.
 */
export function useTimeAccent() {
  useEffect(() => {
    const apply = () => {
      const [a, b, c] = accentsForHour(new Date().getHours());
      const root = document.documentElement;
      root.style.setProperty("--color-gradient-start", a);
      root.style.setProperty("--color-gradient-mid", b);
      root.style.setProperty("--color-gradient-end", c);
      root.style.setProperty("--color-accent", a);
      root.style.setProperty("--color-button", a);
    };

    apply();
    const id = window.setInterval(apply, 60_000);
    return () => {
      window.clearInterval(id);
    };
  }, []);
}
