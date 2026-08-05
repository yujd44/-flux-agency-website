"use client";

import { useTranslations } from "next-intl";
import Container from "@/components/ui/Container";
import MethodaLogo from "@/components/brand/MethodaLogo";
import LanguageSwitcher from "./LanguageSwitcher";
import { usePathname } from "@/i18n/navigation";

/** Minimal footer — brand, contact, language. Hidden on ritual home. */
export default function Footer() {
  const tf = useTranslations("footer");
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";

  if (isHome) return null;

  return (
    <footer className="border-t border-border bg-bg">
      <Container className="py-12 sm:py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-content max-w-sm">
            <div className="mb-4">
              <MethodaLogo size={22} />
            </div>
            <p className="text-sm leading-[1.7] text-muted">{tf("tagline")}</p>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-14">
            <div className="text-content">
              <div className="label-mono mb-4 text-muted">{tf("contactTitle")}</div>
              <ul className="flex flex-col gap-2 text-sm text-muted">
                <li>{tf("email")}</li>
                <li className="chrome-ltr">{tf("phone")}</li>
              </ul>
            </div>

            <div>
              <div className="text-content label-mono mb-4 text-muted">
                {tf("languageTitle")}
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="chrome-ltr mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <span>
            © {new Date().getFullYear()} {tf("copyright")}
          </span>
          <span className="label-mono tracking-[0.2em]">We engineer systems.</span>
        </div>
      </Container>
    </footer>
  );
}
