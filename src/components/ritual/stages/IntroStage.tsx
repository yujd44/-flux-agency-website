"use client";

import { useTranslations } from "next-intl";

type Props = { active?: boolean };

export default function IntroStage({ active: _active = true }: Props) {
  const t = useTranslations("ritual.intro");

  return (
    <section id="intro" className="ritual-stage relative items-center justify-center overflow-x-hidden">
      <div className="relative z-10 flex w-full max-w-full flex-col items-center px-2 text-center sm:px-4">
        <h1 className="ritual-headline ritual-brand-glow text-content max-w-full text-[clamp(1.85rem,9vw,5.5rem)] leading-none tracking-[0.08em] text-white sm:tracking-[0.12em]">
          {t("brand")}
        </h1>
        <p className="text-content mt-4 max-w-xl text-[clamp(0.9rem,3.6vw,1.25rem)] font-light tracking-wide text-[var(--ritual-muted)] sm:mt-5">
          {t("tagline")}
        </p>
      </div>

      <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8">
        <span className="ritual-scroll-hint" aria-hidden="true" />
      </div>
    </section>
  );
}
