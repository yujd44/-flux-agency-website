"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ServiceItemId } from "@/lib/services-data";
import BidiBlock from "@/components/ui/BidiBlock";

export default function ServiceCard({
  id,
  index,
  onSelect,
}: {
  id: ServiceItemId;
  index: number;
  onSelect: (id: ServiceItemId) => void;
}) {
  const ti = useTranslations("services.items");

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(id)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      className="group relative flex h-full w-full flex-col justify-between bg-bg p-6 text-left transition-colors duration-300 hover:bg-surface/60 sm:p-7"
    >
      <div className="chrome-ltr flex items-center justify-between">
        <span className="label-mono text-muted">
          {String(index + 1).padStart(2, "0")}
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-muted transition-colors duration-300 group-hover:text-accent-secondary"
          strokeWidth={1.5}
        />
      </div>

      <BidiBlock className="mt-8">
        <h3 className="text-xl font-medium tracking-tight text-text sm:text-2xl">
          {ti(`${id}.title`)}
        </h3>
        <p className="mt-3 text-base leading-[1.7] text-muted">{ti(`${id}.description`)}</p>
      </BidiBlock>

      <div className="chrome-ltr mt-6 flex items-center gap-2">
        <span className="eng-marker" aria-hidden="true" />
        <span className="eng-line-h flex-1 max-w-[48px]" aria-hidden="true" />
      </div>
    </motion.button>
  );
}
