"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

const PILLARS = ["STRATEGY", "ARCHITECTURE", "DEVELOPMENT", "AUTOMATION", "SUPPORT"] as const;
const MAX_TILT = 0.5;

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

      <div className="chrome-ltr relative mx-auto grid w-full max-w-[var(--page-max)] flex-1 grid-cols-1 lg:grid-cols-[minmax(0,44%)_minmax(0,56%)]">
        {/* Copy column — airy stack matching mock proportions */}
        <div className="relative z-10 flex flex-col justify-center px-[var(--page-pad)] pt-16 pb-12 sm:pt-[12vh] lg:pt-[14vh] lg:pb-16">
          <BidiBlock>
            <div className="animate-fade-up chrome-ltr mb-6 inline-flex items-center gap-3 lg:mb-8">
              <span className="eng-marker" aria-hidden="true" />
              <span className="label-mono text-muted">{t("eyebrow")}</span>
            </div>

            <h1 className="animate-fade-up max-w-[12ch] text-[2.25rem] font-medium leading-[1.05] tracking-tight text-text sm:max-w-[16ch] sm:text-[3.1rem] lg:max-w-[15ch] lg:text-[3.55rem] xl:text-[3.9rem]">
              <span className="text-content">{t("titleBefore")}</span>
              <span className="hero-accent">{t("titleAccent")}</span>
              <span className="text-content">{t("titleAfter")}</span>
            </h1>

            <p className="animate-fade-up mt-5 max-w-[26rem] text-[0.95rem] leading-[1.7] text-muted sm:mt-6 sm:text-base lg:mt-7 lg:max-w-[27rem] lg:text-[1.05rem]">
              {t("subtitle")}
            </p>

            <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-x-9 gap-y-4 sm:mt-10">
              <Button href="/services" variant="primary">
                {t("cta")}
              </Button>
              <Button href="/about" variant="ghost" showArrow={false}>
                {t("ctaSecondary")}
              </Button>
            </div>
          </BidiBlock>
        </div>

        {/* Ribbon column — smaller art in right zone; pillars bridge text ↔ sculpture */}
        <div
          ref={artRef}
          className="relative min-h-[280px] w-full sm:min-h-[360px] lg:min-h-0"
          style={{ perspective: "1200px" }}
        >
          <div className="pointer-events-none absolute top-[22%] bottom-[30%] left-[2%] z-20 hidden lg:flex xl:left-[4%]">
            <div className="relative flex flex-col justify-between py-1 pr-4">
              <div className="absolute top-1 bottom-1 right-0 w-px bg-[rgba(80,70,60,0.22)]" />
              <div className="absolute top-1 right-0 h-px w-10 translate-x-full bg-[rgba(80,70,60,0.22)]" />
              {PILLARS.map((label, i) => (
                <div key={label} className="relative flex items-center justify-end gap-3 pr-3">
                  <span className="label-mono text-[10px] tracking-[0.16em] text-muted/70">
                    {label}
                  </span>
                  <span
                    className={`eng-marker absolute right-[-2px] ${i % 2 === 1 ? "opacity-45" : ""}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute top-[6%] bottom-[-4%] left-[14%] -right-[5%] transition-transform duration-300 ease-out will-change-transform sm:left-[18%] lg:left-[16%] lg:-right-[4%]"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
          >
            <Image
              src="/images/hero-concrete-ribbon.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-contain object-right-bottom lg:object-[78%_42%]"
            />
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-bg via-bg/55 to-transparent lg:w-[22%]" />
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
