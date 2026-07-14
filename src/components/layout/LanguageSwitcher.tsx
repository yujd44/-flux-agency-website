"use client";

import clsx from "clsx";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeShortLabels, type Locale } from "@/i18n/routing";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={clsx("chrome-ltr flex items-center gap-2.5", className)}>
      {locales.map((code, i) => (
        <div key={code} className="flex items-center gap-2.5">
          {i > 0 && <span className="h-3 w-px bg-border-strong" aria-hidden="true" />}
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: code, scroll: false })}
            aria-current={locale === code}
            className={clsx(
              "text-[12px] font-medium tracking-[0.08em] transition-colors duration-200",
              locale === code ? "text-text" : "text-muted hover:text-text",
            )}
          >
            {localeShortLabels[code]}
          </button>
        </div>
      ))}
    </div>
  );
}
