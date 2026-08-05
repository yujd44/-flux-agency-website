"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

type Props = {
  className?: string;
  /** Show wordmark beside the four-bar mark. Default true. */
  showWordmark?: boolean;
  /** Overall mark height in px. */
  size?: number;
  href?: "/" | string;
  /** Morph bars on hover + subtle scroll response. */
  morph?: boolean;
};

/** Orange → magenta → violet per bar (avoids colliding SVG gradient IDs). */
const BAR_COLORS = ["#ff6a3d", "#f04e5f", "#e83a8a", "#a855f7"] as const;

/** Rest heights (from bottom) in viewBox units — tallest bar is 31. */
const REST = [
  { x: 1, y: 20, h: 12 },
  { x: 8.5, y: 13, h: 19 },
  { x: 16, y: 7, h: 25 },
  { x: 23.5, y: 1, h: 31 },
] as const;

const HOVER = [
  { x: 1, y: 14, h: 18 },
  { x: 8.5, y: 8, h: 24 },
  { x: 16, y: 4, h: 28 },
  { x: 23.5, y: 0, h: 32 },
] as const;

/**
 * METHODEA lockup: four vertical bars with orange→magenta gradient + white wordmark.
 */
export default function MethodaLogo({
  className,
  showWordmark = true,
  size = 28,
  href = "/",
  morph = false,
}: Props) {
  const markW = Math.round(size * 0.85);
  const markH = size;
  const [hovered, setHovered] = useState(false);
  const [scrollBoost, setScrollBoost] = useState(0);

  useEffect(() => {
    if (!morph) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setScrollBoost(Math.min(1, y / 280));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [morph]);

  const content = (
    <span
      className={clsx("chrome-ltr inline-flex items-center gap-3", className)}
      onMouseEnter={() => morph && setHovered(true)}
      onMouseLeave={() => morph && setHovered(false)}
    >
      <svg
        width={markW}
        height={markH}
        viewBox="0 0 28 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 overflow-visible"
      >
        {REST.map((rest, i) => {
          const hover = HOVER[i];
          const t = morph ? (hovered ? 1 : 0) * 0.85 + scrollBoost * 0.35 : 0;
          const targetH = rest.h + (hover.h - rest.h) * t;
          const scaleY = targetH / rest.h;
          return (
            <rect
              key={BAR_COLORS[i]}
              x={rest.x}
              y={rest.y}
              width="4"
              height={rest.h}
              fill={BAR_COLORS[i]}
              style={{
                transform: `scaleY(${scaleY})`,
                transformOrigin: `${rest.x + 2}px 32px`,
                transition: morph
                  ? "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)"
                  : undefined,
              }}
            />
          );
        })}
      </svg>
      {showWordmark && (
        <span
          className="text-[13px] font-normal tracking-[0.28em] text-text uppercase sm:text-[14px]"
          style={{ fontFamily: "var(--font-headline), var(--font-latin), system-ui, sans-serif" }}
        >
          METHODEA
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 text-text" aria-label="METHODEA">
        {content}
      </Link>
    );
  }

  return content;
}
