"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const navKeys = ["home", "services", "portfolio", "about", "contact"] as const;
const navHrefs: Record<(typeof navKeys)[number], string> = {
  home: "/",
  services: "/services",
  portfolio: "/portfolio",
  about: "/about",
  contact: "/contact",
};

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-bg lg:hidden"
        >
          <div className="chrome-ltr flex h-full flex-col">
            <div className="flex items-center justify-between px-6 py-5 sm:px-8">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                {tCommon("language")}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-2 px-6 sm:px-8">
              {navKeys.map((key, index) => {
                const href = navHrefs[key];
                const active = pathname === href;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.4 }}
                  >
                    <Link
                      href={href}
                      onClick={onClose}
                      className="text-content flex items-baseline gap-4 py-3 text-[15px]"
                    >
                      <span className="text-xs text-muted">{String(index + 1).padStart(2, "0")}</span>
                      <span
                        className={
                          active
                            ? "text-3xl font-medium text-text"
                            : "text-3xl font-light text-muted"
                        }
                      >
                        {t(key)}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="border-t border-border px-6 py-8 sm:px-8">
              <LanguageSwitcher />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
