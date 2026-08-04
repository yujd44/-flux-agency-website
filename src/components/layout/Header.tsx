"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, LayoutGrid, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import MethodaLogo from "@/components/brand/MethodaLogo";

/** Center nav — routes kept; labels styled as mono caps via i18n. */
const navKeys = ["services", "portfolio", "about", "contact"] as const;
const navHrefs: Record<(typeof navKeys)[number], string> = {
  services: "/services",
  portfolio: "/portfolio",
  about: "/about",
  contact: "/contact",
};

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-bg/85 backdrop-blur-[2px]">
        <div className="chrome-ltr mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-5 sm:px-8 lg:px-16 xl:px-20">
          <MethodaLogo size={26} />

          <nav className="hidden items-center gap-10 xl:gap-12 lg:flex">
            {navKeys.map((key) => {
              const href = navHrefs[key];
              const active = pathname === href;
              return (
                <Link
                  key={key}
                  href={href}
                  className={clsx(
                    "label-mono text-content transition-colors duration-200",
                    active ? "text-text" : "text-muted hover:text-text",
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/contact"
              className="chrome-ltr inline-flex h-[44px] items-center gap-2.5 border border-border-strong px-4 text-[11px] font-normal tracking-[0.22em] uppercase text-text transition-colors hover:border-accent-secondary"
              style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
            >
              <LayoutGrid className="h-3.5 w-3.5 opacity-70" strokeWidth={1.5} />
              <span>{t("letsTalk")}</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
            <LanguageSwitcher />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menu")}
            className="flex h-10 w-10 items-center justify-center border border-border text-text lg:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="h-[78px]" aria-hidden="true" />
    </>
  );
}
