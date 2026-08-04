"use client";

import { motion } from "framer-motion";
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

export default function ServicesTeaser() {
  const t = useTranslations("home.servicesTeaser");
  const tc = useTranslations("services.categories");

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

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((key, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Link
                href="/services"
                className="flex h-full flex-col gap-5 bg-bg p-8 transition-colors duration-300 hover:bg-surface/70"
              >
                <span className="label-mono text-muted">{tc(`${key}.number`)}</span>
                <h3 className="text-content text-xl font-medium tracking-tight text-text">
                  {tc(`${key}.title`)}
                </h3>
                <p className="text-content text-base leading-[1.7] text-muted">
                  {tc(`${key}.description`)}
                </p>
                <div className="chrome-ltr mt-auto flex items-center gap-2 pt-2">
                  <span className="eng-marker" aria-hidden="true" />
                  <span className="eng-line-h max-w-[40px] flex-1" aria-hidden="true" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
