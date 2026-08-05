"use client";

import { useTranslations } from "next-intl";

type Props = { active?: boolean };

export default function IntroStage({ active: _active = true }: Props) {
  const t = useTranslations("ritual.intro");

  return (
    <section id="intro" className="ritual-stage relative items-center justify-center overflow-hidden">
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <h1 className="ritual-headline ritual-brand-glow text-content text-[clamp(2.4rem,7vw,5.5rem)] leading-none tracking-[0.12em] text-white">
          {t("brand")}
        </h1>
        <p className="text-content mt-5 max-w-xl text-[clamp(0.95rem,2vw,1.25rem)] font-light tracking-wide text-[var(--ritual-muted)]">
          {t("tagline")}
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="ritual-scroll-hint" aria-hidden="true" />
      </div>
    </section>
  );
}
