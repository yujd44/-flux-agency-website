"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ServiceCard from "./ServiceCard";
import {
  serviceCategories,
  type ServiceCategoryId,
  type ServiceItemId,
} from "@/lib/services-data";

export default function ServiceGrid({
  categoryId,
  onSelectService,
}: {
  categoryId: ServiceCategoryId;
  onSelectService: (id: ServiceItemId) => void;
}) {
  const tc = useTranslations("services.categories");
  const category = serviceCategories.find((c) => c.id === categoryId)!;

  return (
    <motion.div
      key={categoryId}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-[480px] overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-2 left-0 right-0 select-none overflow-hidden whitespace-nowrap text-[12vw] font-medium leading-none tracking-tight text-text/[0.04] [mask-image:linear-gradient(to_right,black,black_80%,transparent)] lg:-top-6 lg:text-[5.5vw]"
      >
        {tc(`${categoryId}.watermark`)}
      </div>

      <div className="blueprint-grid pointer-events-none absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(circle_at_40%_20%,black,transparent_75%)]" />

      <div className="relative mb-6 flex items-center gap-3 pt-2">
        <span className="eng-marker" aria-hidden="true" />
        <span className="label-mono text-muted">{tc(`${categoryId}.title`)}</span>
        <span className="eng-line-h flex-1" aria-hidden="true" />
      </div>

      <div className="relative grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((itemId, index) => (
          <div key={itemId} className="bg-bg">
            <ServiceCard
              id={itemId}
              index={index}
              onSelect={onSelectService}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
