"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { serviceCategories, type ServiceItemId } from "@/lib/services-data";
import { Button } from "@/components/ui/Button";
import BidiBlock from "@/components/ui/BidiBlock";

export default function ServiceDetail({
  serviceId,
  onBack,
}: {
  serviceId: ServiceItemId;
  onBack: () => void;
}) {
  const ti = useTranslations("services.items");
  const tDetail = useTranslations("services.detail");
  const tCommon = useTranslations("common");

  const category = serviceCategories.find((c) => c.items.includes(serviceId))!;
  const features = ti.raw(`${serviceId}.features`) as string[];

  return (
    <motion.div
      key={serviceId}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4 }}
      className="chrome-ltr grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16"
    >
      <BidiBlock className="flex flex-col">
        <button
          type="button"
          onClick={onBack}
          className="chrome-ltr label-mono mb-10 inline-flex items-center gap-2.5 self-start text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          {tCommon("backToServices")}
        </button>

        <div className="chrome-ltr mb-5 flex items-center gap-3">
          <span className="eng-marker" aria-hidden="true" />
          <span className="label-mono text-muted">{tDetail("featuresTitle")}</span>
        </div>

        <h3 className="text-3xl font-medium tracking-tight text-text sm:text-4xl lg:text-[2.75rem] lg:leading-[1.05]">
          {ti(`${serviceId}.title`)}
        </h3>

        <p className="mt-6 max-w-md text-lg leading-[1.7] text-muted">
          {ti(`${serviceId}.detailDescription`)}
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-y-3 border-t border-border pt-8 sm:grid-cols-2 sm:gap-x-6">
          {features.map((feature) => (
            <li key={feature} className="chrome-ltr flex items-start gap-3 text-base text-text">
              <span className="eng-marker mt-2" aria-hidden="true" />
              <BidiBlock as="span">{feature}</BidiBlock>
            </li>
          ))}
        </ul>

        <div className="chrome-ltr mt-10">
          <Button href="/contact">{tDetail("cta")}</Button>
        </div>
      </BidiBlock>

      <div className="relative aspect-[4/5] overflow-hidden border border-border lg:aspect-auto lg:min-h-[520px]">
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(max-width: 1024px) 90vw, 32vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent" />
      </div>
    </motion.div>
  );
}
