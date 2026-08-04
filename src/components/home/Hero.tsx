"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

/**
 * Pillar labels — mock: vertical rail + short ticks; DEVELOPMENT marked.
 * One stepped G-shape leader runs from the rail into the sculpture.
 */
const PILLARS: { label: string; y: number; accent?: boolean }[] = [
  { label: "STRATEGY", y: 18 },
  { label: "ARCHITECTURE", y: 30 },
  { label: "DEVELOPMENT", y: 42, accent: true },
  { label: "AUTOMATION", y: 54 },
  { label: "SUPPORT", y: 66 },
];

const MAX_TILT = 0.28;
/** Vertical rail through the pillar list (viewBox %). */
const GUIDE_X = 54;
const GUIDE_Y1 = 14;
const GUIDE_Y2 = 70;
/** Stepped G-shape: rail → down → into ribbon surface. */
const G = { fromY: 42, midY: 58, endX: 72, endY: 58 };

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
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.18]" />

      {/* Dot grid behind pillar labels (as on mock) */}
      <div
        className="pointer-events-none absolute z-[1] hidden lg:block"
        aria-hidden="true"
        style={{
          top: "10%",
          left: "42%",
          width: "20%",
          height: "55%",
          backgroundImage:
            "radial-gradient(rgba(80,70,60,0.16) 0.55px, transparent 0.65px)",
          backgroundSize: "12px 12px",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      {/*
        Client asset: landscape cream + ribbon on the right.
        Full-bleed cover, object-right so sculpture bleeds top/right; left cream crops safely.
      */}
      <div
        ref={artRef}
        className="pointer-events-auto absolute inset-0 z-0"
        style={{ perspective: "1400px" }}
        aria-hidden="true"
      >
        <div
          className="absolute -top-[2%] -right-[2%] bottom-0 left-0 transition-transform duration-500 ease-out will-change-transform lg:-top-[4%] lg:-right-[3%]"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <Image
            src="/images/hero-concrete-ribbon.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-right"
          />
        </div>
      </div>

      {/* Engineering annotations — rail + ticks + one stepped G */}
      <div
        className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
        aria-hidden="true"
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line
            x1={GUIDE_X}
            y1={GUIDE_Y1}
            x2={GUIDE_X}
            y2={GUIDE_Y2}
            stroke="rgba(80,70,60,0.32)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          {PILLARS.map((p) => (
            <line
              key={p.label}
              x1={GUIDE_X - 7}
              y1={p.y}
              x2={GUIDE_X}
              y2={p.y}
              stroke="rgba(80,70,60,0.38)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* Stepped G: junction → down the rail → horizontal into sculpture */}
          <polyline
            points={`${GUIDE_X},${G.fromY} ${GUIDE_X},${G.midY} ${G.endX},${G.endY}`}
            fill="none"
            stroke="rgba(80,70,60,0.36)"
            strokeWidth="1"
            strokeDasharray="2.2 3.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {PILLARS.map((p) => (
          <div key={p.label}>
            <span
              className="label-mono absolute text-[9px] tracking-[0.22em] text-muted/65"
              style={{
                top: `${p.y}%`,
                right: `${100 - GUIDE_X + 0.8}%`,
                transform: "translateY(-50%)",
              }}
            >
              {p.label}
            </span>
            {p.accent && (
              <span
                className="absolute h-[3px] w-[3px] bg-accent"
                style={{
                  top: `${p.y}%`,
                  left: `${GUIDE_X + 1.2}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
          </div>
        ))}
        {/* Marker at end of G on the ribbon */}
        <span
          className="absolute h-[3px] w-[3px] bg-accent"
          style={{
            top: `${G.endY}%`,
            left: `${G.endX}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Copy — structural LTR column (text LEFT); BidiBlock only flips text dir/align */}
      <div className="chrome-ltr relative z-10 mx-auto flex w-full max-w-[var(--page-max)] flex-1 flex-col">
        <div className="relative flex flex-1 flex-col justify-center px-[var(--page-pad)] pt-16 pb-14 sm:pt-[10vh] lg:pt-[11vh] lg:pb-16">
          <BidiBlock className="w-full max-w-[min(100%,28rem)] sm:max-w-[30rem] lg:max-w-[34rem]">
            <div className="animate-fade-up mb-7 inline-flex items-center gap-3 lg:mb-9">
              <span className="eng-marker opacity-80" aria-hidden="true" />
              <span className="label-mono text-[10px] tracking-[0.32em] text-muted/80">
                {t("eyebrow")}
              </span>
            </div>

            <h1 className="hero-headline animate-fade-up max-w-[12ch] text-[2.15rem] font-medium leading-[1.16] tracking-[-0.015em] text-text sm:max-w-[15ch] sm:text-[2.9rem] lg:max-w-[14ch] lg:text-[3.4rem] xl:text-[3.75rem]">
              <span className="text-content">{t("titleBefore")}</span>
              <span className="hero-accent">{t("titleAccent")}</span>
              <span className="text-content">{t("titleAfter")}</span>
            </h1>

            <p className="animate-fade-up mt-6 max-w-[22rem] text-[0.95rem] font-light leading-[1.8] text-muted sm:mt-7 sm:max-w-[24rem] sm:text-[1rem] lg:mt-8 lg:max-w-[26rem]">
              {t("subtitle")}
            </p>

            <div className="animate-fade-up chrome-ltr mt-9 flex flex-wrap items-center gap-x-10 gap-y-4 sm:mt-11">
              <Button href="/services" variant="primary">
                {t("cta")}
              </Button>
              <Button href="/about#approach" variant="ghost" showArrow={false}>
                {t("ctaSecondary")}
              </Button>
            </div>
          </BidiBlock>
        </div>

        {/* Bottom bar — radar mark + long scroll cue (no TRUSTED BY) */}
        <div className="chrome-ltr relative z-10 mx-[var(--page-pad)] flex items-center justify-between gap-4 border-t border-[rgba(80,70,60,0.14)] py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <span className="absolute inset-0 rounded-full border border-border-strong/80" />
              <span className="absolute inset-[3px] rounded-full border border-border-strong/55" />
              <span className="absolute inset-[6px] rounded-full bg-accent/85" />
            </span>
            <span className="label-mono truncate text-[10px] tracking-[0.22em] text-muted/70">
              {t("pillars")}
            </span>
          </div>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="label-mono text-[10px] tracking-[0.22em] text-muted/70">
              {t("scrollHint")}
            </span>
            <span className="relative inline-flex h-7 w-px items-end" aria-hidden="true">
              <span className="absolute inset-x-0 top-0 bottom-1 bg-[rgba(80,70,60,0.35)]" />
              <span
                className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[3px] border-t-[4px] border-x-transparent border-t-[rgba(80,70,60,0.45)]"
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
