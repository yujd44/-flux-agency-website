"use client";

import { useEffect, useRef } from "react";

type Props = {
  before: string;
  accent: string;
  after: string;
};

/**
 * Whole-word magnetic pull — keeps Russian/Uzbek syllables intact
 * (letter-splitting broke mid-word wraps like "с / ложность").
 */
export default function HeroHeadline({ before, accent, after }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const words = el.querySelectorAll<HTMLElement>("[data-word]");
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        words.forEach((word) => {
          const rect = word.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          const radius = 160;
          if (dist > radius) {
            word.style.transform = "";
            return;
          }
          const t = (1 - dist / radius) * 0.5;
          word.style.transform = `translate3d(${dx * 0.05 * t}px, ${dy * 0.04 * t}px, 0)`;
        });
      });
    };

    const onLeave = () => {
      words.forEach((word) => {
        word.style.transform = "";
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

  const wrapWords = (text: string, keyPrefix: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      if (/^\s+$/.test(part)) {
        return <span key={`${keyPrefix}-sp-${i}`}>{"\u00A0"}</span>;
      }
      if (!part) return null;
      return (
        <span
          key={`${keyPrefix}-w-${i}`}
          data-word
          className="inline-block"
          style={{
            transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            willChange: "transform",
          }}
        >
          {part}
        </span>
      );
    });
  };

  return (
    <h1
      ref={ref}
      className="hero-headline animate-fade-up max-w-[16ch] text-[2.15rem] font-medium leading-[1.16] tracking-[-0.015em] text-text sm:max-w-[18ch] sm:text-[2.9rem] lg:max-w-[17ch] lg:text-[3.4rem] xl:text-[3.75rem]"
    >
      <span className="text-content">{wrapWords(before, "b")}</span>
      <span
        data-word
        className="hero-accent inline-block"
        style={{
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        {accent}
      </span>
      <span className="text-content">{wrapWords(after, "a")}</span>
    </h1>
  );
}
