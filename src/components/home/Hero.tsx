"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";
import { Link } from "@/i18n/navigation";

/**
 * Pillar labels — mock: vertical rail + colored square markers.
 */
const PILLARS: { label: string; y: number; color: string }[] = [
  { label: "STRATEGY", y: 18, color: "#ff6a3d" },
  { label: "ARCHITECTURE", y: 30, color: "#e83a8a" },
  { label: "DEVELOPMENT", y: 42, color: "#a855f7" },
  { label: "AUTOMATION", y: 54, color: "#3b82f6" },
  { label: "SUPPORT", y: 66, color: "#2dd4bf" },
];

const TRUSTED = ["Solvix", "Nexora", "Akira Systems", "Lumen", "Dayone"] as const;

const MAX_TILT = 0.28;
/** Vertical rail through the pillar list (viewBox %). */
const GUIDE_X = 52;
const GUIDE_Y1 = 14;
const GUIDE_Y2 = 70;

export default function Hero() {
  const t = useTranslations("home.hero");
  const artRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const pillarParts = t("pillars")
    .split(/[·•]/)
    .map((s) => s.trim())
    .filter(Boolean);

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
    <section className="relative flex min-h-[calc(100svh-72px)] flex-col overflow-hidden">
      {/* Ambient dark grid */}
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      {/* Soft cyan floor glow under ribbon */}
      <div
        className="pointer-events-none absolute inset-x-[35%] bottom-0 z-[1] h-[28%] opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 70% 100%, rgba(56,189,248,0.22) 0%, transparent 70%)",
        }}
      />

      {/* Dot grid behind pillar labels */}
      <div
        className="pointer-events-none absolute z-[1] hidden lg:block"
        aria-hidden="true"
        style={{
          top: "10%",
          left: "40%",
          width: "20%",
          height: "55%",
          backgroundImage:
            "radial-gradient(rgba(160,200,240,0.14) 0.55px, transparent 0.65px)",
          backgroundSize: "12px 12px",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      {/* Full-bleed dark ribbon art */}
      <div
        ref={artRef}
        className="pointer-events-auto absolute inset-0 z-0 overflow-hidden"
        style={{ perspective: "1400px" }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out will-change-transform"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <Image
            src="/images/hero-concrete-ribbon-dark.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-contain object-right object-bottom"
            style={{ background: "transparent" }}
          />
        </div>
      </div>

      {/* Pillar annotations — colored squares on vertical axis */}
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
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {PILLARS.map((p) => (
          <div key={p.label}>
            <Link
              href="/services"
              className="label-mono pointer-events-auto absolute text-[9px] tracking-[0.22em] text-muted/75 transition-colors hover:text-text"
              style={{
                top: `${p.y}%`,
                right: `${100 - GUIDE_X + 1.2}%`,
                transform: "translateY(-50%)",
              }}
            >
              {p.label}
            </Link>
            <span
              className="absolute h-[5px] w-[5px]"
              style={{
                top: `${p.y}%`,
                left: `${GUIDE_X}%`,
                transform: "translate(-50%, -50%)",
                background: p.color,
                boxShadow: `0 0 10px ${p.color}66`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Copy — structural LTR column */}
      <div className="chrome-ltr relative z-10 mx-auto flex w-full max-w-[var(--page-max)] flex-1 flex-col">
        <div className="relative flex flex-1 flex-col justify-center px-[var(--page-pad)] pt-10 pb-10 sm:pt-[8vh] lg:pt-[9vh] lg:pb-12">
          <BidiBlock className="w-full max-w-[min(100%,28rem)] sm:max-w-[30rem] lg:max-w-[34rem]">
            <div className="animate-fade-up mb-7 inline-flex items-center gap-3 lg:mb-9">
              <span className="h-px w-3 bg-muted/70" aria-hidden="true" />
              <span className="label-mono text-[10px] tracking-[0.32em] text-muted/85">
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

          {/* Trusted by — present on the dark mock */}
          <div className="animate-fade-up mt-14 max-w-xl lg:mt-16">
            <div className="label-mono mb-4 text-[9px] tracking-[0.28em] text-muted/55">
              {t("trustedBy")}
            </div>
            <div className="chrome-ltr flex flex-wrap items-center gap-x-7 gap-y-3 text-[11px] font-medium tracking-[0.16em] text-text/40 uppercase">
              {TRUSTED.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="chrome-ltr relative z-10 mx-[var(--page-pad)] flex items-center justify-between gap-4 border-t border-white/10 bg-transparent py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <span className="absolute inset-0 rounded-full border border-white/35" />
              <span className="absolute inset-[3px] rounded-full border border-white/25" />
              <span className="absolute inset-[6px] rounded-full bg-accent shadow-[0_0_8px_rgba(255,106,61,0.7)]" />
            </span>
            <Link
              href="/services"
              className="label-mono flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] tracking-[0.18em] text-muted/80 transition-colors hover:text-text"
            >
              {pillarParts.map((part, i) => (
                <span key={part} className="inline-flex items-center gap-2">
                  {i > 0 && (
                    <span className="inline-block h-[4px] w-[4px] shrink-0 bg-accent" aria-hidden="true" />
                  )}
                  <span className="truncate">{part}</span>
                </span>
              ))}
            </Link>
          </div>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="label-mono text-[10px] tracking-[0.22em] text-muted/70">
              {t("scrollHint")}
            </span>
            <span className="relative inline-flex h-7 w-px items-end" aria-hidden="true">
              <span className="absolute inset-x-0 top-0 bottom-1 bg-white/35" />
              <span className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[3px] border-t-[4px] border-x-transparent border-t-white/45" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
