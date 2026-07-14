"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SESSION_KEY = "flux-intro-shown";
const EASE = [0.22, 1, 0.36, 1] as const;

// Traced from the brand mark artwork: two angular "F" strokes that overlap
// to form the icon. Kept as inline SVG paths (instead of the flattened PNG)
// so the blue and white strokes can fly in and animate independently, and
// so glow/blur filters stay crisp at any size.
const WHITE_PATH =
  "M32.62,60.50 L37.84,50.00 L37.74,48.73 L34.33,42.29 L34.42,39.94 L45.21,23.88 L77.78,24.02 L66.21,32.18 L48.24,32.57 L42.53,40.43 L42.53,41.89 L43.80,44.43 L43.60,45.90 Z";
const BLUE_PATH =
  "M29.59,67.82 L45.75,46.09 L47.07,44.87 L59.18,36.67 L73.49,36.52 L61.91,45.17 L55.76,45.36 L54.79,45.85 L43.75,61.47 Z";

// Layout: a fixed-size lockup box keeps the icon perfectly centered on
// screen while it is alone (frames 1-4), then the icon slides to the box's
// left edge and the wordmark fades in beside it (frames 5-6) -- all via
// plain transforms, no layout measurement needed.
const ICON = 72;
const GAP = 16;
const TEXT_W = 200;
const LOCKUP_W = ICON + GAP + TEXT_W;
const ICON_CENTER_X = (LOCKUP_W - ICON) / 2;

// Choreography timings (seconds). Total runtime target: ~1.9s of animation
// plus a short dissolve, staying well inside the client's 1.8-2.5s budget.
const FLY_DUR = 0.42; // frames 1+2, ascent + descent run in parallel
const RING_START = 0.34; // frame 3, convergence overlaps the tail of the fly-in
const RING_DUR = 0.36;
const GLOW_START = 0.37; // frame 4, ambient pulse settles in right as pieces land
const GLOW_DUR = 0.55;
const SLIDE_START = 0.95; // frame 5
const SLIDE_DUR = 0.32;
const TEXT_START = 1.15; // frame 6, overlaps the tail of the slide
const TEXT_DUR = 0.5;
const DISMISS_MS = 1950;
const EXIT_DUR = 0.5;

const PARTICLE_COUNT = 14;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
  const radius = 42 + (i % 3) * 7;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    delay: (i % 5) * 0.018,
    blue: i % 2 === 0,
  };
});

/**
 * One-time animated logo intro: the icon's two strokes fly in from opposite
 * directions and connect with a soft energy burst, hold with an ambient
 * pulse, then slide left as the "Flux Agency" wordmark fades in beside it.
 * The whole overlay then dissolves to reveal the site underneath (which
 * keeps rendering behind it the whole time). Gated by sessionStorage so it
 * only plays on a fresh page load, never on in-app route navigation. Default
 * state renders nothing on both server and first client render, so there is
 * no hydration mismatch and no flash for repeat loads within the same
 * session.
 */
