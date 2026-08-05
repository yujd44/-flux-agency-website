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

// Choreography (seconds). Slow, spacious assemble → typewriter → hold → fade.
const FLY_DUR = 1.45;
const HOLD_AFTER_FLY = 0.75;
const TYPE_START = FLY_DUR + HOLD_AFTER_FLY; // ~2.2
const TYPE_STEP_MS = 165;
const HOLD_AFTER_TYPE_MS = 1400;
const EXIT_DUR = 0.95;
const SLIDE_DUR = 0.72;
const DISMISS_MS =
  Math.round(TYPE_START * 1000) + WORD.length * TYPE_STEP_MS + HOLD_AFTER_TYPE_MS;

type IntroSizes = { icon: number; gap: number; textW: number; textPx: number };

const DEFAULT_SIZES: IntroSizes = { icon: 168, gap: 36, textW: 420, textPx: 58 };

function sizesForWidth(w: number): IntroSizes {
  if (w < 420) return { icon: 112, gap: 20, textW: 250, textPx: 36 };
  if (w < 720) return { icon: 140, gap: 28, textW: 340, textPx: 48 };
  if (w < 1100) return { icon: 156, gap: 32, textW: 390, textPx: 54 };
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
            className="label-mono absolute bottom-10 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.32em] text-white/35 uppercase transition-colors hover:text-white/70"
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
