"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import { portfolioCases } from "@/lib/portfolio-data";

export default function PortfolioTeaser() {
  const t = useTranslations("home.portfolioTeaser");
  const tp = useTranslations("portfolio.cases");

  const featured = portfolioCases.slice(0, 3);

  return (
    <section className="border-t border-border py-24 lg:py-32">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
          <div className="chrome-ltr shrink-0">
            <Button href="/portfolio">{t("cta")}</Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
            >
              <Link
                href="/portfolio"
                className="group block overflow-hidden rounded-2xl border border-border transition-colors duration-300 hover:border-accent/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 90vw, 30vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="text-content mb-2 text-[11px] uppercase tracking-[0.14em] text-accent">
                    {tp(`${item.id}.tag`)}
                  </div>
                  <h3 className="text-content text-lg font-medium text-text">
                    {tp(`${item.id}.title`)}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
