"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import BidiBlock from "@/components/ui/BidiBlock";
import { Link } from "@/i18n/navigation";
import { serviceCategories, categoryIcons, serviceIcons } from "@/lib/services-data";
import { portfolioCases } from "@/lib/portfolio-data";

type Props = { active?: boolean };

const METRIC_POINTS = [28, 34, 32, 40, 48, 55, 62, 70, 78];

export default function RealizationStage({ active: _active = true }: Props) {
  const t = useTranslations("ritual.realization");
  const ts = useTranslations("services");
  const tp = useTranslations("portfolio.cases");
  const common = useTranslations("common");

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

  return (
    <section
      id="realization"
      className="ritual-stage relative !justify-start overflow-hidden py-20 sm:py-24"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[1220px] flex-col gap-8 lg:gap-10">
        <div className="text-content text-center">
          <h2 className="ritual-headline ritual-brand-glow text-[clamp(1.55rem,3.8vw,2.6rem)] tracking-[0.16em] text-white uppercase">
            {t("title")}
          </h2>
        </div>

        <div className="chrome-ltr grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {serviceCategories.map((cat) => {
            const Icon = categoryIcons[cat.id];
            return (
              <div
                key={cat.id}
                className="ritual-glass ritual-glass-hover flex flex-col rounded-2xl p-4 sm:p-5"
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
              </div>
            );
          })}
        </div>

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
            <div className="ritual-glass flex flex-1 flex-col justify-between rounded-2xl p-4 sm:p-5">
              <div>
                <p className="label-mono mb-2 text-[10px] tracking-[0.14em] text-white/45">
                  {ts("items.telegramBots.title")}
                </p>
                <p className="text-sm leading-snug text-white">{t("highlightBot")}</p>
              </div>
              <p className="mt-4 text-2xl font-medium text-[var(--ritual-cyan)] tabular-nums">
                {t("metrics.responseValue")}
              </p>
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
