"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";
import HeroHeadline from "@/components/home/HeroHeadline";
import HeroConstellation from "@/components/home/HeroConstellation";
import AmbientToggle from "@/components/home/AmbientToggle";
import { useRibbonFx } from "@/hooks/useRibbonFx";
import { useTimeAccent } from "@/hooks/useTimeAccent";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useCrosshair } from "@/hooks/useCrosshair";

const DUST = [
  { left: "58%", top: "28%", size: 2.4, delay: "0s", dur: "9s" },
  { left: "72%", top: "36%", size: 2, delay: "1.4s", dur: "11s" },
  { left: "81%", top: "48%", size: 2.8, delay: "0.6s", dur: "10s" },
  { left: "64%", top: "58%", size: 1.8, delay: "2.2s", dur: "12s" },
  { left: "88%", top: "32%", size: 2.2, delay: "3s", dur: "8.5s" },
  { left: "76%", top: "68%", size: 2.1, delay: "1.1s", dur: "13s" },
  { left: "54%", top: "42%", size: 1.6, delay: "2.8s", dur: "9.5s" },
  { left: "92%", top: "55%", size: 2.5, delay: "0.3s", dur: "10.5s" },
  { left: "68%", top: "22%", size: 2, delay: "4s", dur: "11.5s" },
  { left: "85%", top: "72%", size: 1.9, delay: "1.8s", dur: "12.5s" },
  { left: "60%", top: "50%", size: 1.7, delay: "2.4s", dur: "10.8s" },
  { left: "78%", top: "40%", size: 2.3, delay: "0.9s", dur: "9.8s" },
] as const;

function MagneticCta({ label }: { label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useMagnetic(ref, { strength: 0.32, radius: 140 });
  return (
    <span ref={ref} className="inline-block will-change-transform">
      <Button href="/services" variant="primary" className="hero-cta-magnetic">
        {label}
      </Button>
    </span>
  );
}

export default function Hero() {
  const t = useTranslations("home.hero");
  const zoneRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const fx = useRibbonFx(artRef);
  useTimeAccent();
  useCrosshair(zoneRef, crosshairRef);

  return (
    <section
      ref={zoneRef}
      className="hero-zone relative flex min-h-[calc(100svh-44px)] flex-col overflow-hidden"
    >
      {/* Custom crosshair cursor (desktop) */}
      <div ref={crosshairRef} className="hero-crosshair" aria-hidden="true" />

      {/* Ambient dark grid */}
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      {/* Soft floor glow under ribbon */}
      <div
        className="pointer-events-none absolute inset-x-[28%] bottom-0 z-[1] h-[32%] opacity-90"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 70% 100%, rgba(255,106,61,0.16) 0%, rgba(139,92,246,0.14) 40%, transparent 72%)",
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
          className="hero-ribbon-stage absolute inset-0 will-change-transform"
          style={{
            transform: `translate3d(0, ${fx.scrollY}px, 0) rotateX(${fx.tiltX}deg) rotateY(${fx.tiltY}deg)`,
            transition: fx.spotActive ? "none" : "transform 0.7s ease-out",
          }}
        >
          {/* Continuous orbit / float — independent of pointer parallax */}
          <div className="hero-ribbon-orbit absolute inset-0">
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
                opacity: fx.spotActive ? 1 : 0.55,
                background: `radial-gradient(circle 42vmin at ${fx.spotX}% ${fx.spotY}%, rgba(255,180,140,0.32) 0%, rgba(168,85,247,0.16) 32%, transparent 68%)`,
                mixBlendMode: "soft-light",
              }}
            />

            {/* Glass refraction / specular highlight */}
            <div
              className="hero-ribbon-specular pointer-events-none absolute inset-0"
              style={{
                opacity: fx.spotActive ? 1 : 0.4,
                background: `radial-gradient(ellipse 24vmin 16vmin at ${fx.specularX}% ${fx.specularY}%, rgba(255,255,255,0.32) 0%, rgba(255,200,180,0.14) 35%, transparent 70%)`,
              }}
            />
          </div>
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

        <HeroConstellation />
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

            <HeroHeadline
              before={t("titleBefore")}
              accent={t("titleAccent")}
              after={t("titleAfter")}
            />

            <p className="animate-fade-up mt-6 max-w-[22rem] text-[0.95rem] font-light leading-[1.8] text-muted sm:mt-7 sm:max-w-[24rem] sm:text-[1rem] lg:mt-8 lg:max-w-[26rem]">
              {t("subtitle")}
            </p>

            <div className="animate-fade-up chrome-ltr mt-9 sm:mt-11">
              <MagneticCta label={t("cta")} />
            </div>
          </BidiBlock>
        </div>

        {/* Scroll hint */}
        <div className="chrome-ltr relative z-10 mx-[var(--page-pad)] flex items-center justify-end gap-3 border-t border-white/10 py-3.5">
          <span className="label-mono text-[10px] tracking-[0.22em] text-muted/70">
            {t("scrollHint")}
          </span>
          <span className="relative inline-flex h-7 w-px items-end" aria-hidden="true">
            <span className="absolute inset-x-0 top-0 bottom-1 bg-white/35" />
            <span className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[3px] border-t-[4px] border-x-transparent border-t-white/45" />
          </span>
        </div>
      </div>

      <AmbientToggle />
    </section>
  );
}
