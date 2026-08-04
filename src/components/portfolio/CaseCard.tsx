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
  index,
  featured = false,
}: {
  id: PortfolioCaseId;
  image: string;
  url: string;
  index: number;
  featured?: boolean;
}) {
  const tp = useTranslations("portfolio.cases");
  const tc = useTranslations("common");

  const hasLiveUrl = url.length > 0;

  const cardProps = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5, delay: index * 0.06 },
    style: featured ? { gridColumn: "span 2" } : undefined,
    className:
      "group relative flex flex-col overflow-hidden border border-border bg-bg transition-colors duration-300 hover:border-accent-secondary/45",
  } as const;

  const content = (
    <>
      <div
        className={`relative overflow-hidden ${
          featured ? "aspect-[16/9] sm:aspect-[21/9]" : "aspect-[4/3]"
        }`}
      >
        <Image
          src={image}
          alt=""
          fill
          sizes={featured ? "90vw" : "(max-width: 768px) 90vw, 45vw"}
          className="object-cover transition-opacity duration-500 group-hover:opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/50 via-transparent to-transparent" />
      </div>
      <div className={featured ? "relative p-6 sm:p-8" : "relative p-6"}>
        <div className="chrome-ltr mb-3 flex items-center gap-3">
          <span className="eng-marker" aria-hidden="true" />
          <span className="label-mono text-muted">{tp(`${id}.tag`)}</span>
        </div>
        <h3
          className={`text-content font-medium tracking-tight text-text ${
            featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
          }`}
        >
          {tp(`${id}.title`)}
        </h3>
        <p
          className={`text-content mt-3 leading-[1.7] text-muted ${
            featured ? "text-base sm:text-lg" : "text-base"
          }`}
        >
          {tp(`${id}.description`)}
        </p>
        <div className="chrome-ltr label-mono mt-5 inline-flex items-center gap-2 text-muted transition-colors duration-300 group-hover:text-accent-secondary">
          {hasLiveUrl ? tc("viewLiveSite") : tc("viewCase")}
          {hasLiveUrl ? (
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
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
