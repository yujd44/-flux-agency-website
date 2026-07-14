"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ServiceCard from "./ServiceCard";
import {
  cardSpanPattern,
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-[520px] overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 left-0 right-0 select-none overflow-hidden whitespace-nowrap text-[14vw] font-bold leading-none tracking-tight text-text/[0.035] [mask-image:linear-gradient(to_right,black,black_85%,transparent)] lg:-top-10 lg:text-[6vw]"
      >
        {tc(`${categoryId}.watermark`)}
      </div>

      <div className="blueprint-grid pointer-events-none absolute inset-0 -z-10 opacity-20 [mask-image:radial-gradient(circle_at_50%_30%,black,transparent_70%)]" />

      <div className="relative grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3 lg:gap-5">
        {category.items.map((itemId, index) => (
          <ServiceCard
            key={itemId}
            id={itemId}
            index={index}
            span={cardSpanPattern[index % cardSpanPattern.length]}
            onSelect={onSelectService}
          />
        ))}
      </div>
    </motion.div>
  );
}
