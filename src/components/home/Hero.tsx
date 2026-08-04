"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";
import { Link } from "@/i18n/navigation";

const TRUSTED = ["Solvix", "Nexora", "Akira Systems", "Lumen", "Dayone"] as const;

/** Soft parallax tilt — keep tiny so it stays premium, not toy-like. */
const MAX_TILT = 0.7;

const DUST = [
  { left: "58%", top: "28%", size: 1.5, delay: "0s", dur: "9s" },
  { left: "72%", top: "36%", size: 1.2, delay: "1.4s", dur: "11s" },
  { left: "81%", top: "48%", size: 1.8, delay: "0.6s", dur: "10s" },
  { left: "64%", top: "58%", size: 1.1, delay: "2.2s", dur: "12s" },
  { left: "88%", top: "32%", size: 1.4, delay: "3s", dur: "8.5s" },
  { left: "76%", top: "68%", size: 1.3, delay: "1.1s", dur: "13s" },
  { left: "54%", top: "42%", size: 1, delay: "2.8s", dur: "9.5s" },
  { left: "92%", top: "55%", size: 1.6, delay: "0.3s", dur: "10.5s" },
  { left: "68%", top: "22%", size: 1.2, delay: "4s", dur: "11.5s" },
  { left: "85%", top: "72%", size: 1.1, delay: "1.8s", dur: "12.5s" },
] as const;

export default function Hero() {
  const t = useTranslations("home.hero");
  const artRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spot, setSpot] = useState({ x: 72, y: 48, active: false });

  const pillarParts = t("pillars")
    .split(/[·•]/)
    .map((s) => s.trim())
    .filter(Boolean);

  useEffect(() => {
    const el = artRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let raf = 0;
    let nextTilt = { x: 0, y: 0 };
    let nextSpot = { x: 72, y: 48, active: false };

    function flush() {
      raf = 0;
      setTilt(nextTilt);
      setSpot(nextSpot);
    }

    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const px = nx - 0.5;
      const py = ny - 0.5;
      nextTilt = {
        x: -(py * MAX_TILT * 2),
        y: px * MAX_TILT * 2,
      };
      nextSpot = {
        x: Math.min(100, Math.max(0, nx * 100)),
        y: Math.min(100, Math.max(0, ny * 100)),
        active: true,
      };
      if (!raf) raf = requestAnimationFrame(flush);
    }

    function onLeave() {
      nextTilt = { x: 0, y: 0 };
      nextSpot = { ...nextSpot, active: false };
      if (!raf) raf = requestAnimationFrame(flush);
    }

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative flex min-h-[calc(100svh-52px)] flex-col overflow-hidden">
      {/* Ambient dark grid */}
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      {/* Soft cyan floor glow under ribbon */}
      <div
        className="pointer-events-none absolute inset-x-[35%] bottom-0 z-[1] h-[28%] opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 70% 100%, rgba(56,189,248,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Full-bleed dark ribbon art — feathered into page bg */}
      <div
        ref={artRef}
        className="pointer-events-auto absolute inset-0 z-0 overflow-hidden"
        style={{ perspective: "1400px" }}
        aria-hidden="true"
      >
        <div
          className="hero-ribbon-stage absolute inset-0 transition-transform duration-700 ease-out will-change-transform"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <div className="hero-ribbon-mask absolute inset-0">
            <Image
              src="/images/hero-concrete-ribbon-dark.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-contain object-right object-bottom"
            />
          </div>

          {/* Breathing glow along orange→purple edge */}
          <div className="hero-ribbon-breathe pointer-events-none absolute inset-0" />

          {/* Cursor spotlight — soft local illumination */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{
              opacity: spot.active ? 1 : 0.35,
              background: `radial-gradient(circle 28vmin at ${spot.x}% ${spot.y}%, rgba(255,180,140,0.16) 0%, rgba(168,85,247,0.08) 28%, transparent 62%)`,
              mixBlendMode: "soft-light",
            }}
          />
        </div>

        {/* Edge fade overlays — match --color-bg so the photo frame disappears */}
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: `
              linear-gradient(90deg, var(--color-bg) 0%, transparent 38%),
              linear-gradient(270deg, var(--color-bg) 0%, transparent 12%),
              linear-gradient(180deg, var(--color-bg) 0%, transparent 18%),
              linear-gradient(0deg, var(--color-bg) 0%, transparent 22%)
            `,
          }}
        />

        {/* Floating dust motes near the ribbon */}
        <div className="pointer-events-none absolute inset-0 z-[3] hidden sm:block">
          {DUST.map((d, i) => (
            <span
              key={i}
              className="hero-dust absolute rounded-full bg-white/50"
              style={{
                left: d.left,
                top: d.top,
                width: d.size,
                height: d.size,
                animationDelay: d.delay,
                animationDuration: d.dur,
              }}
            />
          ))}
        </div>
      </div>

      {/* Copy — structural LTR column */}
      <div className="chrome-ltr relative z-10 mx-auto flex w-full max-w-[var(--page-max)] flex-1 flex-col">
        <div className="relative flex flex-1 flex-col justify-center px-[var(--page-pad)] pt-8 pb-10 sm:pt-[7vh] lg:pt-[8vh] lg:pb-12">
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

            <div className="animate-fade-up chrome-ltr mt-9 sm:mt-11">
              <Button href="/services" variant="primary" className="hero-cta-magnetic">
                {t("cta")}
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
