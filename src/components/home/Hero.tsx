"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

export default function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <div className="chrome-ltr relative mx-auto grid w-full max-w-[1800px] grid-cols-1 lg:grid-cols-[minmax(0,560px)_1fr] lg:items-stretch">
        <div className="relative z-10 px-6 pt-10 pb-12 sm:px-8 lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-24 xl:pl-16">
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
              className="text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-text sm:text-5xl lg:text-[3.2rem]"
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
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-[340px] w-full sm:min-h-[440px] lg:min-h-[640px]"
        >
          <Image
            src="/images/hero-main.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover object-center"
          />

          {/* Fades the full-bleed photo into the dark background so it reads as an
              architectural cutout integrated with the layout, not a boxed image card. */}
          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-bg via-bg/50 to-transparent sm:w-1/2 lg:w-2/5" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-bg to-transparent lg:h-20" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent lg:h-24" />

          <div className="pointer-events-none absolute bottom-10 left-6 hidden h-24 w-24 rounded-full border border-accent/30 sm:block lg:left-10" />
          <div className="chrome-ltr pointer-events-none absolute top-6 right-6 hidden rounded-full border border-border bg-bg/70 px-4 py-1.5 text-[11px] tracking-[0.1em] text-muted backdrop-blur sm:block lg:top-8 lg:right-10">
            31.7683° N | 35.2137° E
          </div>
        </motion.div>
      </div>
    </section>
  );
}
