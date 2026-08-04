"use client";

import { useEffect, useRef } from "react";

type Props = {
  before: string;
  accent: string;
  after: string;
};

/**
 * Magnetic letter pull toward cursor — subtle, desktop only.
 * Accent word stays whole so the gradient text paint remains intact.
 */
export default function HeroHeadline({ before, accent, after }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const letters = el.querySelectorAll<HTMLElement>("[data-letter]");
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        letters.forEach((letter) => {
          const rect = letter.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          const radius = 140;
          if (dist > radius) {
            letter.style.transform = "";
            return;
          }
          const t = (1 - dist / radius) * 0.55;
          letter.style.transform = `translate3d(${dx * 0.06 * t}px, ${dy * 0.05 * t}px, 0)`;
        });
      });
    };

    const onLeave = () => {
      letters.forEach((letter) => {
        letter.style.transform = "";
      });
    };

    const section = el.closest("section");
    const target = section ?? el;
    target.addEventListener("mousemove", onMove, { passive: true });
    target.addEventListener("mouseleave", onLeave);
    return () => {
      target.removeEventListener("mousemove", onMove);
      target.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const wrap = (text: string) =>
    text.split("").map((ch, i) => (
      <span
        key={`${ch}-${i}`}
        data-letter
        style={{
          display: ch === " " ? "inline" : "inline-block",
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        {ch === " " ? "\u00A0" : ch}
      </span>
    ));

  return (
    <h1
      ref={ref}
      className="hero-headline animate-fade-up max-w-[12ch] text-[2.15rem] font-medium leading-[1.16] tracking-[-0.015em] text-text sm:max-w-[15ch] sm:text-[2.9rem] lg:max-w-[14ch] lg:text-[3.4rem] xl:text-[3.75rem]"
    >
      <span className="text-content">{wrap(before)}</span>
      <span
        data-letter
        className="hero-accent inline-block"
        style={{
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        {accent}
      </span>
      <span className="text-content">{wrap(after)}</span>
    </h1>
  );
}
