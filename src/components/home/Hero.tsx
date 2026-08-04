"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

const PILLARS = ["STRATEGY", "ARCHITECTURE", "DEVELOPMENT", "AUTOMATION", "SUPPORT"] as const;
const MAX_TILT = 0.5;
const TRUSTED = ["Solvix", "Nexora", "Akira Systems", "Lumen", "Dayone"] as const;

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
    <section className="relative flex min-h-[calc(100svh-70px)] flex-col overflow-hidden">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.45]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 eng-line-h" />
      <div className="pointer-events-none absolute inset-y-0 left-[var(--page-pad)] hidden eng-line-v lg:block" />

      <div className="chrome-ltr relative mx-auto grid w-full max-w-[var(--page-max)] flex-1 grid-cols-1 lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
        {/* Copy column — editorial air above, trust bar anchored low */}
        <div className="relative z-10 flex flex-col px-[var(--page-pad)] pt-[14vh] pb-10 lg:pt-[16vh] lg:pb-12">
          <BidiBlock>
            <div className="animate-fade-up chrome-ltr mb-7 inline-flex items-center gap-3">
              <span className="eng-marker" aria-hidden="true" />
              <span className="label-mono text-muted">{t("eyebrow")}</span>
            </div>

            <h1 className="animate-fade-up max-w-[11ch] text-[2.35rem] font-medium leading-[1.02] tracking-tight text-text sm:max-w-none sm:text-[3.25rem] lg:text-[3.75rem] xl:text-[4.15rem]">
              <span className="text-content">{t("titleBefore")}</span>
              <span className="hero-accent">{t("titleAccent")}</span>
              <span className="text-content">{t("titleAfter")}</span>
            </h1>

            <p className="animate-fade-up mt-6 max-w-[28rem] text-base leading-[1.65] text-muted sm:text-lg">
              {t("subtitle")}
            </p>

            <div className="animate-fade-up mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Button href="/services" variant="primary">
                {t("cta")}
              </Button>
              <Button href="/about" variant="ghost" showArrow={false}>
                {t("ctaSecondary")}
              </Button>
            </div>
          </BidiBlock>

          <div className="animate-fade-up mt-auto pt-16 lg:pt-20">
            <div className="label-mono mb-5 text-muted">{t("trustedBy")}</div>
            <div className="chrome-ltr flex flex-wrap items-center gap-x-7 gap-y-3 text-[12px] font-medium tracking-[0.14em] text-text/50 uppercase">
              {TRUSTED.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Ribbon column — bleeds off right/bottom; pillars sit in the valley */}
        <div
          ref={artRef}
          className="relative min-h-[320px] w-full sm:min-h-[420px] lg:min-h-0"
          style={{ perspective: "1200px" }}
        >
          <div className="pointer-events-none absolute top-[18%] bottom-[28%] left-0 z-20 hidden lg:flex">
            <div className="relative flex flex-col justify-between py-1 pr-5">
              <div className="absolute top-1 bottom-1 right-0 w-px bg-[rgba(80,70,60,0.22)]" />
              {PILLARS.map((label) => (
                <div key={label} className="relative flex items-center justify-end gap-3 pr-3">
                  <span className="label-mono text-muted/75">{label}</span>
                  <span className="eng-marker absolute right-[-2px]" />
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute -inset-y-[6%] -right-[8%] left-[-6%] transition-transform duration-300 ease-out will-change-transform lg:left-[-2%]"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
          >
            <Image
              src="/images/hero-concrete-ribbon.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-[42%_center] lg:object-center"
            />
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-bg via-bg/50 to-transparent lg:w-[18%]" />
        </div>
      </div>

      <div className="chrome-ltr relative z-10 mx-auto flex w-full max-w-[var(--page-max)] items-center justify-between gap-4 border-t border-border px-[var(--page-pad)] py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <span className="absolute inset-0 rounded-full border border-border-strong" />
            <span className="absolute inset-[3px] rounded-full border border-accent" />
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border-strong" />
            <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-border-strong" />
          </span>
          <span className="label-mono truncate text-muted">{t("pillars")}</span>
        </div>
        <span className="label-mono hidden shrink-0 items-center gap-2.5 text-muted sm:inline-flex">
          {t("scrollHint")}
          <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}
