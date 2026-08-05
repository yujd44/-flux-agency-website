"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Box, Circle, Lightbulb, Sparkles } from "lucide-react";

export type StageId = "intro" | "method" | "realization" | "future";

const STAGES: { id: StageId; Icon: typeof Lightbulb }[] = [
  { id: "intro", Icon: Lightbulb },
  { id: "method", Icon: Box },
  { id: "realization", Icon: Circle },
  { id: "future", Icon: Sparkles },
];

type Props = {
  active: StageId;
  onSelect: (id: StageId | "works") => void;
};

export default function StageRail({ active, onSelect }: Props) {
  const t = useTranslations("ritual.stages");

  return (
    <nav
      className="chrome-ltr pointer-events-none fixed top-1/2 right-3 z-40 hidden -translate-y-1/2 sm:right-5 md:block lg:right-8"
      aria-label={t("aria")}
    >
      <ol className="pointer-events-auto relative flex flex-col items-end gap-6">
        <span
          className="absolute top-2 right-[9px] bottom-2 w-px bg-gradient-to-b from-white/10 via-white/25 to-white/10"
          aria-hidden="true"
        />
        {STAGES.map(({ id, Icon }) => {
          const isActive = active === id;
          return (
            <li key={id} className="relative z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelect(id)}
                className={clsx(
                  "text-content label-mono text-[10px] tracking-[0.22em] transition-colors duration-300",
                  isActive ? "text-[var(--ritual-cyan,#4df3ff)]" : "text-white/35 hover:text-white/70",
                )}
              >
                {t(id)}
              </button>
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={isActive ? "true" : undefined}
                aria-label={t(id)}
                className={clsx(
                  "flex h-[19px] w-[19px] items-center justify-center rounded-full border transition-all duration-300",
                  isActive
                    ? "border-[var(--ritual-cyan,#4df3ff)] bg-[var(--ritual-cyan,#4df3ff)]/20 shadow-[0_0_16px_rgba(77,243,255,0.55)]"
                    : "border-white/25 bg-[#07080c]/80 hover:border-white/50",
                )}
              >
                <Icon
                  className={clsx("h-2.5 w-2.5", isActive ? "text-white" : "text-white/45")}
                  strokeWidth={1.6}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
