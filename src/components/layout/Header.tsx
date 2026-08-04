"use client";

import LanguageSwitcher from "./LanguageSwitcher";
import MethodaLogo from "@/components/brand/MethodaLogo";

/** Minimal chrome — logo + language only (one-page feel). Dark seamless, no divider. */
export default function Header() {
  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 bg-transparent">
        <div className="chrome-ltr mx-auto flex w-full max-w-[var(--page-max)] items-center justify-between px-[var(--page-pad)] py-5">
          <MethodaLogo size={22} />
          <LanguageSwitcher className="[&_button]:text-[10px] [&_button]:tracking-[0.26em]" />
        </div>
      </header>
      <div className="h-[72px]" aria-hidden="true" />
    </>
  );
}
