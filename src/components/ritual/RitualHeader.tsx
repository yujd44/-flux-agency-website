"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import MethodaLogo from "@/components/brand/MethodaLogo";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import type { StageId } from "./StageRail";

const NAV: { id: StageId | "works"; labelKey: string }[] = [
  { id: "intro", labelKey: "home" },
  { id: "method", labelKey: "method" },
  { id: "realization", labelKey: "services" },
  { id: "works", labelKey: "works" },
  { id: "future", labelKey: "contact" },
];

type Props = {
  onNavigate: (id: StageId | "works") => void;
  active: StageId;
};

export default function RitualHeader({ onNavigate, active }: Props) {
  const t = useTranslations("ritual.nav");

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-transparent">
      <div className="chrome-ltr mx-auto flex h-14 w-full max-w-[var(--page-max)] items-center justify-between gap-4 px-[var(--page-pad)]">
        <button
          type="button"
          onClick={() => onNavigate("intro")}
          className="ritual-brand-glow shrink-0 text-[var(--ritual-cyan,#4df3ff)]"
          aria-label="METHODEA"
        >
          <MethodaLogo size={18} morph />
        </button>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label={t("aria")}>
          {NAV.map((item) => {
            const isActive =
              item.id === "works"
                ? active === "realization"
                : item.id === active || (item.id === "intro" && active === "intro");
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={clsx(
                  "label-mono text-[10px] tracking-[0.24em] transition-colors duration-200",
                  isActive
                    ? "text-[var(--ritual-cyan,#4df3ff)]"
                    : "text-white/55 hover:text-white",
                )}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>

        <div className="ritual-glass chrome-ltr rounded-full px-3 py-1.5">
          <LanguageSwitcher className="[&_button]:text-[10px] [&_button]:tracking-[0.22em] [&_button]:text-white/80 [&_button:hover]:text-[var(--ritual-cyan,#4df3ff)] [&_ul]:rounded-xl [&_ul]:border-white/15 [&_ul]:bg-[#0a0c12]/95 [&_ul]:backdrop-blur-md" />
        </div>
      </div>
    </header>
  );
}
