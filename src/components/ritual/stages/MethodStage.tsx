"use client";

import { useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { CloudUpload, Code2, Search } from "lucide-react";
import BidiBlock from "@/components/ui/BidiBlock";

const PHASES = [
  { id: "analysis", Icon: Search },
  { id: "engineering", Icon: Code2 },
  { id: "optimization", Icon: CloudUpload },
] as const;

type Props = { active?: boolean };

export default function MethodStage({ active: _active = true }: Props) {
  const t = useTranslations("ritual.method");
  const [phase, setPhase] = useState<(typeof PHASES)[number]["id"]>("analysis");

  return (
    <section id="method" className="ritual-stage relative overflow-hidden">
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center gap-10 lg:gap-14">
        <div className="text-content max-w-3xl">
          <p className="label-mono mb-4 text-[var(--ritual-cyan)]">{t("eyebrow")}</p>
          <h2 className="ritual-headline text-[clamp(1.75rem,4.5vw,3.4rem)] leading-[1.15] text-white">
            {t("title")}
            <br />
            <span className="text-white/90">{t("titleLine2")}</span>
          </h2>
        </div>

        <div className="chrome-ltr grid gap-4 md:grid-cols-3">
          {PHASES.map(({ id, Icon }) => {
            const isActive = phase === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPhase(id)}
                onMouseEnter={() => setPhase(id)}
                className={clsx(
                  "ritual-glass ritual-glass-hover rounded-2xl p-5 text-start sm:p-6",
                  isActive && "border-[rgba(77,243,255,0.35)] shadow-[0_0_28px_rgba(77,243,255,0.12)]",
                )}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5">
                    <Icon className="h-4 w-4 text-[var(--ritual-cyan)]" strokeWidth={1.5} />
                  </span>
                  <BidiBlock className="label-mono text-[11px] tracking-[0.16em] text-white">
                    {t(`phases.${id}.title`)}
                  </BidiBlock>
                </div>
                <BidiBlock className="text-sm leading-relaxed text-[var(--ritual-muted)]">
                  {t(`phases.${id}.body`)}
                </BidiBlock>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
