"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { serviceCategories, type ServiceCategoryId } from "@/lib/services-data";
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
    <nav className="chrome-ltr flex flex-col gap-1">
      {serviceCategories.map((cat) => {
        const isActive = cat.id === active;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className="group relative flex items-center gap-5 py-3 text-left transition-opacity duration-500 lg:py-4"
          >
            <span className="relative flex h-full w-[3px] shrink-0 items-stretch self-stretch">
              {isActive && (
                <motion.span
                  layoutId="category-indicator"
                  className="absolute inset-y-0 w-full rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </span>
            <span className="flex flex-col gap-1">
              <span className="chrome-ltr text-[11px] font-medium tracking-[0.15em] text-muted">
                {tc(`${cat.id}.number`)}
              </span>
              <BidiBlock as="span">
                <span
                  className={clsx(
                    "block text-[40px] font-semibold leading-[1.05] tracking-tight transition-all duration-500 sm:text-[52px] lg:text-[64px]",
                    isActive
                      ? "scale-100 text-text opacity-100"
                      : "scale-[0.97] text-muted/50 opacity-80 group-hover:text-muted group-hover:opacity-100",
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
