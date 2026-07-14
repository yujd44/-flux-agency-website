"use client";

import clsx from "clsx";
import { useLocale } from "next-intl";
import { rtlLocales, type Locale } from "@/i18n/routing";

/**
 * Wraps text-bearing content that lives inside a `.chrome-ltr` structural
 * container (e.g. a hero grid whose left/right arrangement must stay fixed
 * across locales). Restores correct reading direction + alignment for the
 * active locale without affecting the physical position of the container.
 */
export default function BidiBlock({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "span";
}) {
  const locale = useLocale() as Locale;
  const rtl = rtlLocales.includes(locale);

  return (
    <Tag
      dir={rtl ? "rtl" : "ltr"}
      className={clsx("text-content", rtl ? "text-right" : "text-left", className)}
    >
      {children}
    </Tag>
  );
}
