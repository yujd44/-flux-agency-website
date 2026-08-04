"use client";

import CaseCard from "./CaseCard";
import { portfolioCases } from "@/lib/portfolio-data";

export default function PortfolioGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
      {portfolioCases.map((item, index) => (
        <CaseCard
          key={item.id}
          id={item.id}
          image={item.image}
          url={item.url}
          index={index}
          featured={index === 0}
        />
      ))}
    </div>
  );
}
