"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";
import HeroHeadline from "@/components/home/HeroHeadline";
import AmbientToggle from "@/components/home/AmbientToggle";
import { useRibbonFx } from "@/hooks/useRibbonFx";
import { useTimeAccent } from "@/hooks/useTimeAccent";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useCrosshair } from "@/hooks/useCrosshair";

const HeroSpiral = dynamic(() => import("@/components/home/HeroSpiral"), {
  ssr: false,
  loading: () => null,
});

const DUST = [
  { left: "62%", top: "30%", size: 2.8, delay: "0s", dur: "8s" },
  { left: "74%", top: "38%", size: 2.4, delay: "1.2s", dur: "9.5s" },
  { left: "84%", top: "50%", size: 3.2, delay: "0.5s", dur: "8.5s" },
  { left: "68%", top: "60%", size: 2.2, delay: "2s", dur: "10s" },
  { left: "90%", top: "34%", size: 2.6, delay: "2.6s", dur: "7.5s" },
  { left: "78%", top: "70%", size: 2.5, delay: "1s", dur: "11s" },
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
      <div ref={crosshairRef} className="hero-crosshair" aria-hidden="true" />

      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.35]" />

      {/* Soft floor glow under sculpture */}
      <div
        className="hero-floor-glow pointer-events-none absolute inset-x-[22%] bottom-0 z-[1] h-[38%]"
        aria-hidden="true"
      />

      {/* Full-bleed spiral art — feathered into page bg */}
      <div
        ref={artRef}
        className="pointer-events-auto absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate3d(0, ${fx.scrollY}px, 0)`,
            transition: fx.spotActive ? "none" : "transform 0.7s ease-out",
          }}
        >
          <div className="hero-sculpture-float absolute inset-0">
            {/* Soft ambient halo around the spiral — clearly visible */}
            <div className="hero-spiral-glow pointer-events-none absolute inset-0" />

            <div className="hero-spiral-mask absolute inset-0">
              <HeroSpiral />
            </div>

            {/* Cursor spotlight — obvious local illumination */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-400"
              style={{
                opacity: fx.spotActive ? 1 : 0.7,
                background: `radial-gradient(circle 48vmin at ${fx.spotX}% ${fx.spotY}%, rgba(255,190,150,0.48) 0%, rgba(168,85,247,0.28) 34%, transparent 70%)`,
                mixBlendMode: "soft-light",
              }}
            />
          </div>
        </div>

        {/* Edge fade — match --color-bg so WebGL frame dissolves */}
        <div className="hero-edge-fade pointer-events-none absolute inset-0 z-[2]" />

        <div className="pointer-events-none absolute inset-0 z-[3] hidden sm:block">
          {DUST.map((d, i) => (
            <span
              key={i}
              className="hero-dust absolute rounded-full bg-white/60"
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
