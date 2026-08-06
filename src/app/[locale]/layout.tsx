import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, rtlLocales, type Locale } from "@/i18n/routing";
import {
  fontLatin,
  fontMono,
  fontHeadline,
  fontHebrew,
  fontArabic,
} from "@/lib/fonts";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LogoIntro from "@/components/layout/LogoIntro";
import PortalTransition from "@/components/home/PortalTransition";
import { INTRO_BOOT_SCRIPT, INTRO_BOOT_STYLE } from "@/lib/intro-session";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return {
    title: messages.meta.title,
    description: messages.meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";

  // data-intro="wait" is the stable SSR default; INTRO_BOOT_SCRIPT may flip to
  // "done" before hydrate — suppressHydrationWarning allows that mismatch.
  return (
    <html
      lang={locale}
      dir={dir}
      data-intro="wait"
      suppressHydrationWarning
      className={`${fontLatin.variable} ${fontMono.variable} ${fontHeadline.variable} ${fontHebrew.variable} ${fontArabic.variable} h-full antialiased`}
    >
      <head>
        {/* Inline critical gate: black screen before CSS bundle; boot script may flip to done. */}
        <style dangerouslySetInnerHTML={{ __html: INTRO_BOOT_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-text">
        <NextIntlClientProvider messages={messages}>
          <LogoIntro />
          {/* SSR black cover until data-intro="done" — prevents ritual hero FOUC before React. */}
          <div id="intro-boot-gate" aria-hidden="true" />
          <div className="page-frame">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <PortalTransition />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
