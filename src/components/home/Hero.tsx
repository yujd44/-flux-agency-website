"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

/**
 * Pillars — G-shaped leaders (not diagonals):
 * horizontal solid from label → shared vertical dotted axis,
 * then vertical dotted segment DOWN to marker on the ribbon.
 * endX/endY place the square on the sculpture surface.
 */
const PILLARS = [
  { label: "STRATEGY", y: 12, endX: 74, endY: 18 },
  { label: "ARCHITECTURE", y: 26, endX: 66, endY: 34 },
  { label: "DEVELOPMENT", y: 42, endX: 68, endY: 50 },
  { label: "AUTOMATION", y: 56, endX: 70, endY: 64 },
  { label: "SUPPORT", y: 70, endX: 54, endY: 78 },
] as const;

const MAX_TILT = 0.35;
/** Shared vertical dotted axis (labels sit just left of this). */
const GUIDE_X = 58;
const GUIDE_Y1 = 8;
const GUIDE_Y2 = 82;

export default function Hero() {
  const t = useTranslations("home.hero");
  const artRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = artRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({
        x: -(py * MAX_TILT * 2),
        y: px * MAX_TILT * 2,
      });
    }

    function onLeave() {
      setTilt({ x: 0, y: 0 });
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section className="relative flex min-h-[calc(100svh-64px-(var(--frame-inset)*2))] flex-col overflow-hidden">
      {/* Ambient paper grid — nearly invisible */}
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.22]" />

      {/* Decorative fine dot-grid in free space left of the tall loop */}
      <div
        className="pointer-events-none absolute z-[1] hidden lg:block"
        aria-hidden="true"
        style={{
          top: "8%",
          left: "46%",
          width: "22%",
          height: "48%",
          backgroundImage:
            "radial-gradient(rgba(80,70,60,0.14) 0.55px, transparent 0.65px)",
          backgroundSize: "14px 14px",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 18%, black 78%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 18%, black 78%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      {/*
        Sculpture placement guided by silhouette map (hero %H → left edge %W):
        top ~74%W, twist ~63%W, knot ~71%W, wall leftmost ~48%W, bottom ~45%W.
        Container spans from ~42%W so the diagonal wall can reach ~45%W; top/right bleed.
      */}
      <div
        ref={artRef}
        className="pointer-events-auto absolute inset-0 z-0"
        style={{ perspective: "1400px" }}
        aria-hidden="true"
      >
        <div
          className="absolute -top-[8%] right-[-8%] bottom-[-4%] left-[42%] transition-transform duration-500 ease-out will-change-transform sm:left-[44%] lg:-top-[10%] lg:right-[-6%] lg:left-[46%]"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <Image
            src="/images/hero-concrete-ribbon.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 70vw, 58vw"
            className="object-contain object-right-top"
          />
        </div>

        {/* Soft blend into page bg on the left only — keeps text field clear */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[44%] bg-gradient-to-r from-bg from-45% via-bg/75 to-transparent sm:w-[40%] lg:w-[38%]" />
      </div>

      {/* Engineering annotations — G-shaped (stepped) leaders */}
      <div
        className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
        aria-hidden="true"
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Shared vertical dotted axis */}
          <line
            x1={GUIDE_X}
            y1={GUIDE_Y1}
            x2={GUIDE_X}
            y2={GUIDE_Y2}
            stroke="rgba(80,70,60,0.28)"
            strokeWidth="1"
            strokeDasharray="2.5 3.5"
            vectorEffect="non-scaling-stroke"
          />
          {PILLARS.map((p) => (
            <g key={p.label}>
              {/* Horizontal solid: label → axis */}
              <line
                x1={GUIDE_X - 10}
                y1={p.y}
                x2={GUIDE_X}
                y2={p.y}
                stroke="rgba(80,70,60,0.38)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              {/* Vertical dotted segment DOWN from axis junction → marker height */}
              {p.endY !== p.y && (
                <line
                  x1={GUIDE_X}
                  y1={p.y}
                  x2={GUIDE_X}
                  y2={p.endY}
                  stroke="rgba(80,70,60,0.34)"
                  strokeWidth="1"
                  strokeDasharray="2.5 3.5"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {/* Short horizontal stub to marker on ribbon (completes the G) */}
              {p.endX !== GUIDE_X && (
                <line
                  x1={GUIDE_X}
                  y1={p.endY}
                  x2={p.endX}
                  y2={p.endY}
                  stroke="rgba(80,70,60,0.34)"
                  strokeWidth="1"
                  strokeDasharray="2.5 3.5"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          ))}
        </svg>

        {PILLARS.map((p) => (
          <div key={p.label}>
            <span
              className="label-mono absolute text-[9px] tracking-[0.2em] text-muted/60"
              style={{
                top: `${p.y}%`,
                right: `${100 - GUIDE_X + 1}%`,
                transform: "translateY(-50%)",
              }}
            >
              {p.label}
            </span>
            <span
              className="absolute h-[3px] w-[3px] bg-accent"
              style={{
                top: `${p.endY}%`,
                left: `${p.endX}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Copy — structural LTR column (text LEFT); BidiBlock only flips text dir/align */}
      <div className="chrome-ltr relative z-10 mx-auto flex w-full max-w-[var(--page-max)] flex-1 flex-col">
        <div className="relative flex flex-1 flex-col justify-center px-[var(--page-pad)] pt-20 pb-16 sm:pt-[11vh] lg:pt-[12vh] lg:pb-20">
          {/* Fixed-width left column so RTL text-align never drifts over the graphic */}
          <BidiBlock className="w-full max-w-[min(100%,28rem)] sm:max-w-[30rem] lg:max-w-[32rem]">
            <div className="animate-fade-up mb-8 inline-flex items-center gap-3 lg:mb-10">
              <span className="eng-marker opacity-70" aria-hidden="true" />
              <span className="label-mono text-[10px] tracking-[0.32em] text-muted/80">
                {t("eyebrow")}
              </span>
            </div>

            <h1 className="hero-headline animate-fade-up max-w-[11ch] text-[2.1rem] font-normal leading-[1.18] tracking-[-0.01em] text-text sm:max-w-[14ch] sm:text-[2.85rem] lg:max-w-[13ch] lg:text-[3.35rem] xl:text-[3.65rem]">
              <span className="text-content">{t("titleBefore")}</span>
              <span className="hero-accent">{t("titleAccent")}</span>
              <span className="text-content">{t("titleAfter")}</span>
            </h1>

            <p className="animate-fade-up mt-7 max-w-[22rem] text-[0.92rem] font-light leading-[1.85] text-muted sm:mt-8 sm:max-w-[24rem] sm:text-[0.98rem] lg:mt-9 lg:max-w-[25rem]">
              {t("subtitle")}
            </p>

            {/* chrome-ltr keeps CTA order; arrows flip via Button rtl variant */}
            <div className="animate-fade-up chrome-ltr mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 sm:mt-12">
              <Button href="/services" variant="primary">
                {t("cta")}
              </Button>
              <Button href="/about#approach" variant="ghost" showArrow={false}>
                {t("ctaSecondary")}
              </Button>
            </div>
          </BidiBlock>
        </div>

        {/* Bottom bar — radar mark + scroll cue with separate arrow icon */}
        <div className="chrome-ltr relative z-10 mx-[var(--page-pad)] flex items-center justify-between gap-4 border-t border-[rgba(80,70,60,0.14)] py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <span className="absolute inset-0 rounded-full border border-border-strong/80" />
              <span className="absolute inset-[3px] rounded-full border border-border-strong/60" />
              <span className="absolute inset-[6px] rounded-full bg-accent/80" />
            </span>
            <span className="label-mono truncate text-[10px] tracking-[0.22em] text-muted/70">
              {t("pillars")}
            </span>
          </div>
          <div className="hidden shrink-0 items-center gap-4 sm:flex">
            <span className="label-mono text-[10px] tracking-[0.22em] text-muted/70">
              {t("scrollHint")}
            </span>
            <ArrowDown
              className="h-3.5 w-3.5 text-muted/70"
              strokeWidth={1.25}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
