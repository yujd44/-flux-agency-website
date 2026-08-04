"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ServiceCategoryId } from "@/lib/services-data";

const NODES: {
  id: ServiceCategoryId;
  left: string;
  top: string;
}[] = [
  { id: "digitalProducts", left: "12%", top: "22%" },
  { id: "businessAutomation", left: "58%", top: "14%" },
  { id: "infrastructure", left: "72%", top: "48%" },
  { id: "communication", left: "28%", top: "62%" },
];

/** Sparse clickable service constellation — floats near the ribbon. */
export default function HeroConstellation() {
  const t = useTranslations("services.categories");

  return (
    <div className="pointer-events-none absolute inset-y-[16%] right-[2%] z-[4] hidden w-[min(40%,20rem)] lg:block">
      {/* Soft connector lines */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line x1="18" y1="28" x2="62" y2="20" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        <line x1="62" y1="20" x2="78" y2="54" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        <line x1="18" y1="28" x2="34" y2="68" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
        <line x1="34" y1="68" x2="78" y2="54" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
      </svg>

      {NODES.map((node) => (
        <Link
          key={node.id}
          href="/services"
          className="hero-constellation-node pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
          style={{ left: node.left, top: node.top }}
          aria-label={t(`${node.id}.title`)}
        >
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-accent/30" />
            <span className="absolute inset-[3px] rounded-full bg-white/80" />
          </span>
          <span className="label-mono text-[9px] tracking-[0.2em] text-muted/60 transition-colors group-hover:text-text">
            {t(`${node.id}.number`)}
          </span>
        </Link>
      ))}
    </div>
  );
}
