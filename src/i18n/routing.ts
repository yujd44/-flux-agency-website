import { defineRouting } from "next-intl/routing";

export const locales = ["he", "ru", "en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "he";

export const localeLabels: Record<Locale, string> = {
  he: "עברית",
  ru: "Русский",
  en: "English",
  ar: "العربية",
};

export const localeShortLabels: Record<Locale, string> = {
  he: "HE",
  ru: "RU",
  en: "EN",
  ar: "AR",
};

export const rtlLocales: Locale[] = ["he", "ar"];

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
