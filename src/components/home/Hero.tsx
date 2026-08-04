"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

const PILLARS = ["STRATEGY", "ARCHITECTURE", "DEVELOPMENT", "AUTOMATION", "SUPPORT"] as const;
const MAX_TILT = 0.35;

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
    <section className="relative flex min-h-[calc(100svh-64px)] flex-col overflow-hidden">
      {/* Step 5 — grid almost invisible */}
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.22]" />

      {/* Step 1+2 — monumental sculpture as page plane, not a right column card */}
      <div
        ref={artRef}
        className="pointer-events-auto absolute inset-0 z-0"
        style={{ perspective: "1400px" }}
        aria-hidden="true"
      >
        <div
          className="absolute -top-[10%] -right-[8%] bottom-[-12%] left-[42%] transition-transform duration-500 ease-out will-change-transform sm:left-[34%] lg:left-[33%] xl:left-[35%]"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <Image
            src="/images/hero-concrete-ribbon.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 85vw, 68vw"
            className="object-cover object-[12%_46%] sm:object-[16%_44%] lg:object-[20%_42%] scale-[1.08]"
          />
        </div>

        {/* Soft blend into page bg — no framed rectangle */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-bg from-35% via-bg/85 to-transparent sm:w-[42%] lg:w-[40%]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-bg/35 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg/50 to-transparent" />
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
              <Button href="/about" variant="ghost" showArrow={false}>
                {t("ctaSecondary")}
              </Button>
            </div>
          </BidiBlock>

          {/* Step 4 — strategy pillars as engineering schematic in the mid zone */}
          <div className="pointer-events-none absolute top-[26%] bottom-[28%] left-[min(52%,calc(100%-11rem))] z-20 hidden lg:block xl:left-[54%]">
            <div className="relative flex h-full flex-col justify-between py-2">
              {/* Vertical guide */}
              <div className="absolute top-0 bottom-0 left-[calc(100%-1px)] w-px bg-[rgba(80,70,60,0.18)]" />
              {/* Long horizontal datum across mid field toward sculpture */}
              <div className="absolute top-1/2 right-0 h-px w-[min(28vw,220px)] translate-x-full -translate-y-1/2 bg-[rgba(80,70,60,0.14)]" />

              {PILLARS.map((label, i) => (
                <div key={label} className="relative flex items-center justify-end gap-3 pr-3">
                  <span className="label-mono text-[9px] tracking-[0.2em] text-muted/55">
                    {label}
                  </span>
                  {/* Tick + square terminal */}
                  <span
                    className="absolute right-0 top-1/2 h-px w-5 -translate-y-1/2 bg-[rgba(80,70,60,0.2)]"
                    aria-hidden="true"
                  />
                  <span
                    className={`eng-marker absolute right-[-2px] top-1/2 -translate-y-1/2 ${
                      i % 2 === 1 ? "opacity-40" : "opacity-75"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 7 — bottom bar as unifier across the composition */}
        <div className="chrome-ltr relative z-10 mx-[var(--page-pad)] flex items-center justify-between gap-4 border-t border-[rgba(80,70,60,0.14)] py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="relative inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <span className="absolute inset-0 rounded-full border border-border-strong/70" />
              <span className="absolute inset-[2.5px] rounded-full border border-accent/80" />
              <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border-strong/70" />
              <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-border-strong/70" />
            </span>
            <span className="label-mono truncate text-[10px] tracking-[0.22em] text-muted/70">
              {t("pillars")}
            </span>
          </div>
          <span className="label-mono hidden shrink-0 items-center gap-2 text-[10px] tracking-[0.22em] text-muted/70 sm:inline-flex">
            {t("scrollHint")}
            <ArrowDown className="h-3 w-3" strokeWidth={1.25} aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  );
}
