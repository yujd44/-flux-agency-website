"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ExternalLink, X } from "lucide-react";
import BidiBlock from "@/components/ui/BidiBlock";
import { Link } from "@/i18n/navigation";
import {
  serviceCategories,
  categoryIcons,
  serviceIcons,
  type ServiceCategoryId,
} from "@/lib/services-data";
import { portfolioCases } from "@/lib/portfolio-data";
import type { StageId } from "../StageRail";

type Props = {
  active?: boolean;
  onNavigate?: (id: StageId | "works") => void;
};

const METRIC_POINTS = [28, 34, 32, 40, 48, 55, 62, 70, 78];

export default function RealizationStage({
  active: _active = true,
  onNavigate,
}: Props) {
  const t = useTranslations("ritual.realization");
  const ts = useTranslations("services");
  const tp = useTranslations("portfolio.cases");
  const common = useTranslations("common");
  const [selected, setSelected] = useState<ServiceCategoryId | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const featured = portfolioCases[0];
  const featuredTitle = tp(`${featured.id}.title`);
  const featuredTag = tp(`${featured.id}.tag`);

  const chartMax = Math.max(...METRIC_POINTS);
  const chartW = 220;
  const chartH = 72;
  const chartPath = METRIC_POINTS.map((v, i) => {
    const x = (i / (METRIC_POINTS.length - 1)) * chartW;
    const y = chartH - (v / chartMax) * (chartH - 8) - 4;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const selectedCat = serviceCategories.find((c) => c.id === selected);

  useEffect(() => {
    if (!selected || !detailRef.current) return;
    detailRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected]);

  function toggleCategory(id: ServiceCategoryId) {
    setSelected((prev) => (prev === id ? null : id));
  }

  function goToForm() {
    onNavigate?.("future");
  }

  return (
    <section
      id="realization"
      className="ritual-stage relative !justify-start overflow-x-hidden py-4 sm:py-10 md:py-20"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[1220px] flex-col gap-6 sm:gap-8 lg:gap-10">
        <div className="text-content text-center">
          <h2 className="ritual-headline ritual-brand-glow text-[clamp(1.35rem,5vw,2.6rem)] tracking-[0.1em] text-white uppercase sm:tracking-[0.16em]">
            {t("title")}
          </h2>
        </div>

        <div className="chrome-ltr grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {serviceCategories.map((cat) => {
            const Icon = categoryIcons[cat.id];
            const isOpen = selected === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                aria-expanded={isOpen}
                className={clsx(
                  "ritual-glass ritual-glass-hover flex min-w-0 flex-col rounded-2xl p-3.5 text-start sm:p-4 md:p-5",
                  isOpen &&
                    "border-[rgba(77,243,255,0.4)] shadow-[0_0_28px_rgba(77,243,255,0.14)]",
                )}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-[var(--ritual-cyan)]" strokeWidth={1.5} />
                  <BidiBlock className="label-mono text-[10px] tracking-[0.16em] text-white">
                    {ts(`categories.${cat.id}.title`)}
                  </BidiBlock>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {cat.items.map((itemId) => {
                    const ItemIcon = serviceIcons[itemId];
                    return (
                      <li key={itemId} className="flex items-start gap-2 text-start">
                        <ItemIcon
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35"
                          strokeWidth={1.5}
                        />
                        <BidiBlock
                          as="span"
                          className="text-xs leading-snug text-[var(--ritual-muted)] sm:text-sm"
                        >
                          {ts(`items.${itemId}.title`)}
                        </BidiBlock>
                      </li>
                    );
                  })}
                </ul>
              </button>
            );
          })}
        </div>

        {selectedCat && (
          <div
            ref={detailRef}
            className="ritual-glass chrome-ltr rounded-2xl border-[rgba(77,243,255,0.28)] p-5 sm:p-6"
            role="region"
            aria-live="polite"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="label-mono mb-2 text-[10px] tracking-[0.16em] text-[var(--ritual-cyan)]">
                  {ts(`categories.${selectedCat.id}.number`)}
                </p>
                <BidiBlock className="text-content text-lg font-medium text-white sm:text-xl">
                  {ts(`categories.${selectedCat.id}.title`)}
                </BidiBlock>
                <BidiBlock className="text-content mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ritual-muted)]">
                  {ts(`categories.${selectedCat.id}.description`)}
                </BidiBlock>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                aria-label={t("closeDetail")}
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {selectedCat.items.map((itemId) => {
                const ItemIcon = serviceIcons[itemId];
                return (
                  <li
                    key={itemId}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <ItemIcon
                        className="h-3.5 w-3.5 shrink-0 text-[var(--ritual-cyan)]"
                        strokeWidth={1.5}
                      />
                      <BidiBlock className="text-sm font-medium text-white">
                        {ts(`items.${itemId}.title`)}
                      </BidiBlock>
                    </div>
                    <BidiBlock className="text-xs leading-relaxed text-[var(--ritual-muted)] sm:text-sm">
                      {ts(`items.${itemId}.description`)}
                    </BidiBlock>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={goToForm} className="ritual-cta">
                <span>{t("learnMore")}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        <div id="works" className="chrome-ltr scroll-mt-24 grid gap-3 md:grid-cols-12">
          <a
            href={featured.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ritual-glass ritual-glass-hover group relative flex flex-col overflow-hidden rounded-2xl md:col-span-5"
          >
            <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[2/1]">
              <Image
                src={featured.image}
                alt={featuredTitle}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-[#07080c]/40 to-transparent" />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
              <p className="label-mono text-[10px] tracking-[0.16em] text-[var(--ritual-cyan)]">
                {t("caseStudyEyebrow")}
              </p>
              <div className="flex items-start justify-between gap-2">
                <BidiBlock className="text-base font-medium text-white sm:text-lg">
                  {featuredTitle}
                </BidiBlock>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--ritual-cyan)]" strokeWidth={1.5} />
              </div>
              <BidiBlock className="label-mono text-[10px] tracking-[0.12em] text-white/40">
                {featuredTag}
              </BidiBlock>
              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
                <div>
                  <p className="label-mono text-[9px] tracking-[0.14em] text-white/40">
                    {t("metrics.servicesLabel")}
                  </p>
                  <p className="mt-1 text-xl font-medium text-white tabular-nums">
                    {t("metrics.servicesValue")}
                  </p>
                </div>
                <div>
                  <p className="label-mono text-[9px] tracking-[0.14em] text-white/40">
                    {t("metrics.efficiencyLabel")}
                  </p>
                  <p className="mt-1 text-xl font-medium text-[var(--ritual-cyan)] tabular-nums">
                    {t("metrics.efficiencyValue")}
                  </p>
                </div>
              </div>
            </div>
          </a>

          <div className="flex flex-col gap-3 md:col-span-3">
            <div className="ritual-glass flex flex-1 flex-col justify-center rounded-2xl p-4 sm:p-5">
              <p className="label-mono mb-2 text-[10px] tracking-[0.14em] text-white/45">
                {ts("items.telegramBots.title")}
              </p>
              <p className="text-sm leading-snug text-white">{t("highlightBot")}</p>
            </div>
            <Link
              href="/portfolio"
              className="ritual-glass ritual-glass-hover flex items-center justify-between gap-3 rounded-2xl p-4 sm:p-5"
            >
              <div>
                <p className="label-mono mb-1 text-[10px] tracking-[0.14em] text-white/45">
                  {t("worksEyebrow")}
                </p>
                <p className="text-sm font-medium text-white">{t("worksTitle")}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(77,243,255,0.35)] text-[var(--ritual-cyan)]">
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                <span className="sr-only">{common("viewAll")}</span>
              </span>
            </Link>
          </div>

          <div className="flex flex-col gap-3 md:col-span-4">
            <div className="ritual-glass rounded-2xl p-4 sm:p-5">
              <p className="label-mono mb-3 text-[10px] tracking-[0.14em] text-white/45">
                {t("metrics.scaleLabel")}
              </p>
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="h-16 w-full overflow-visible"
                aria-hidden="true"
              >
                <path
                  d={chartPath}
                  fill="none"
                  stroke="rgba(77,243,255,0.85)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 6px rgba(77,243,255,0.45))" }}
                />
                <path
                  d={`${chartPath} L${chartW},${chartH} L0,${chartH} Z`}
                  fill="url(#ritual-scale-fill)"
                  opacity="0.35"
                />
                <defs>
                  <linearGradient id="ritual-scale-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(77,243,255,0.45)" />
                    <stop offset="100%" stopColor="rgba(77,243,255,0)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="ritual-glass grid grid-cols-2 gap-3 rounded-2xl p-4 sm:p-5">
              <div>
                <p className="label-mono text-[9px] tracking-[0.14em] text-white/40">
                  {t("metrics.monitoringLabel")}
                </p>
                <p className="mt-1 text-xl font-medium text-white tabular-nums">
                  {t("metrics.monitoringValue")}
                </p>
              </div>
              <div>
                <p className="label-mono text-[9px] tracking-[0.14em] text-white/40">
                  {t("metrics.deploysLabel")}
                </p>
                <p className="mt-1 text-xl font-medium text-white tabular-nums">
                  {t("metrics.deploysValue")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
