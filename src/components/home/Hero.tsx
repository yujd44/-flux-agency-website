"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

const PILLARS = ["STRATEGY", "ARCHITECTURE", "DEVELOPMENT", "AUTOMATION", "SUPPORT"] as const;

export default function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black_40%,transparent_90%)]" />

      {/* Engineering frame lines */}
      <div className="pointer-events-none absolute inset-x-0 top-0 eng-line-h" />
      <div className="pointer-events-none absolute inset-y-0 left-[var(--page-pad)] hidden eng-line-v lg:block" />

      <div className="chrome-ltr relative mx-auto grid w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[minmax(0,42%)_minmax(0,58%)] lg:items-stretch">
        {/* Text column ~40% */}
        <div className="relative z-10 px-6 pt-12 pb-10 sm:px-8 lg:flex lg:flex-col lg:justify-center lg:px-16 lg:py-20 xl:px-20">
          <BidiBlock>
            <div className="animate-fade-up chrome-ltr mb-8 inline-flex items-center gap-3">
              <span className="eng-marker" aria-hidden="true" />
              <span className="label-mono text-muted">{t("eyebrow")}</span>
            </div>

            <h1 className="animate-fade-up text-[2.75rem] font-medium leading-[0.98] tracking-tight text-text sm:text-6xl lg:text-[5.25rem] xl:text-[5.75rem]">
              <span className="text-content">{t("titleBefore")}</span>
              <span className="text-accent">{t("titleAccent")}</span>
              <span className="text-content">{t("titleAfter")}</span>
            </h1>

            <p className="animate-fade-up mt-7 max-w-md text-lg leading-[1.7] text-muted sm:text-xl">
              {t("subtitle")}
            </p>

            <div className="animate-fade-up mt-10 flex flex-wrap items-center gap-6">
              <Button href="/services" variant="primary">
                {t("cta")}
              </Button>
              <Button href="/about" variant="ghost" showArrow={false}>
                {t("ctaSecondary")}
              </Button>
            </div>
          </BidiBlock>

          {/* Trusted-by strip — light Phase 1 placeholder */}
          <div className="animate-fade-up mt-16 border-t border-border pt-8">
            <div className="label-mono mb-5 text-muted">{t("trustedBy")}</div>
            <div className="chrome-ltr flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] font-medium tracking-[0.12em] text-text/55 uppercase">
              <span>Solvix</span>
              <span>Nexora</span>
              <span>Akira Systems</span>
              <span>Lumen</span>
              <span>Dayone</span>
            </div>
          </div>
        </div>

        {/* Art column ~60% */}
        <div className="relative min-h-[360px] w-full sm:min-h-[460px] lg:min-h-[720px]">
          {/* Vertical service pillars along the seam */}
          <div className="pointer-events-none absolute top-16 bottom-24 left-0 z-20 hidden lg:flex">
            <div className="relative flex flex-col justify-between py-2 pl-6">
              <div className="absolute left-0 top-0 bottom-0 eng-line-v" />
              {PILLARS.map((label) => (
                <div key={label} className="relative flex items-center gap-3">
                  <span className="eng-marker absolute -left-[2px]" />
                  <span className="label-mono pl-4 text-muted/80">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-0 bg-surface/40">
            <Image
              src="/images/hero-concrete-ribbon.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center"
            />
          </div>

          {/* Soft edge blend into paper background — no hard card frame */}
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-bg via-bg/40 to-transparent lg:w-1/4" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-bg to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />

          <div className="chrome-ltr pointer-events-none absolute bottom-8 right-6 hidden items-center gap-3 sm:flex lg:right-10">
            <span className="label-mono text-muted">{t("scrollHint")}</span>
            <span className="eng-line-v h-8" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="chrome-ltr mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 border-t border-border px-6 py-5 sm:px-8 lg:px-16 xl:px-20">
        <div className="flex items-center gap-3">
          <span
            className="relative inline-flex h-4 w-4 items-center justify-center"
            aria-hidden="true"
          >
            <span className="absolute inset-0 rounded-full border border-border-strong" />
            <span className="absolute inset-[3px] rounded-full border border-accent" />
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border-strong" />
            <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-border-strong" />
          </span>
          <span className="label-mono text-muted">{t("pillars")}</span>
        </div>
        <span className="label-mono hidden text-muted sm:inline">{t("scrollHint")}</span>
      </div>
    </section>
  );
}
