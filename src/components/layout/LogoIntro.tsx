"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { playChimeSound, playTypeSound, primeAudio } from "@/lib/sound-fx";
import { INTRO_SESSION_KEY } from "@/lib/intro-session";

const EASE = [0.22, 1, 0.36, 1] as const;
const WORD = "Methodea";

const WHITE_SRC = "/brand/methodea-chevron-white.png";
const BLUE_SRC = "/brand/methodea-chevron-blue.png";

// Choreography (seconds). Larger lockup, deliberately slow assemble → type → hold → fade.
const FLY_DUR = 2.55;
const HOLD_AFTER_FLY = 1.15;
const TYPE_START = FLY_DUR + HOLD_AFTER_FLY; // ~3.7
const TYPE_STEP_MS = 255;
const HOLD_AFTER_TYPE_MS = 2100;
const EXIT_DUR = 1.35;
const SLIDE_DUR = 1.1;
const DISMISS_MS =
  Math.round(TYPE_START * 1000) + WORD.length * TYPE_STEP_MS + HOLD_AFTER_TYPE_MS;

type IntroSizes = { icon: number; gap: number; textW: number; textPx: number };

const DEFAULT_SIZES: IntroSizes = { icon: 248, gap: 52, textW: 580, textPx: 82 };

/** Fit lockup inside the viewport with side margin — prevents mobile clipping. */
function sizesForWidth(w: number): IntroSizes {
  if (w >= 1100) return DEFAULT_SIZES;

  const budget = Math.max(260, w - 40);
  if (w >= 720) {
    const icon = Math.min(220, Math.round(budget * 0.28));
    const gap = Math.min(44, Math.round(budget * 0.055));
    const textW = Math.max(280, budget - icon - gap);
    const textPx = Math.min(72, Math.round(textW / 7.2));
    return { icon, gap, textW, textPx };
  }
  if (w >= 560) {
    const icon = Math.min(188, Math.round(budget * 0.3));
    const gap = Math.min(34, Math.round(budget * 0.05));
    const textW = Math.max(220, budget - icon - gap);
    const textPx = Math.min(58, Math.round(textW / 7.2));
    return { icon, gap, textW, textPx };
  }

  const icon = Math.round(Math.min(148, Math.max(88, budget * 0.3)));
  const gap = Math.round(Math.min(22, Math.max(10, budget * 0.045)));
  const textW = Math.max(160, budget - icon - gap);
  const textPx = Math.round(Math.min(42, Math.max(28, textW / 7.1)));
  return { icon, gap, textW, textPx };
}

function revealSite() {
  try {
    document.documentElement.dataset.intro = "done";
  } catch {
    /* ignore */
  }
}

