"use client";

import { useEffect, type RefObject } from "react";

/** Moves a fixed crosshair element with the pointer inside `zoneRef`. */
export function useCrosshair(
  zoneRef: RefObject<HTMLElement | null>,
  crosshairRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const zone = zoneRef.current;
    const dot = crosshairRef.current;
    if (!zone || !dot) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;

    const flush = () => {
      raf = 0;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    zone.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      zone.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [zoneRef, crosshairRef]);
}
