"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import CategoryNav from "./CategoryNav";
import ServiceGrid from "./ServiceGrid";
import ServiceDetail from "./ServiceDetail";
import type { ServiceCategoryId, ServiceItemId } from "@/lib/services-data";

export default function ServicesExplorer() {
  const [category, setCategory] = useState<ServiceCategoryId>("digitalProducts");
  const [service, setService] = useState<ServiceItemId | null>(null);
  const tMobile = useTranslations("services.mobile");

  function handleCategoryChange(id: ServiceCategoryId) {
    setCategory(id);
    setService(null);
  }

  return (
    <section className="relative border-t border-border py-16 lg:min-h-[calc(100vh-78px)] lg:py-20">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="chrome-ltr relative mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-12 px-6 sm:px-8 lg:grid-cols-[38%_62%] lg:gap-16 lg:px-16 xl:px-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <CategoryNav active={category} onChange={handleCategoryChange} />
          <p className="chrome-ltr label-mono mt-6 text-muted lg:hidden">
            {tMobile("tapToExpand")}
          </p>
        </div>

        <div className="relative min-h-[420px]">
          <AnimatePresence mode="wait">
            {service ? (
              <ServiceDetail key="detail" serviceId={service} onBack={() => setService(null)} />
            ) : (
              <ServiceGrid key="grid" categoryId={category} onSelectService={setService} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
