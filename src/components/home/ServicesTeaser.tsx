"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Layers, Workflow, Server, MessageCircle } from "lucide-react";
import Container from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";

const categories = [
  { key: "digitalProducts", icon: Layers },
  { key: "businessAutomation", icon: Workflow },
  { key: "infrastructure", icon: Server },
  { key: "communication", icon: MessageCircle },
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

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ key, icon: Icon }, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="group relative flex flex-col gap-5 bg-bg p-8 transition-colors duration-300 hover:bg-surface"
            >
              <span className="text-content text-xs tracking-[0.15em] text-muted">
                {tc(`${key}.number`)}
              </span>
              <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
              <h3 className="text-content text-lg font-medium text-text">{tc(`${key}.title`)}</h3>
              <p className="text-content text-sm leading-relaxed text-muted">
                {tc(`${key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
