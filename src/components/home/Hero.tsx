"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

/** Percent coords relative to the hero section — leaders span full sculpture height. */
const PILLARS = [
  { label: "STRATEGY", y: 12, endX: 72, endY: 10 },
  { label: "ARCHITECTURE", y: 28, endX: 68, endY: 27 },
  { label: "DEVELOPMENT", y: 44, endX: 74, endY: 44 },
  { label: "AUTOMATION", y: 60, endX: 69, endY: 61 },
  { label: "SUPPORT", y: 76, endX: 75, endY: 78 },
] as const;
const MAX_TILT = 0.35;
const GUIDE_X = 54;
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
      {/* Step 5 — grid almost invisible */}
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.22]" />

      {/* Full-height sculpture — transparent PNG bleeds top / right / bottom into cream */}
      <div
        ref={artRef}
        className="pointer-events-auto absolute inset-0 z-0"
        style={{ perspective: "1400px" }}
        aria-hidden="true"
      >
        <div
          className="absolute -top-[10%] right-[-14%] bottom-[6%] w-[68%] transition-transform duration-500 ease-out will-change-transform sm:-top-[12%] sm:right-[-12%] sm:bottom-[5%] sm:w-[62%] lg:-top-[14%] lg:right-[-10%] lg:bottom-[4%] lg:w-[56%] xl:w-[52%]"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <Image
            src="/images/hero-concrete-ribbon.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 70vw, 56vw"
            className="object-cover object-[20%_center]"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 10%, black 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 10%, black 100%)",
            }}
          />
          {/* Depth wash on the sculpture only — not a rectangular card shadow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 42% at 90% 94%, rgba(18,14,10,0.32) 0%, transparent 68%)",
              mixBlendMode: "multiply",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 10%, black 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 10%, black 100%)",
            }}
          />
        </div>

        {/* Soft blend into page bg on the left only */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[48%] bg-gradient-to-r from-bg from-40% via-bg/80 to-transparent sm:w-[40%] lg:w-[36%]" />
      </div>

      {/* Engineering annotations — section-scoped so leaders land on the ribbon */}
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
            stroke="rgba(80,70,60,0.3)"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
          {PILLARS.map((p) => (
            <line
              key={p.label}
              x1={GUIDE_X}
              y1={p.y}
              x2={p.endX}
              y2={p.endY}
              stroke="rgba(80,70,60,0.34)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
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

      {/* Copy — airy, lighter weight; sits in the left field of one composition */}
      <div className="chrome-ltr relative z-10 mx-auto flex w-full max-w-[var(--page-max)] flex-1 flex-col">
        <div className="relative flex flex-1 flex-col justify-center px-[var(--page-pad)] pt-20 pb-16 sm:pt-[11vh] lg:pt-[12vh] lg:pb-20">
          <BidiBlock>
            <div className="animate-fade-up chrome-ltr mb-8 inline-flex items-center gap-3 lg:mb-10">
              <span className="eng-marker opacity-70" aria-hidden="true" />
              <span className="label-mono text-[10px] tracking-[0.32em] text-muted/80">
                {t("eyebrow")}
              </span>
            </div>

            <h1 className="animate-fade-up max-w-[11ch] text-[2.1rem] font-light leading-[1.18] tracking-[-0.01em] text-text sm:max-w-[14ch] sm:text-[2.85rem] lg:max-w-[13ch] lg:text-[3.35rem] xl:text-[3.65rem]">
              <span className="text-content">{t("titleBefore")}</span>
              <span className="hero-accent">{t("titleAccent")}</span>
              <span className="text-content">{t("titleAfter")}</span>
            </h1>

            <p className="animate-fade-up mt-7 max-w-[22rem] text-[0.92rem] font-light leading-[1.85] text-muted sm:mt-8 sm:max-w-[24rem] sm:text-[0.98rem] lg:mt-9 lg:max-w-[25rem]">
              {t("subtitle")}
            </p>

            <div className="animate-fade-up mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 sm:mt-12">
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
