"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./ritual.css";
import RitualHeader from "./RitualHeader";
import StageRail, { type StageId } from "./StageRail";
import IntroStage from "./stages/IntroStage";
import MethodStage from "./stages/MethodStage";
import RealizationStage from "./stages/RealizationStage";
import FutureStage from "./stages/FutureStage";

const STAGE_IDS: StageId[] = ["intro", "method", "realization", "future"];
const TRANSITION_MS = 900;
const WHEEL_THRESHOLD = 48;
const TOUCH_THRESHOLD = 56;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']"),
  );
}

export default function RitualHome() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const lockedRef = useRef(false);
  const wheelAccRef = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const unlockTimer = useRef<number | null>(null);

  const active = STAGE_IDS[activeIndex];

  const lockBriefly = useCallback(() => {
    lockedRef.current = true;
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => {
      lockedRef.current = false;
      wheelAccRef.current = 0;
    }, TRANSITION_MS);
  }, []);

  const goToIndex = useCallback(
    (next: number, opts?: { scrollWorks?: boolean }) => {
      const clamped = Math.max(0, Math.min(STAGE_IDS.length - 1, next));
      if (clamped === activeIndexRef.current && !opts?.scrollWorks) return;

      activeIndexRef.current = clamped;
      setActiveIndex(clamped);
      lockBriefly();

      if (opts?.scrollWorks) {
        window.setTimeout(() => {
          const works = document.getElementById("works");
          const panel = panelRefs.current[clamped];
          if (works && panel) {
            const panelRect = panel.getBoundingClientRect();
            const worksRect = works.getBoundingClientRect();
            panel.scrollBy({
              top: worksRect.top - panelRect.top - 24,
              behavior: "smooth",
            });
          }
        }, 120);
      } else {
        const panel = panelRefs.current[clamped];
        if (panel) panel.scrollTop = 0;
      }
    },
    [lockBriefly],
  );

  const goTo = useCallback(
    (id: StageId | "works") => {
      if (id === "works") {
        goToIndex(STAGE_IDS.indexOf("realization"), { scrollWorks: true });
        return;
      }
      goToIndex(STAGE_IDS.indexOf(id));
    },
    [goToIndex],
  );

  const canAdvanceFromPanel = useCallback((direction: 1 | -1) => {
    const panel = panelRefs.current[activeIndexRef.current];
    if (!panel) return true;
    const overflow = panel.scrollHeight - panel.clientHeight > 2;
    if (!overflow) return true;
    if (direction > 0) {
      return panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
    }
    return panel.scrollTop <= 1;
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (unlockTimer.current) window.clearTimeout(unlockTimer.current);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onWheel = (e: WheelEvent) => {
      if (isEditableTarget(e.target)) return;
      if (lockedRef.current) {
        e.preventDefault();
        return;
      }

      const direction: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      if (!canAdvanceFromPanel(direction)) return;

      e.preventDefault();
      wheelAccRef.current += e.deltaY;

      if (Math.abs(wheelAccRef.current) < WHEEL_THRESHOLD) return;

      const step = wheelAccRef.current > 0 ? 1 : -1;
      wheelAccRef.current = 0;
      goToIndex(activeIndexRef.current + step);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isEditableTarget(e.target)) {
        touchStartY.current = null;
        return;
      }
      touchStartY.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current == null || lockedRef.current) return;
      const endY = e.changedTouches[0]?.clientY;
      if (endY == null) return;
      const delta = touchStartY.current - endY;
      touchStartY.current = null;
      if (Math.abs(delta) < TOUCH_THRESHOLD) return;

      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      if (!canAdvanceFromPanel(direction)) return;
      goToIndex(activeIndexRef.current + direction);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (lockedRef.current) return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        if (e.key === " " && (e.target as HTMLElement)?.tagName === "BUTTON") return;
        if (!canAdvanceFromPanel(1)) return;
        e.preventDefault();
        goToIndex(activeIndexRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        if (!canAdvanceFromPanel(-1)) return;
        e.preventDefault();
        goToIndex(activeIndexRef.current - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goToIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goToIndex(STAGE_IDS.length - 1);
      }
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canAdvanceFromPanel, goToIndex]);

  return (
    <div ref={rootRef} className="ritual-root" data-stage={active}>
      <RitualHeader active={active} onNavigate={goTo} />
      <StageRail active={active} onSelect={goTo} />

      <div className="ritual-stage-host" aria-live="polite">
        {STAGE_IDS.map((id, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={id}
              ref={(node) => {
                panelRefs.current[index] = node;
              }}
              className={`ritual-stage-panel${isActive ? " is-active" : ""}`}
              data-stage-panel={id}
              aria-hidden={!isActive}
              style={{ transitionTimingFunction: EASE }}
            >
              {id === "intro" && <IntroStage active={isActive} />}
              {id === "method" && <MethodStage active={isActive} />}
              {id === "realization" && <RealizationStage active={isActive} />}
              {id === "future" && <FutureStage active={isActive} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