export default function LogoIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // If storage is unavailable, fall through and still play the intro once
      // for this mount rather than throwing.
    }

    // Reacting to an external system (sessionStorage, only readable client-side)
    // to decide whether to play a one-time intro is an intentional mount effect,
    // not state that could be derived during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    const dismiss = window.setTimeout(() => setShow(false), DISMISS_MS);

    return () => window.clearTimeout(dismiss);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="logo-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_DUR, ease: EASE }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-bg"
        >
          <div
            className="chrome-ltr relative flex items-center"
            style={{ width: LOCKUP_W, height: ICON }}
          >
            {/* residual glow left where the icon started, fading as it departs */}
            <motion.div
              className="absolute top-1/2 h-1 w-16 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-accent/45 to-transparent"
              style={{ left: ICON_CENTER_X - 4, filter: "blur(4px)" }}
              initial={{ opacity: 0, scaleX: 0.5 }}
              animate={{ opacity: [0, 0.55, 0], scaleX: [0.5, 1.5, 1.9] }}
              transition={{ delay: SLIDE_START, duration: SLIDE_DUR + 0.12, ease: EASE }}
            />

            {/* icon group: everything here moves together for the slide-left beat */}
            <motion.div
              className="absolute left-0 top-0"
              style={{ width: ICON, height: ICON }}
              initial={{ x: ICON_CENTER_X }}
              animate={{ x: 0 }}
              transition={{ delay: SLIDE_START, duration: SLIDE_DUR, ease: EASE }}
            >
              {/* ambient glow, settles into a soft contained pulse once landed */}
              <motion.div
                className="absolute rounded-full bg-accent/30 blur-2xl"
                style={{ inset: "-45%" }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0, 0.55, 0.38], scale: [0.6, 1.15, 1] }}
                transition={{ delay: GLOW_START, duration: GLOW_DUR, ease: EASE, times: [0, 0.55, 1] }}
              />

              {/* soft convergence flash */}
              <motion.div
                className="absolute inset-0 rounded-full bg-text"
                style={{ filter: "blur(9px)" }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 0.4, 0], scale: [0.3, 1.25, 1.5] }}
                transition={{ delay: RING_START, duration: RING_DUR, ease: EASE, times: [0, 0.35, 1] }}
              />

              {/* energy rings */}
              <motion.div
                className="absolute inset-0 rounded-full border border-accent/70"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5, 1.85] }}
                transition={{ delay: RING_START, duration: RING_DUR, ease: EASE }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-text/35"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.35, 0], scale: [0.5, 1.3, 1.6] }}
                transition={{ delay: RING_START + 0.05, duration: RING_DUR, ease: EASE }}
              />

              {/* fine particle burst */}
              {particles.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-[3px] w-[3px] rounded-full"
                  style={{ background: p.blue ? "#2563EB" : "#F5F7FA" }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{ x: p.x, y: p.y, opacity: [0, 0.85, 0], scale: [0.4, 1, 0.5] }}
                  transition={{ delay: RING_START + p.delay, duration: 0.5, ease: EASE }}
                />
              ))}

              {/* descent light trail (white) */}
              <motion.div
                className="absolute left-1/2 bottom-full h-14 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-text/55 to-transparent"
                style={{ filter: "blur(4px)" }}
                initial={{ opacity: 0.55, scaleY: 1.5 }}
                animate={{ opacity: 0, scaleY: 0.3 }}
                transition={{ duration: FLY_DUR * 0.85, ease: EASE }}
              />
              {/* white stroke, descends from above */}
              <motion.svg
                viewBox="0 0 100 100"
                width={ICON}
                height={ICON}
                className="absolute inset-0"
                style={{ filter: "drop-shadow(0 0 10px rgba(245,247,250,0.35))" }}
                initial={{ y: -46, opacity: 0, filter: "blur(6px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: FLY_DUR, ease: EASE }}
              >
                <path d={WHITE_PATH} fill="#F5F7FA" />
              </motion.svg>

              {/* ascent light trail (blue) */}
              <motion.div
                className="absolute left-1/2 top-full h-14 w-1 -translate-x-1/2 rounded-full bg-gradient-to-t from-accent/65 to-transparent"
                style={{ filter: "blur(4px)" }}
                initial={{ opacity: 0.6, scaleY: 1.5 }}
                animate={{ opacity: 0, scaleY: 0.3 }}
                transition={{ duration: FLY_DUR * 0.85, ease: EASE }}
              />
              {/* blue stroke, rises from below */}
              <motion.svg
                viewBox="0 0 100 100"
                width={ICON}
                height={ICON}
                className="absolute inset-0"
                style={{ filter: "drop-shadow(0 0 12px rgba(37,99,235,0.55))" }}
                initial={{ y: 46, opacity: 0, filter: "blur(6px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: FLY_DUR, ease: EASE }}
              >
                <defs>
                  <linearGradient id="flux-intro-blue" x1="30" y1="68" x2="73" y2="37" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#1d4ed8" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <path d={BLUE_PATH} fill="url(#flux-intro-blue)" />
              </motion.svg>
            </motion.div>

            {/* wordmark */}
            <motion.div
              className="absolute top-0 flex h-full items-center whitespace-nowrap"
              style={{ left: ICON + GAP }}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: TEXT_START, duration: TEXT_DUR, ease: EASE }}
            >
              <span className="text-[30px] font-medium tracking-tight text-text sm:text-[34px]">
                Flux Agency
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
