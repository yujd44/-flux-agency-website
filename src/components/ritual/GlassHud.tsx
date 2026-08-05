"use client";

import type { StageId } from "./StageRail";

type Props = {
  stage: StageId;
};

/**
 * Lightweight CSS HUD accents — glass frames + soft bloom sprites.
 * Complements StageScene without a second WebGL context.
 */
export default function GlassHud({ stage }: Props) {
  return (
    <div className="ritual-glass-hud" data-stage={stage} aria-hidden="true">
      <span className="ritual-bloom ritual-bloom--a" />
      <span className="ritual-bloom ritual-bloom--b" />
      <span className="ritual-bloom ritual-bloom--c" />

      <div className="ritual-hud-frame ritual-hud-frame--tl">
        <span className="ritual-hud-frame__bar" />
        <span className="ritual-hud-frame__bar" />
        <span className="ritual-hud-frame__bar short" />
      </div>
      <div className="ritual-hud-frame ritual-hud-frame--tr ritual-hud-frame--hex" />
      <div className="ritual-hud-frame ritual-hud-frame--bl ritual-hud-frame--hex" />
      <div className="ritual-hud-frame ritual-hud-frame--br">
        <span className="ritual-hud-frame__dot" />
        <span className="ritual-hud-frame__graph" />
      </div>
    </div>
  );
}
