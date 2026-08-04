"use client";

import { useAmbient } from "@/hooks/useAmbient";

type Props = {
  labelOn?: string;
  labelOff?: string;
};

/** Quiet ambient audio mute control for the hero. */
export default function AmbientToggle({
  labelOn = "Sound on",
  labelOff = "Sound off",
}: Props) {
  const { enabled, blocked, toggle } = useAmbient();

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      className="chrome-ltr label-mono absolute bottom-16 left-[var(--page-pad)] z-20 flex items-center gap-2 text-[9px] tracking-[0.22em] text-muted/55 transition-colors hover:text-muted"
      aria-pressed={enabled}
      aria-label={enabled ? labelOff : labelOn}
      title={blocked ? "Audio blocked by browser" : undefined}
    >
      <span
        className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/25"
        aria-hidden="true"
      >
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            enabled ? "bg-accent" : "bg-white/25"
          }`}
        />
      </span>
      {enabled ? "AUDIO" : "MUTE"}
    </button>
  );
}
