"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import BidiBlock from "@/components/ui/BidiBlock";
import { Link } from "@/i18n/navigation";
import { serviceCategories, categoryIcons, serviceIcons } from "@/lib/services-data";
import { portfolioCases } from "@/lib/portfolio-data";
import NebulaCanvas from "../NebulaCanvas";

type Props = { active?: boolean };

export default function RealizationStage({ active = true }: Props) {
  const t = useTranslations("ritual.realization");
  const ts = useTranslations("services");
  const tp = useTranslations("portfolio.cases");
  const common = useTranslations("common");

  return (
    <section id="realization" className="ritual-stage relative !justify-start overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-0 opacity-45">
        <NebulaCanvas mode="soft" density={0.7} active={active} />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-12 lg:gap-16">
        <div className="text-content text-center">
          <h2 className="ritual-headline ritual-brand-glow text-[clamp(1.6rem,4vw,2.8rem)] tracking-[0.14em] text-white">
            {t("title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--ritual-muted)] sm:text-base">
            {t("subtitle")}
          </p>
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
                        <BidiBlock as="span" className="text-xs leading-snug text-[var(--ritual-muted)] sm:text-sm">
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

        <div id="works" className="scroll-mt-24">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-content">
              <p className="label-mono mb-2 text-[var(--ritual-cyan)]">{t("worksEyebrow")}</p>
              <h3 className="ritual-headline text-2xl text-white sm:text-3xl">{t("worksTitle")}</h3>
            </div>
            <Link
              href="/portfolio"
              className="label-mono text-[10px] tracking-[0.2em] text-white/50 transition-colors hover:text-[var(--ritual-cyan)]"
            >
              {common("viewAll")}
            </Link>
          </div>

          <div className="chrome-ltr grid gap-4 md:grid-cols-3">
            {portfolioCases.map((item) => {
              const title = tp(`${item.id}.title`);
              const tag = tp(`${item.id}.tag`);
              const description = tp(`${item.id}.description`);

              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ritual-glass ritual-glass-hover group flex flex-col overflow-hidden rounded-2xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-transparent to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <BidiBlock className="text-base font-medium text-white">{title}</BidiBlock>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--ritual-cyan)]" strokeWidth={1.5} />
                    </div>
                    <BidiBlock className="label-mono text-[10px] tracking-[0.14em] text-white/40">
                      {tag}
                    </BidiBlock>
                    <BidiBlock className="line-clamp-2 text-sm text-[var(--ritual-muted)]">
                      {description}
                    </BidiBlock>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
