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
    <header
      className="fixed top-0 right-0 left-0 z-50 bg-transparent pt-[env(safe-area-inset-top,0px)]"
    >
      <div className="ritual-header-veil" aria-hidden="true" />
      <div className="chrome-ltr relative mx-auto flex h-14 w-full max-w-[var(--page-max)] items-center justify-between gap-2 px-[var(--page-pad)] sm:h-[4.25rem] sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigate("intro")}
          className="ritual-brand-glow flex min-h-11 min-w-11 shrink-0 items-center text-white"
          aria-label="Methodea"
        >
          <MethodaLogo size={30} morph href="" />
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
                  "label-mono text-[11px] tracking-[0.22em] transition-colors duration-200",
                  isActive
                    ? "text-[var(--ritual-cyan,#4df3ff)]"
                    : "text-white/78 hover:text-white",
                )}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>

        <div className="ritual-glass chrome-ltr shrink-0 rounded-full px-1.5 py-1 touch-manipulation sm:px-3 sm:py-1.5">
          <LanguageSwitcher className="[&_button]:min-h-11 [&_button]:min-w-[2.75rem] [&_button]:justify-center [&_button]:px-2 [&_button]:text-[10px] [&_button]:tracking-[0.14em] sm:[&_button]:min-h-0 sm:[&_button]:min-w-0 sm:[&_button]:tracking-[0.22em] [&_button]:text-white/90 [&_button:hover]:text-[var(--ritual-cyan,#4df3ff)] [&_ul]:rounded-xl [&_ul]:border-white/15 [&_ul]:bg-[#0a0c12]/95 md:[&_ul]:backdrop-blur-md [&_ul_button]:min-h-11 sm:[&_ul_button]:min-h-0" />
        </div>
      </div>
    </header>
  );
}
