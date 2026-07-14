"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import type { PortfolioCaseId } from "@/lib/portfolio-data";

export default function CaseCard({
  id,
  image,
  url,
  span,
  index,
}: {
  id: PortfolioCaseId;
  image: string;
  url: string;
  span: { col: number; row: number };
  index: number;
}) {
  const tp = useTranslations("portfolio.cases");
  const tc = useTranslations("common");

  const hasLiveUrl = url.length > 0;

  const cardProps = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5, delay: (index % 6) * 0.06 },
    style: { gridColumn: `span ${span.col}`, gridRow: `span ${span.row}` },
    className:
      "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface/30 transition-colors duration-300 hover:border-accent/40",
  } as const;

  const content = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 45vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-bg/10 to-transparent" />
      </div>
      <div className="relative p-6">
        <div className="text-content mb-2 text-[11px] uppercase tracking-[0.14em] text-accent">
          {tp(`${id}.tag`)}
        </div>
        <h3 className="text-content text-xl font-medium text-text">{tp(`${id}.title`)}</h3>
        <p className="text-content mt-2 text-sm leading-relaxed text-muted">
          {tp(`${id}.description`)}
        </p>
        <div className="chrome-ltr mt-4 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] text-muted transition-colors duration-300 group-hover:text-accent">
          {hasLiveUrl ? tc("viewLiveSite") : tc("viewCase")}
          {hasLiveUrl ? (
            <ExternalLink className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}
        </div>
      </div>
    </>
  );

  if (hasLiveUrl) {
    return (
      <motion.a href={url} target="_blank" rel="noopener noreferrer" {...cardProps}>
        {content}
      </motion.a>
    );
  }

  return <motion.div {...cardProps}>{content}</motion.div>;
}
