import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import StarOfDavid from "@/components/icons/StarOfDavid";
import LanguageSwitcher from "./LanguageSwitcher";

const navKeys = ["home", "services", "portfolio", "about", "contact"] as const;
const navHrefs: Record<(typeof navKeys)[number], string> = {
  home: "/",
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
            <div className="chrome-ltr mb-5 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-accent/50">
                <span className="h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-[15px] font-medium tracking-tight text-text">Flux Agency</span>
            </div>
            <p className="text-sm leading-relaxed text-muted">{tf("tagline")}</p>
            <StarOfDavid className="mt-8 h-5 w-5 text-accent/40" />
          </div>

          <div className="text-content">
            <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.18em] text-muted">
              {tf("navTitle")}
            </div>
            <ul className="flex flex-col gap-3">
              {navKeys.map((key) => (
                <li key={key}>
                  <Link
                    href={navHrefs[key]}
                    className="text-sm text-muted transition-colors hover:text-text"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-content">
            <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.18em] text-muted">
              {tf("contactTitle")}
            </div>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li>{tf("email")}</li>
              <li className="chrome-ltr">{tf("phone")}</li>
              <li>{tf("address")}</li>
            </ul>
          </div>

          <div>
            <div className="text-content mb-5 text-[12px] font-medium uppercase tracking-[0.18em] text-muted">
              {tf("languageTitle")}
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="chrome-ltr mt-14 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} {tf("copyright")}</span>
          <span className="tracking-[0.15em]">31.7683° N · 35.2137° E</span>
        </div>
      </Container>
    </footer>
  );
}
