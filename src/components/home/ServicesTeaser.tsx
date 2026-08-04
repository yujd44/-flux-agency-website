"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import Container from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";
import { categoryIcons } from "@/lib/services-data";

const categories = [
  "digitalProducts",
  "businessAutomation",
  "infrastructure",
  "communication",
] as const;

type CategoryKey = (typeof categories)[number];

function hasFineHover() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

export default function ServicesTeaser() {
  const t = useTranslations("home.servicesTeaser");
  const tc = useTranslations("services.categories");
  const [active, setActive] = useState<CategoryKey>("digitalProducts");
  const ActiveIcon = categoryIcons[active];

  return (
    <section className="section-atmosphere border-t border-border py-24 lg:py-32">
      <Container className="relative z-10">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("subtitle")}
          />
          <div className="chrome-ltr shrink-0">
            <Button href="/services">{t("cta")}</Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]"
        >
          <Link
            href="/services"
            className="group flex min-h-[280px] flex-col bg-bg/90 p-8 transition-colors duration-300 hover:bg-surface/70 sm:min-h-[320px] sm:p-10 lg:min-h-[380px] lg:p-12"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-full flex-1 flex-col"
              >
                <span className="chrome-ltr inline-flex text-muted" aria-hidden="true">
                  <ActiveIcon className="h-5 w-5" strokeWidth={1.25} />
                </span>
                <div className="mt-auto pt-12">
                  <h3 className="text-content text-3xl font-medium tracking-tight text-text sm:text-4xl lg:text-[42px] lg:leading-[1.1]">
                    {tc(`${active}.title`)}
                  </h3>
                  <p className="text-content mt-5 max-w-md text-base leading-[1.7] text-muted sm:text-lg">
                    {tc(`${active}.description`)}
                  </p>
                  <div className="chrome-ltr mt-8 flex items-center gap-2">
                    <span className="eng-marker" aria-hidden="true" />
                    <span
                      className="eng-line-h max-w-[56px] flex-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </Link>

          <div className="flex flex-col gap-px bg-border" role="list">
            {categories.map((key) => {
              const isActive = key === active;
              const Icon = categoryIcons[key];

              return (
                <Link
                  key={key}
                  href="/services"
                  role="listitem"
                  aria-current={isActive ? "true" : undefined}
                  onMouseEnter={() => {
                    if (hasFineHover()) setActive(key);
                  }}
                  onFocus={() => setActive(key)}
                  onClick={(event) => {
                    if (!hasFineHover() && active !== key) {
                      event.preventDefault();
                      setActive(key);
                    }
                  }}
                  className={clsx(
                    "group flex flex-1 flex-col justify-center gap-2 px-6 py-5 transition-colors duration-300 focus-visible:outline-none sm:px-8 sm:py-6",
                    isActive
                      ? "bg-surface/90"
                      : "bg-bg/90 hover:bg-surface/60 focus-visible:bg-surface/60",
                  )}
                >
                  <div className="chrome-ltr flex items-center gap-3">
                    <span
                      className={clsx(
                        "eng-marker transition-opacity duration-300",
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                      )}
                      aria-hidden="true"
                    />
                    <Icon
                      className={clsx(
                        "h-4 w-4 shrink-0 transition-colors duration-300",
                        isActive ? "text-text/80" : "text-muted group-hover:text-text/70",
                      )}
                      strokeWidth={1.25}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    className={clsx(
                      "text-content text-lg font-medium tracking-tight transition-colors duration-300 sm:text-xl",
                      isActive ? "text-text" : "text-text/75 group-hover:text-text",
                    )}
                  >
                    {tc(`${key}.title`)}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
