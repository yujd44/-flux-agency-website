/** Edge slack for scrollHeight/clientHeight subpixels on mobile browsers. */
export const PANEL_EDGE_PX = 10;

export type ScrollPanelLike = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

/** True when a vertical stage step in `direction` should win over panel pan. */
export function panelCanAdvance(
  panel: ScrollPanelLike | null | undefined,
  direction: 1 | -1,
  edgePx = PANEL_EDGE_PX,
): boolean {
  if (!panel) return true;
  const overflow = panel.scrollHeight - panel.clientHeight > 2;
  if (!overflow) return true;
  if (direction > 0) {
    return panel.scrollTop + panel.clientHeight >= panel.scrollHeight - edgePx;
  }
  return panel.scrollTop <= edgePx;
}

/**
 * Fixed chrome only (header / stage rail nav).
 * Must NOT match in-stage buttons, links, or labels — those cover Realization cards
 * and Future form chrome and would otherwise kill stage swipe tracking.
 */
export function isChromeTarget(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  return Boolean(target.closest("header, nav"));
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']"),
  );
}

export type TouchStageEndDecision =
  | { action: "none" }
  | { action: "stage"; direction: 1 | -1 };

/**
 * Resolve a completed vertical touch gesture into a stage step.
 * - No overflow → any strong vertical swipe changes stage
 * - Overflow → only at top + swipe down (prev) or bottom + swipe up (next)
 */
export function decideTouchStageEnd(opts: {
  /** startY - endY; positive = finger moved up → next stage */
  delta: number;
  axis: "x" | "y" | null;
  threshold: number;
  panel: ScrollPanelLike | null | undefined;
}): TouchStageEndDecision {
  const { delta, axis, threshold, panel } = opts;
  if (axis === "x") return { action: "none" };
  if (Math.abs(delta) < threshold) return { action: "none" };

  const direction: 1 | -1 = delta > 0 ? 1 : -1;
  if (!panelCanAdvance(panel, direction)) return { action: "none" };
  return { action: "stage", direction };
}

/** Axis lock: prefer vertical unless clearly horizontal. */
export function lockTouchAxis(dx: number, dy: number, deadzone = 12): "x" | "y" | null {
  if (Math.abs(dx) <= deadzone && Math.abs(dy) <= deadzone) return null;
  return Math.abs(dx) > Math.abs(dy) * 1.35 ? "x" : "y";
}
