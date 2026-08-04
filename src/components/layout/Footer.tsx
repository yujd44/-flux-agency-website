import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import MethodaLogo from "@/components/brand/MethodaLogo";
import LanguageSwitcher from "./LanguageSwitcher";

const navKeys = ["services", "portfolio", "about", "contact"] as const;
const navHrefs: Record<(typeof navKeys)[number], string> = {
  services: "/services",
  portfolio: "/portfolio",
  about: "/about",
  contact: "/contact",
};

export default function Footer() {
  const t = useTranslations("nav");
  const tf = useTranslations("footer");

  return (
    <footer className="border-t border-border">
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="text-content max-w-sm">
            <div className="mb-5">
              <MethodaLogo size={24} />
            </div>
            <p className="text-base leading-[1.7] text-muted">{tf("tagline")}</p>
          </div>

          <div className="text-content">
            <div className="label-mono mb-5 text-muted">{tf("navTitle")}</div>
            <ul className="flex flex-col gap-3">
              {navKeys.map((key) => (
                <li key={key}>
                  <Link
                    href={navHrefs[key]}
                    className="text-base text-muted transition-colors hover:text-text"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-content">
            <div className="label-mono mb-5 text-muted">{tf("contactTitle")}</div>
            <ul className="flex flex-col gap-3 text-base text-muted">
              <li>{tf("email")}</li>
              <li className="chrome-ltr">{tf("phone")}</li>
              <li>{tf("address")}</li>
            </ul>
          </div>

          <div>
            <div className="text-content label-mono mb-5 text-muted">
              {tf("languageTitle")}
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="chrome-ltr mt-14 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} {tf("copyright")}</span>
          <span className="label-mono tracking-[0.2em]">We engineer systems.</span>
        </div>
      </Container>
    </footer>
  );
}
