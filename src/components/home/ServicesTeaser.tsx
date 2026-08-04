"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Container from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";

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

  const others = categories.filter((key) => key !== active);

  return (
    <section className="border-t border-border py-24 lg:py-32">
      <Container>
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
            className="group flex min-h-[280px] flex-col bg-bg p-8 transition-colors duration-300 hover:bg-surface/70 sm:min-h-[320px] sm:p-10 lg:min-h-[380px] lg:p-12"
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
                <span className="label-mono text-muted">
                  {tc(`${active}.number`)}
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

          <div className="flex flex-col gap-px bg-border">
            {others.map((key) => (
              <Link
                key={key}
                href="/services"
                onMouseEnter={() => setActive(key)}
                onFocus={() => setActive(key)}
                onClick={(event) => {
                  if (!hasFineHover()) {
                    event.preventDefault();
                    setActive(key);
                  }
                }}
                className="group flex flex-1 flex-col justify-center gap-3 bg-bg px-6 py-6 transition-colors duration-300 hover:bg-surface/70 focus-visible:bg-surface/70 focus-visible:outline-none sm:px-8 sm:py-7"
              >
                <span className="label-mono text-muted transition-colors duration-300 group-hover:text-text/70">
                  {tc(`${key}.number`)}
                </span>
                <span className="text-content text-lg font-medium tracking-tight text-text sm:text-xl">
                  {tc(`${key}.title`)}
                </span>
                <span className="text-content line-clamp-2 text-sm leading-[1.6] text-muted">
                  {tc(`${key}.description`)}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
