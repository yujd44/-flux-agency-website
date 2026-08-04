"use client";

type Props = {
  before: string;
  accent: string;
  after: string;
};

/** Static headline — no magnetic word/letter pull (keeps readability across locales). */
export default function HeroHeadline({ before, accent, after }: Props) {
  return (
    <h1 className="hero-headline animate-fade-up max-w-[16ch] text-[2.15rem] font-medium leading-[1.16] tracking-[-0.015em] text-white sm:max-w-[18ch] sm:text-[2.9rem] lg:max-w-[17ch] lg:text-[3.4rem] xl:text-[3.75rem]">
      <span className="text-content drop-shadow-[0_1px_18px_rgba(0,0,0,0.35)]">
        {before}
      </span>
      <span className="hero-accent">{accent}</span>
      <span className="text-content drop-shadow-[0_1px_18px_rgba(0,0,0,0.35)]">
        {after}
      </span>
    </h1>
  );
}
