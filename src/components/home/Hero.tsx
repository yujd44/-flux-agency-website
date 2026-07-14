"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Container from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

export default function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden pt-6 lg:pt-10">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <Container className="relative">
        <div className="chrome-ltr grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <BidiBlock>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="chrome-ltr mb-6 inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.14em] text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t("badge")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-text sm:text-5xl lg:text-[3.4rem]"
            >
              {t("title")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16 }}
              className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg"
            >
              {t("subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24 }}
              className="mt-10"
            >
              <Button href="/services" variant="outline">
                {t("cta")}
              </Button>
            </motion.div>
          </BidiBlock>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto aspect-[4/5] w-full max-w-md lg:aspect-auto lg:h-[560px] lg:max-w-none"
          >
            <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-border">
              <Image
                src="/images/hero-main.png"
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent" />
            </div>
            <div className="pointer-events-none absolute -bottom-6 -left-6 hidden h-28 w-28 rounded-full border border-accent/30 sm:block" />
            <div className="chrome-ltr pointer-events-none absolute -top-5 right-8 hidden rounded-full border border-border bg-bg/80 px-4 py-1.5 text-[11px] tracking-[0.1em] text-muted backdrop-blur sm:block">
              31.7683° N | 35.2137° E
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
