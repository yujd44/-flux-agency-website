"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { serviceIcons, type ServiceItemId } from "@/lib/services-data";
import BidiBlock from "@/components/ui/BidiBlock";

export default function ServiceCard({
  id,
  span,
  index,
  onSelect,
}: {
  id: ServiceItemId;
  span: { col: number; row: number };
  index: number;
  onSelect: (id: ServiceItemId) => void;
}) {
  const ti = useTranslations("services.items");
  const Icon = serviceIcons[id];

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(id)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      style={{ gridColumn: `span ${span.col}`, gridRow: `span ${span.row}` }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface/40 p-6 text-left backdrop-blur-sm transition-colors duration-300 hover:border-accent/50 hover:bg-surface"
    >
      <div className="chrome-ltr absolute right-5 top-5 h-1.5 w-1.5 rounded-full bg-accent/40 transition-all duration-300 group-hover:bg-accent group-hover:shadow-[0_0_10px_2px_rgba(37,99,235,0.6)]" />

      <div className="chrome-ltr flex items-center justify-between">
        <Icon className="h-6 w-6 text-accent/80 transition-colors duration-300 group-hover:text-accent" strokeWidth={1.5} />
      </div>

      <BidiBlock className="mt-6">
        <h3 className="text-lg font-medium text-text sm:text-xl">{ti(`${id}.title`)}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{ti(`${id}.description`)}</p>
      </BidiBlock>

      <div className="chrome-ltr mt-5 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] text-muted transition-colors duration-300 group-hover:text-accent">
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </motion.button>
  );
}
