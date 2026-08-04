"use client";

import { useEffect, useRef, type RefObject } from "react";

type Options = {
  strength?: number;
  radius?: number;
};

/**
 * Subtle magnetic pull of an element toward the pointer.
 */
export function useMagnetic<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { strength = 0.28, radius = 120 }: Options = {},
) {
  const raf = useRef(0);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const flush = () => {
      raf.current = 0;
      el.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0)`;
    };

    const schedule = () => {
      if (!raf.current) raf.current = requestAnimationFrame(flush);
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        target.current = { x: 0, y: 0 };
      } else {
        const t = 1 - dist / radius;
        target.current = {
          x: dx * strength * t,
          y: dy * strength * t,
        };
      }
      schedule();
    };

    const onLeave = () => {
      target.current = { x: 0, y: 0 };
      schedule();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
      el.style.transform = "";
    };
  }, [ref, radius, strength]);
}
