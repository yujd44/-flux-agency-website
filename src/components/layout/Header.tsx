"use client";

import LanguageSwitcher from "./LanguageSwitcher";
import MethodaLogo from "@/components/brand/MethodaLogo";

/** Minimal chrome — logo + language only (one-page feel). Dark seamless, no divider. */
export default function Header() {
  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 bg-transparent">
        {/* Soft top veil so logo / lang stay readable over hero video */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 via-black/20 to-transparent"
          aria-hidden="true"
        />
        <div className="chrome-ltr relative mx-auto flex h-11 w-full max-w-[var(--page-max)] items-center justify-between px-[var(--page-pad)]">
          <MethodaLogo size={18} morph />
          <LanguageSwitcher className="[&_button]:text-[10px] [&_button]:tracking-[0.26em] [&_button]:text-white/85 [&_button:hover]:text-white" />
        </div>
      </header>
      <div className="h-11" aria-hidden="true" />
    </>
  );
}
