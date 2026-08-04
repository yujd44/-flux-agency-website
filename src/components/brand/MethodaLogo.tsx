import clsx from "clsx";
import { Link } from "@/i18n/navigation";

type Props = {
  className?: string;
  /** Show wordmark beside the four-bar mark. Default true. */
  showWordmark?: boolean;
  /** Overall mark height in px. */
  size?: number;
  href?: "/" | string;
};

/** Orange → magenta → violet per bar (avoids colliding SVG gradient IDs). */
const BAR_COLORS = ["#ff6a3d", "#f04e5f", "#e83a8a", "#a855f7"] as const;

/**
 * METHODEA lockup: four vertical bars with orange→magenta gradient + white wordmark.
 */
export default function MethodaLogo({
  className,
  showWordmark = true,
  size = 28,
  href = "/",
}: Props) {
  const markW = Math.round(size * 0.85);
  const markH = size;

  const content = (
    <span className={clsx("chrome-ltr inline-flex items-center gap-3", className)}>
      <svg
        width={markW}
        height={markH}
        viewBox="0 0 28 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="1" y="20" width="4" height="12" fill={BAR_COLORS[0]} />
        <rect x="8.5" y="13" width="4" height="19" fill={BAR_COLORS[1]} />
        <rect x="16" y="7" width="4" height="25" fill={BAR_COLORS[2]} />
        <rect x="23.5" y="1" width="4" height="31" fill={BAR_COLORS[3]} />
      </svg>
      {showWordmark && (
        <span
          className="text-[13px] font-normal tracking-[0.28em] text-text uppercase sm:text-[14px]"
          style={{ fontFamily: "var(--font-latin), system-ui, sans-serif" }}
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
