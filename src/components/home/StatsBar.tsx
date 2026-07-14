"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Container from "@/components/ui/Container";
import BidiBlock from "@/components/ui/BidiBlock";

const keys = ["projects", "experience", "countries", "endToEnd"] as const;

export default function StatsBar() {
  const t = useTranslations("home.stats");

  return (
    <section className="mt-20 border-t border-border lg:mt-28">
      <Container>
        <div className="chrome-ltr grid grid-cols-2 divide-x divide-border lg:grid-cols-4">
          {keys.map((key, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="chrome-ltr flex flex-col items-start gap-2 px-5 py-10 first:pl-0 sm:px-8"
            >
              <span className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                {t(`${key}.value`)}
              </span>
              <BidiBlock as="span" className="text-[13px] leading-snug text-muted">
                {t(`${key}.label`)}
              </BidiBlock>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
