"use client";

import CaseCard from "./CaseCard";
import { portfolioCases } from "@/lib/portfolio-data";

const spanPattern: { col: number; row: number }[] = [
  { col: 2, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
];

export default function PortfolioGrid() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:gap-6">
      {portfolioCases.map((item, index) => (
        <CaseCard
          key={item.id}
          id={item.id}
          image={item.image}
          index={index}
          span={spanPattern[index % spanPattern.length]}
        />
      ))}
    </div>
  );
}
