"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { playChimeSound, playTypeSound, primeAudio } from "@/lib/sound-fx";

const SESSION_KEY = "methodea-intro-shown";
const EASE = [0.22, 1, 0.36, 1] as const;
const WORD = "Methodea";

const WHITE_SRC = "/brand/methodea-chevron-white.png";
const BLUE_SRC = "/brand/methodea-chevron-blue.png";

// Choreography (seconds). Pieces assemble, then wordmark types letter-by-letter.
const FLY_DUR = 0.55;
const HOLD_AFTER_FLY = 0.28;
const TYPE_START = FLY_DUR + HOLD_AFTER_FLY; // ~0.83
const TYPE_STEP_MS = 72;
const HOLD_AFTER_TYPE_MS = 520;
const EXIT_DUR = 0.55;
const DISMISS_MS =
  Math.round(TYPE_START * 1000) + WORD.length * TYPE_STEP_MS + HOLD_AFTER_TYPE_MS;

type IntroSizes = { icon: number; gap: number; textW: number; textPx: number };

const DEFAULT_SIZES: IntroSizes = { icon: 96, gap: 22, textW: 240, textPx: 34 };

function sizesForWidth(w: number): IntroSizes {
  if (w < 420) return { icon: 72, gap: 14, textW: 170, textPx: 26 };
  if (w < 720) return { icon: 88, gap: 18, textW: 210, textPx: 30 };
  return DEFAULT_SIZES;
}

/**
 * One-time Methodea logo intro: white chevron flies from top, blue from bottom,
 * then "Methodea" types letter-by-letter. Session-gated; skippable. Site renders
 * underneath and is revealed on dismiss.
 */
export default function LogoIntro() {
  const [show, setShow] = useState(false);
  const [sizes, setSizes] = useState<IntroSizes>(DEFAULT_SIZES);
  const [typed, setTyped] = useState(0);
  const [soundOk, setSoundOk] = useState(false);
  const dismissed = useRef(false);
  const timers = useRef<number[]>([]);

  const dismiss = (withChime: boolean) => {
    if (dismissed.current) return;
    dismissed.current = true;
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    if (withChime) playChimeSound();
    setShow(false);
  };

  useEffect(() => {
    let reduceMotion = false;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      // storage unavailable — still play once for this mount
    }

    setSizes(sizesForWidth(window.innerWidth));

    if (reduceMotion) {
      // Instant lockup, brief hold, then out — no fly / type / sound.
      setShow(true);
      setTyped(WORD.length);
      const t = window.setTimeout(() => dismiss(false), 400);
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

    return () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
    // soundOk intentionally omitted — typing timers are scheduled once on mount;
    // sound gates via ref-like state checked at fire time after first gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unlock audio on first pointer/key — browsers block autoplay.
  useEffect(() => {
    if (!show) return;
    const unlock = () => {
      primeAudio();
      setSoundOk(true);
    };
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [show]);

  // Skip via Escape (pointer on overlay unlocks audio without dismissing).
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        primeAudio();
        dismiss(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  // When sound unlocks mid-type, remaining letters can click (already gated in timers via soundOk —
  // but timers captured stale soundOk). Fix: play type sounds from a separate effect on typed.
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
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#05070a]"
        >
          <div
            className="chrome-ltr relative flex items-center"
            style={{ width: LOCKUP_W, height: ICON }}
          >
            {/* Icon stays centered while alone, then slides left as type begins */}
            <motion.div
              className="absolute top-0 left-0"
              style={{ width: ICON, height: ICON }}
              initial={{ x: ICON_CENTER_X }}
              animate={{ x: 0 }}
              transition={{ delay: TYPE_START - 0.08, duration: 0.38, ease: EASE }}
            >
              <motion.div
                className="absolute rounded-full bg-[rgba(77,180,255,0.28)] blur-2xl"
                style={{ inset: "-40%" }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0, 0.5, 0.28], scale: [0.6, 1.12, 1] }}
                transition={{ delay: FLY_DUR * 0.7, duration: 0.55, ease: EASE }}
              />

              {/* White chevron — from top */}
              <motion.div
                className="absolute inset-0"
                initial={{ y: -52, opacity: 0, filter: "blur(6px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: FLY_DUR, ease: EASE }}
                style={{ filter: "drop-shadow(0 0 10px rgba(245,247,250,0.35))" }}
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
                initial={{ y: 52, opacity: 0, filter: "blur(6px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: FLY_DUR, ease: EASE }}
                style={{ filter: "drop-shadow(0 0 12px rgba(56,140,255,0.55))" }}
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
              className="absolute top-0 flex h-full items-center whitespace-nowrap"
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
            className="label-mono absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.28em] text-white/35 uppercase transition-colors hover:text-white/70"
            onClick={(e) => {
              e.stopPropagation();
              primeAudio();
              dismiss(true);
            }}
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
