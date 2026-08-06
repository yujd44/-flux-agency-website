"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./ritual.css";
import RitualHeader from "./RitualHeader";
import StageRail, { type StageId } from "./StageRail";
import GlassHud from "./GlassHud";
import IntroStage from "./stages/IntroStage";
import MethodStage from "./stages/MethodStage";
import RealizationStage from "./stages/RealizationStage";
import FutureStage from "./stages/FutureStage";
import { INTRO_SESSION_KEY } from "@/lib/intro-session";
import { resolveQualitySettings } from "./qualityTier";
import {
  decideTouchStageEnd,
  isChromeTarget,
  isEditableTarget,
  lockTouchAxis,
  panelCanAdvance,
} from "./stageTouch";

const StageScene = dynamic(() => import("./StageScene"), { ssr: false });

const STAGE_IDS: StageId[] = ["intro", "method", "realization", "future"];
const WHEEL_THRESHOLD = 48;
/** Desktop trackpad / mouse; phones use a slightly lower bar in handlers. */
const TOUCH_THRESHOLD = 48;
const TOUCH_THRESHOLD_MOBILE = 36;
/** Ignore synthetic wheel that follows a touch swipe (Chrome Android / iOS trackpad). */
const POST_TOUCH_WHEEL_MS = 450;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_MOBILE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Mount WebGL only after logo intro dismisses (or session already saw it). */
function useStageSceneReady() {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(INTRO_SESSION_KEY)) {
        setReady(true);
        return;
      }
    } catch {
      /* ignore */
    }
    if (document.documentElement.dataset.intro === "done") {
      setReady(true);
      return;
    }
    const obs = new MutationObserver(() => {
      if (document.documentElement.dataset.intro === "done") {
        setReady(true);
        obs.disconnect();
      }
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-intro"],
    });
    return () => obs.disconnect();
  }, []);

  return ready;
}

export default function RitualHome() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const stageReady = useStageSceneReady();
  const [isMobile, setIsMobile] = useState(false);
  const transitionMsRef = useRef(900);

  useLayoutEffect(() => {
    const q = resolveQualitySettings();
    transitionMsRef.current = q.stageTransitionMs;
    isMobileRef.current = q.isMobile;
    setIsMobile(q.isMobile);
  }, []);
  const lockedRef = useRef(false);
  const wheelAccRef = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchAxisLocked = useRef<"y" | "x" | null>(null);
  const ignoreWheelUntil = useRef(0);
  const unlockTimer = useRef<number | null>(null);
  const isMobileRef = useRef(false);

  const active = STAGE_IDS[activeIndex];
  const panelEase = isMobile ? EASE_MOBILE : EASE;

  const lockBriefly = useCallback(() => {
    lockedRef.current = true;
    // Signal StageScene to lighten draw rate during CSS stage morph (never pause RAF).
    try {
      document.documentElement.dataset.stageLock = "1";
    } catch {
      /* ignore */
    }
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => {
      lockedRef.current = false;
      wheelAccRef.current = 0;
      try {
        delete document.documentElement.dataset.stageLock;
      } catch {
        /* ignore */
      }
    }, transitionMsRef.current);
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
    return panelCanAdvance(panelRefs.current[activeIndexRef.current], direction);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (unlockTimer.current) window.clearTimeout(unlockTimer.current);
      try {
        delete document.documentElement.dataset.stageLock;
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const resetTouch = () => {
      touchStartY.current = null;
      touchStartX.current = null;
      touchAxisLocked.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      if (isEditableTarget(e.target)) return;
      if (performance.now() < ignoreWheelUntil.current) {
        e.preventDefault();
        return;
      }
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
      if (isEditableTarget(e.target) || isChromeTarget(e.target)) {
        resetTouch();
        return;
      }
      // Still track the gesture while stage-locked so a swipe that ends after unlock works.
      const t = e.touches[0];
      if (!t) {
        resetTouch();
        return;
      }
      touchStartY.current = t.clientY;
      touchStartX.current = t.clientX;
      touchAxisLocked.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current == null || touchStartX.current == null) return;
      const t = e.touches[0];
      if (!t) return;

      const dx = t.clientX - touchStartX.current;
      const dy = t.clientY - touchStartY.current;

      if (!touchAxisLocked.current) {
        touchAxisLocked.current = lockTouchAxis(dx, dy);
      }

      // At scroll edge (or no overflow), claim the vertical gesture so rubber-band
      // / overflow pan doesn't eat stage swipes. Prev-stage (finger down) claims
      // earlier and pins scrollTop — iOS rubber-band was the asymmetric hitch.
      if (touchAxisLocked.current === "y" && !lockedRef.current) {
        const direction: 1 | -1 = dy < 0 ? 1 : -1;
        const claimPx = direction < 0 ? 6 : 14;
        if (Math.abs(dy) > claimPx && canAdvanceFromPanel(direction)) {
          if (direction < 0) {
            const panel = panelRefs.current[activeIndexRef.current];
            if (panel && panel.scrollTop !== 0) panel.scrollTop = 0;
          }
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current == null) {
        resetTouch();
        return;
      }
      if (lockedRef.current) {
        // Drop this end so we don't double-fire mid-morph.
        resetTouch();
        return;
      }
      const endY = e.changedTouches[0]?.clientY;
      if (endY == null) {
        resetTouch();
        return;
      }

      const delta = touchStartY.current - endY;
      const axis = touchAxisLocked.current;
      resetTouch();

      const threshold = isMobileRef.current ? TOUCH_THRESHOLD_MOBILE : TOUCH_THRESHOLD;
      const decision = decideTouchStageEnd({
        delta,
        axis,
        threshold,
        panel: panelRefs.current[activeIndexRef.current],
      });
      if (decision.action !== "stage") return;

      ignoreWheelUntil.current = performance.now() + POST_TOUCH_WHEEL_MS;
      wheelAccRef.current = 0;
      goToIndex(activeIndexRef.current + decision.direction);
    };

    const onTouchCancel = () => {
      resetTouch();
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
    // Non-passive so edge swipes can preventDefault and not lose the stage change to pan.
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchcancel", onTouchCancel, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canAdvanceFromPanel, goToIndex]);

  return (
    <div ref={rootRef} className="ritual-root" data-stage={active}>
      {stageReady ? <StageScene stage={active} /> : null}
      <GlassHud stage={active} />
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
              style={{
                transitionTimingFunction: panelEase,
                transitionDuration: isMobile
                  ? `${transitionMsRef.current}ms`
                  : undefined,
              }}
            >
              {id === "intro" && <IntroStage active={isActive} />}
              {id === "method" && <MethodStage active={isActive} onNavigate={goTo} />}
              {id === "realization" && (
                <RealizationStage active={isActive} onNavigate={goTo} />
              )}
              {id === "future" && <FutureStage active={isActive} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