function markIntroShown() {
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * One-time Methodea logo intro: white chevron flies from top, blue from bottom,
 * then "Methodea" types letter-by-letter. Session-gated; skippable.
 * CSS gate (data-intro=wait) + this useLayoutEffect keep pure black until done —
 * no boot <script> (incompatible with next-intl locale client navigation).
 */
export default function LogoIntro() {
  const [show, setShow] = useState(false);
  const [sizes, setSizes] = useState<IntroSizes>(DEFAULT_SIZES);
  const [typed, setTyped] = useState(0);
  const [soundOk, setSoundOk] = useState(false);
  const dismissed = useRef(false);
  const timers = useRef<number[]>([]);
  const soundOkRef = useRef(false);

  const dismiss = (withChime: boolean) => {
    if (dismissed.current) return;
    dismissed.current = true;
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    if (withChime) playChimeSound();
    markIntroShown();
    revealSite();
    setShow(false);
  };

  // Before paint: open the gate for return visits, or keep black + start splash.
  // useLayoutEffect (not useEffect) so locale remounts never flash the ritual hero.
  useLayoutEffect(() => {
    let reduceMotion = false;
    let alreadyShown = false;
    try {
      alreadyShown = Boolean(sessionStorage.getItem(INTRO_SESSION_KEY));
      if (alreadyShown) {
        revealSite();
        return;
      }
      // Keep data-intro="wait" until dismiss — do NOT write sessionStorage here
      // (early write + Strict Mode remount used to skip the splash and flash the site).
      document.documentElement.dataset.intro = "wait";
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      // storage unavailable — still play once for this page load
      try {
        document.documentElement.dataset.intro = "wait";
      } catch {
        /* ignore */
      }
    }

    setSizes(sizesForWidth(window.innerWidth));

    if (reduceMotion) {
      // Instant lockup, brief hold, then out — no fly / type / sound.
      setShow(true);
      setTyped(WORD.length);
      const t = window.setTimeout(() => dismiss(false), 900);
      timers.current.push(t);
      return () => {
        for (const id of timers.current) window.clearTimeout(id);
      };
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);

    // Typewriter clock (sounds fire from typed-effect once audio is unlocked)
    for (let i = 1; i <= WORD.length; i++) {
      const id = window.setTimeout(
        () => setTyped(i),
        Math.round(TYPE_START * 1000) + (i - 1) * TYPE_STEP_MS,
      );
      timers.current.push(id);
    }

    const dismissTimer = window.setTimeout(() => dismiss(true), DISMISS_MS);
    timers.current.push(dismissTimer);

    const onResize = () => setSizes(sizesForWidth(window.innerWidth));
    window.addEventListener("resize", onResize);

    return () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unlock audio on first pointer/key — browsers block autoplay.
  // Also listen on the intro overlay so the first tap of Skip/intro unlocks.
  useEffect(() => {
    if (!show || soundOkRef.current) return;

    const unlock = () => {
      void primeAudio().then((ok) => {
        if (!ok || soundOkRef.current) return;
        soundOkRef.current = true;
        setSoundOk(true);
      });
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [show]);

  // Skip via Escape (pointer on overlay unlocks audio without dismissing).
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        void primeAudio().then(() => dismiss(true));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  // Play a keyclick each time a new letter appears (once audio is unlocked).
  const prevTyped = useRef(0);
  useEffect(() => {
    if (!show || !soundOk) {
      prevTyped.current = typed;
      return;
    }
    if (typed > prevTyped.current && typed > 0 && typed <= WORD.length) {
      playTypeSound();
    }
    prevTyped.current = typed;
  }, [typed, soundOk, show]);

  const { icon: ICON, gap: GAP, textW: TEXT_W, textPx: TEXT_PX } = sizes;
  const LOCKUP_W = ICON + GAP + TEXT_W;
  const ICON_CENTER_X = (LOCKUP_W - ICON) / 2;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="logo-intro"
          role="dialog"
          aria-label="Methodea"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_DUR, ease: EASE }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#05070a] px-4"
          onPointerDown={() => {
            void primeAudio().then((ok) => {
              if (!ok || soundOkRef.current) return;
              soundOkRef.current = true;
              setSoundOk(true);
            });
          }}
        >
          <div
            className="chrome-ltr relative flex max-w-full items-center"
            style={{ width: LOCKUP_W, height: ICON }}
          >
            {/* Icon stays centered while alone, then slides left as type begins */}
            <motion.div
              className="absolute top-0 left-0"
              style={{ width: ICON, height: ICON }}
              initial={{ x: ICON_CENTER_X }}
              animate={{ x: 0 }}
              transition={{
                delay: TYPE_START - 0.18,
                duration: SLIDE_DUR,
                ease: EASE,
              }}
            >
              <motion.div
                className="absolute rounded-full bg-[rgba(77,180,255,0.28)] blur-3xl"
                style={{ inset: "-55%" }}
                initial={{ opacity: 0, scale: 0.55 }}
                animate={{ opacity: [0, 0.55, 0.3], scale: [0.55, 1.18, 1] }}
                transition={{ delay: FLY_DUR * 0.55, duration: 1.1, ease: EASE }}
              />

              {/* White chevron — from top */}
              <motion.div
                className="absolute inset-0"
                initial={{ y: "-42vh", opacity: 0, filter: "blur(10px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: FLY_DUR, ease: EASE }}
                style={{ filter: "drop-shadow(0 0 18px rgba(245,247,250,0.4))" }}
              >
                <Image
                  src={WHITE_SRC}
                  alt=""
                  width={304}
                  height={236}
                  priority
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </motion.div>

              {/* Blue chevron — from bottom */}
              <motion.div
                className="absolute inset-0"
                initial={{ y: "42vh", opacity: 0, filter: "blur(10px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: FLY_DUR, ease: EASE }}
                style={{ filter: "drop-shadow(0 0 22px rgba(56,140,255,0.6))" }}
              >
                <Image
                  src={BLUE_SRC}
                  alt=""
                  width={304}
                  height={236}
                  priority
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </motion.div>
            </motion.div>

            {/* Wordmark typewriter */}
            <div
              className="absolute top-0 flex h-full items-center overflow-hidden whitespace-nowrap"
              style={{ left: ICON + GAP, width: TEXT_W }}
              aria-hidden="true"
            >
              <span
                className="font-medium tracking-tight text-white"
                style={{
                  fontSize: TEXT_PX,
                  fontFamily: "var(--font-latin), system-ui, sans-serif",
                }}
              >
                {WORD.slice(0, typed)}
                {typed > 0 && typed < WORD.length && (
                  <span className="ms-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.08em] bg-white/80 align-middle" />
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="label-mono absolute bottom-10 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.32em] text-white/35 uppercase transition-colors hover:text-white/70"
            onClick={(e) => {
              e.stopPropagation();
              void primeAudio().then(() => dismiss(true));
            }}
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
