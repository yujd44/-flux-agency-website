"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import {
  categoryIcons,
  serviceCategories,
  type ServiceCategoryId,
} from "@/lib/services-data";
import BidiBlock from "@/components/ui/BidiBlock";

export default function CategoryNav({
  active,
  onChange,
}: {
  active: ServiceCategoryId;
  onChange: (id: ServiceCategoryId) => void;
}) {
  const tc = useTranslations("services.categories");

  return (
    <nav className="chrome-ltr flex flex-col">
      {serviceCategories.map((cat, index) => {
        const isActive = cat.id === active;
        const Icon = categoryIcons[cat.id];
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={clsx(
              "group relative flex w-full items-start gap-4 border-t border-border py-5 text-left transition-colors duration-300 sm:gap-5 lg:py-6",
              index === serviceCategories.length - 1 && "border-b border-border",
            )}
          >
            <span className="relative mt-2 flex h-4 w-4 shrink-0 items-center justify-center">
              <span
                className={clsx(
                  "eng-marker transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                )}
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-2.5">
              <Icon
                className={clsx(
                  "h-4 w-4 transition-colors duration-300",
                  isActive ? "text-text/75" : "text-muted/55 group-hover:text-muted",
                )}
                strokeWidth={1.25}
                aria-hidden="true"
              />
              <BidiBlock as="span">
                <span
                  className={clsx(
                    "block text-balance text-[1.75rem] font-medium leading-[1.1] tracking-tight break-words [overflow-wrap:anywhere] transition-colors duration-300 sm:text-[2.25rem] lg:text-[3.25rem] xl:text-[3.75rem]",
                    isActive ? "text-text" : "text-muted/55 group-hover:text-muted",
                  )}
                >
                  {tc(`${cat.id}.title`)}
                </span>
              </BidiBlock>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
