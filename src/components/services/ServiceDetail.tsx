"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { serviceCategories, serviceIcons, type ServiceItemId } from "@/lib/services-data";
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
  const Icon = serviceIcons[serviceId];
  const features = ti.raw(`${serviceId}.features`) as string[];

  return (
    <motion.div
      key={serviceId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="chrome-ltr grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12"
    >
      <BidiBlock className="flex flex-col">
        <button
          type="button"
          onClick={onBack}
          className="chrome-ltr mb-8 inline-flex items-center gap-2 self-start text-[12px] font-medium uppercase tracking-[0.1em] text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {tCommon("backToServices")}
        </button>

        <Icon className="h-8 w-8 text-accent" strokeWidth={1.5} />

        <h3 className="mt-6 text-3xl font-semibold uppercase tracking-tight text-text sm:text-4xl">
          {ti(`${serviceId}.title`)}
        </h3>

        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
          {ti(`${serviceId}.detailDescription`)}
        </p>

        <div className="mt-8 mb-3 text-[12px] font-medium uppercase tracking-[0.15em] text-muted">
          {tDetail("featuresTitle")}
        </div>
        <ul className="grid grid-cols-1 gap-y-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature} className="chrome-ltr flex items-center gap-2.5 text-sm text-text">
              <Check className="h-4 w-4 shrink-0 text-accent" />
              <BidiBlock as="span">{feature}</BidiBlock>
            </li>
          ))}
        </ul>

        <div className="chrome-ltr mt-10">
          <Button href="/contact">{tDetail("cta")}</Button>
        </div>
      </BidiBlock>

      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border lg:aspect-auto">
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(max-width: 1024px) 90vw, 32vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/50 via-transparent to-transparent" />
      </div>
    </motion.div>
  );
}
