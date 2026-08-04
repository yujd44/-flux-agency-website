"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";
import HeroHeadline from "@/components/home/HeroHeadline";
import { useTimeAccent } from "@/hooks/useTimeAccent";
import { useMagnetic } from "@/hooks/useMagnetic";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  useTimeAccent();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (mq.matches) {
        video.pause();
        video.removeAttribute("autoplay");
      } else {
        void video.play().catch(() => {
          /* autoplay may be blocked — poster remains */
        });
      }
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section className="hero-zone relative flex min-h-[calc(100svh-44px)] flex-col overflow-hidden">
      {/* Full-viewport cinematic background */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <video
          ref={videoRef}
          className="hero-bg-video absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/videos/hero-atmosphere-poster.jpg"
        >
          <source src="/videos/hero-atmosphere.mp4" type="video/mp4" />
        </video>

        {/* Legibility scrim — left/copy side + soft global veil, video stays visible */}
        <div className="hero-video-scrim absolute inset-0" />
      </div>

      {/* Copy — structural LTR column */}
      <div className="chrome-ltr relative z-10 mx-auto flex w-full max-w-[var(--page-max)] flex-1 flex-col">
        <div className="relative flex flex-1 flex-col justify-center px-[var(--page-pad)] pt-8 pb-10 sm:pt-[7vh] lg:pt-[8vh] lg:pb-12">
          <BidiBlock className="w-full max-w-[min(100%,28rem)] sm:max-w-[30rem] lg:max-w-[34rem]">
            <div className="animate-fade-up mb-7 inline-flex items-center gap-3 lg:mb-9">
              <span className="h-px w-3 bg-white/55" aria-hidden="true" />
              <span className="label-mono text-[10px] tracking-[0.32em] text-white/70">
                {t("eyebrow")}
              </span>
            </div>

            <HeroHeadline
              before={t("titleBefore")}
              accent={t("titleAccent")}
              after={t("titleAfter")}
            />

            <p className="animate-fade-up mt-6 max-w-[22rem] text-[0.95rem] font-light leading-[1.8] text-white/72 sm:mt-7 sm:max-w-[24rem] sm:text-[1rem] lg:mt-8 lg:max-w-[26rem]">
              {t("subtitle")}
            </p>

            <div className="animate-fade-up chrome-ltr mt-9 sm:mt-11">
              <MagneticCta label={t("cta")} />
            </div>
          </BidiBlock>
        </div>

        <div className="chrome-ltr relative z-10 mx-[var(--page-pad)] flex items-center justify-end gap-3 border-t border-white/15 py-3.5">
          <span className="label-mono text-[10px] tracking-[0.22em] text-white/55">
            {t("scrollHint")}
          </span>
          <span className="relative inline-flex h-7 w-px items-end" aria-hidden="true">
            <span className="absolute inset-x-0 top-0 bottom-1 bg-white/40" />
            <span className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[3px] border-t-[4px] border-x-transparent border-t-white/50" />
          </span>
        </div>
      </div>
    </section>
  );
}
