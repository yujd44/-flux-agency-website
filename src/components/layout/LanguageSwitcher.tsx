"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeShortLabels, type Locale } from "@/i18n/routing";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={clsx("chrome-ltr relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t("language")}
        onClick={() => setOpen((v) => !v)}
        className="label-mono inline-flex items-center gap-1.5 tracking-[0.18em] text-text transition-colors duration-200 hover:text-accent"
      >
        <span>{localeShortLabels[locale]}</span>
        <ChevronDown
          className={clsx("h-3 w-3 opacity-70 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("language")}
          className="absolute top-full right-0 z-50 mt-2 min-w-[4.5rem] border border-border-strong/80 bg-surface py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
        >
          {locales.map((code) => (
            <li key={code} role="option" aria-selected={locale === code}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (code !== locale) {
                    router.replace(pathname, { locale: code, scroll: false });
                  }
                }}
                className={clsx(
                  "label-mono flex w-full px-3 py-2 tracking-[0.18em] transition-colors duration-200",
                  locale === code
                    ? "bg-accent-soft text-text"
                    : "text-muted hover:bg-surface hover:text-text",
                )}
              >
                {localeShortLabels[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
