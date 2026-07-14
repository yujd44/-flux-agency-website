"use client";

import { useId } from "react";
import { LOGO_BLUE_PATH, LOGO_WHITE_PATH } from "@/lib/logo-paths";

/**
 * The persistent Flux Agency icon mark (header, footer, mobile menu). Reuses
 * the same vector paths as the LogoIntro splash so the two never drift.
 * Rendered as inline SVG (rather than the flattened logo-mark.png) so the
 * white stroke can pick up `--logo-mark-stroke`, a theme-aware CSS variable
 * defined in globals.css: transparent on the dark theme, a dark tint on the
 * light theme so the white shape stays visible against a light background.
 */
export default function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="30" y1="68" x2="73" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path
        d={LOGO_WHITE_PATH}
        fill="#F5F7FA"
        stroke="var(--logo-mark-stroke)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d={LOGO_BLUE_PATH} fill={`url(#${gradientId})`} />
    </svg>
  );
}
