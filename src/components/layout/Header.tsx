"use client";

import { useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import StarOfDavid from "@/components/icons/StarOfDavid";
import ThemeToggle from "@/components/ui/ThemeToggle";

const navKeys = ["home", "services", "portfolio", "about", "contact"] as const;
const navHrefs: Record<(typeof navKeys)[number], string> = {
  home: "/",
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-bg/70 backdrop-blur-md">
        <div className="chrome-ltr mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="relative h-8 w-8 shrink-0">
              <Image
                src="/logo-mark.png"
                alt="Flux Agency"
                fill
                priority
                sizes="32px"
                className="object-contain"
              />
            </span>
            <span className="text-[15px] font-medium tracking-tight text-text">Flux Agency</span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {navKeys.map((key) => {
              const href = navHrefs[key];
              const active = pathname === href;
              return (
                <Link
                  key={key}
                  href={href}
                  className={clsx(
                    "text-content text-[13px] font-medium uppercase tracking-[0.1em] transition-colors duration-200",
                    active ? "text-text" : "text-muted hover:text-text",
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <StarOfDavid className="h-5 w-5 shrink-0 text-accent" />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menu")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="h-[73px]" aria-hidden="true" />
    </>
  );
}
