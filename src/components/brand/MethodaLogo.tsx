"use client";

import clsx from "clsx";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

type Props = {
  className?: string;
  /** Show wordmark beside the M mark. Default true. */
  showWordmark?: boolean;
  /** Overall mark height in px. */
  size?: number;
  href?: "/" | string;
  /** Kept for API compat; mark uses a subtle hover lift when true. */
  morph?: boolean;
};

/**
 * METHODEA lockup: white/blue chevron M mark + wordmark.
 */
export default function MethodaLogo({
  className,
  showWordmark = true,
  size = 28,
  href = "/",
  morph = false,
}: Props) {
  const markH = size;
  const markW = Math.round(size * (304 / 236));

  const content = (
    <span
      className={clsx(
        "chrome-ltr inline-flex items-center gap-2.5",
        morph && "transition-transform duration-300 ease-out hover:-translate-y-px",
        className,
      )}
    >
      <Image
        src="/brand/methodea-mark.png"
        alt=""
        width={304}
        height={236}
        unoptimized
        className="shrink-0 object-contain"
        style={{ width: markW, height: markH }}
        aria-hidden="true"
      />
      {showWordmark && (
        <span
          className="text-[13px] font-medium tracking-[0.08em] text-text sm:text-[14px]"
          style={{ fontFamily: "var(--font-latin), system-ui, sans-serif" }}
        >
          Methodea
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 text-text" aria-label="Methodea">
        {content}
      </Link>
    );
  }

  return content;
}
