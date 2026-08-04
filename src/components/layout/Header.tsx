"use client";

import LanguageSwitcher from "./LanguageSwitcher";
import MethodaLogo from "@/components/brand/MethodaLogo";

/** Minimal chrome — logo + language only (one-page feel). */
export default function Header() {
  return (
    <>
      <header className="fixed top-[var(--frame-inset)] right-[var(--frame-inset)] left-[var(--frame-inset)] z-50 border-b border-border/40 bg-bg/55 backdrop-blur-[1px]">
        <div className="chrome-ltr mx-auto flex w-full max-w-[var(--page-max)] items-center justify-between px-[var(--page-pad)] py-[1.15rem]">
          <MethodaLogo size={20} />
          <LanguageSwitcher className="[&_button]:text-[10px] [&_button]:tracking-[0.24em]" />
        </div>
      </header>
      <div className="h-[64px]" aria-hidden="true" />
    </>
  );
}
