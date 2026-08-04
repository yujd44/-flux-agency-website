"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ServiceCategoryId } from "@/lib/services-data";

const NODES: {
  id: ServiceCategoryId;
  left: string;
  top: string;
  x: number;
  y: number;
}[] = [
  { id: "digitalProducts", left: "14%", top: "24%", x: 14, y: 24 },
  { id: "businessAutomation", left: "64%", top: "16%", x: 64, y: 16 },
  { id: "infrastructure", left: "80%", top: "52%", x: 80, y: 52 },
  { id: "communication", left: "30%", top: "70%", x: 30, y: 70 },
];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 2],
];

/** Clickable service constellation — obvious nodes near the ribbon → /services. */
export default function HeroConstellation() {
  const t = useTranslations("services.categories");

  return (
    <div className="pointer-events-none absolute inset-y-[10%] right-[1%] z-[4] hidden w-[min(48%,26rem)] lg:block">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {EDGES.map(([a, b], i) => (
          <line
            key={`${a}-${b}`}
            className="hero-constellation-line"
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke="rgba(255, 170, 130, 0.55)"
            strokeWidth="0.85"
            style={{ animationDelay: `${i * 0.45}s` }}
          />
        ))}
      </svg>

      {NODES.map((node, i) => {
        const title = t(`${node.id}.title`);
        const number = t(`${node.id}.number`);

        return (
          <div
            key={node.id}
            className="absolute z-[5] -translate-x-1/2 -translate-y-1/2"
            style={{ left: node.left, top: node.top }}
          >
            <Link
              href="/services"
              className="hero-constellation-node pointer-events-auto flex items-center gap-2.5"
              title={title}
              aria-label={`${number} — ${title}`}
              style={{ animationDelay: `${i * 0.35}s` }}
            >
              <span className="relative flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center">
                <span
                  className="hero-constellation-pulse absolute inset-[-2px] rounded-full"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
                <span className="absolute inset-0 rounded-full bg-accent/45 blur-[3px]" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#ff8a5c] to-[#a78bfa] shadow-[0_0_14px_rgba(255,106,61,0.9)]" />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="label-mono text-[12px] font-medium tracking-[0.2em] text-white/90">
                  {number}
                </span>
                <span className="mt-0.5 max-w-[8.5rem] truncate text-[10px] font-light tracking-[0.04em] text-white/65">
                  {title}
                </span>
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
