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

  const [featured, ...rest] = portfolioCases.slice(0, 3);

  return (
    <section className="section-atmosphere border-t border-border py-24 lg:py-32">
      <Container className="relative z-10">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
          <div className="chrome-ltr shrink-0">
            <Button href="/portfolio">{t("cta")}</Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border lg:grid-cols-12 lg:grid-rows-[minmax(240px,1fr)_minmax(240px,1fr)] lg:min-h-[560px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 lg:row-span-2"
          >
            <Link
              href="/portfolio"
              className="group relative flex h-full min-h-[320px] flex-col overflow-hidden bg-bg/90 transition-colors duration-300 hover:bg-surface/50 sm:min-h-[380px] lg:min-h-full"
            >
              <div className="relative min-h-[220px] flex-1 overflow-hidden sm:min-h-[280px]">
                <Image
                  src={featured.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover transition-opacity duration-500 group-hover:opacity-90"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/35 to-transparent" />
              </div>
              <div className="relative z-10 -mt-24 p-6 sm:p-8 lg:p-10">
                <div className="chrome-ltr mb-3 flex items-center gap-3">
                  <span className="eng-marker" aria-hidden="true" />
                  <span className="label-mono text-muted">{tp(`${featured.id}.tag`)}</span>
                </div>
                <h3 className="text-content text-2xl font-medium tracking-tight text-text sm:text-3xl lg:text-[34px] lg:leading-[1.15]">
                  {tp(`${featured.id}.title`)}
                </h3>
                <p className="text-content mt-3 max-w-lg text-sm leading-[1.7] text-muted sm:text-base">
                  {tp(`${featured.id}.description`)}
                </p>
              </div>
            </Link>
          </motion.div>

          {rest.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.08 + index * 0.06 }}
              className="lg:col-span-5"
            >
              <Link
                href="/portfolio"
                className="group flex h-full min-h-[200px] flex-col overflow-hidden bg-bg/90 transition-colors duration-300 hover:bg-surface/50 sm:min-h-[240px] lg:min-h-full lg:flex-row"
              >
                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden lg:aspect-auto lg:h-full lg:w-[46%]">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 22vw"
                    className="object-cover transition-opacity duration-500 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-bg/30" />
                </div>
                <div className="flex flex-1 flex-col justify-end p-5 sm:p-6 lg:p-7">
                  <div className="chrome-ltr mb-3 flex items-center gap-3">
                    <span className="eng-marker" aria-hidden="true" />
                    <span className="label-mono text-muted">{tp(`${item.id}.tag`)}</span>
                  </div>
                  <h3 className="text-content text-lg font-medium tracking-tight text-text sm:text-xl">
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
