"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import MethodaLogo from "@/components/brand/MethodaLogo";

/** Center nav — matches dark premium mock. */
const navKeys = ["services", "approach", "portfolio", "about", "insights"] as const;
const navHrefs: Record<(typeof navKeys)[number], string> = {
  services: "/services",
  approach: "/about#approach",
  portfolio: "/portfolio",
  about: "/about",
  insights: "/insights",
};

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Transparent, seamless — no dividing border under header */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-transparent">
        <div className="chrome-ltr mx-auto flex w-full max-w-[var(--page-max)] items-center justify-between px-[var(--page-pad)] py-5">
          <MethodaLogo size={22} />

          <nav className="hidden items-center gap-11 xl:gap-14 lg:flex">
            {navKeys.map((key) => {
              const href = navHrefs[key];
              const pathOnly = href.split("#")[0] ?? href;
              const active = pathname === pathOnly && !href.includes("#");
              return (
                <Link
                  key={key}
                  href={href}
                  className={clsx(
                    "label-mono text-content text-[10px] font-normal tracking-[0.3em] transition-colors duration-200",
                    active ? "text-text" : "text-muted/80 hover:text-text",
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="/contact"
              className="chrome-ltr inline-flex h-[38px] items-center gap-2.5 border border-white/55 px-3.5 text-[10px] font-normal tracking-[0.28em] uppercase text-text transition-colors hover:border-white"
              style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
            >
              <span className="eng-marker" aria-hidden="true" />
              <span>{t("letsTalk")}</span>
              <ArrowRight className="h-3 w-3" strokeWidth={1.25} />
            </Link>
            <LanguageSwitcher className="[&_button]:text-[10px] [&_button]:tracking-[0.26em]" />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menu")}
            className="flex h-9 w-9 items-center justify-center border border-border-strong text-text lg:hidden"
          >
            <Menu className="h-4 w-4" strokeWidth={1.25} />
          </button>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="h-[72px]" aria-hidden="true" />
    </>
  );
}
