"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LOGO_BLUE_PATH, LOGO_WHITE_PATH } from "@/lib/logo-paths";

const SESSION_KEY = "flux-intro-shown";
const EASE = [0.22, 1, 0.36, 1] as const;

// Layout: a fixed-size lockup box keeps the icon perfectly centered on
// screen while it is alone (frames 1-4), then the icon slides to the box's
// left edge and the wordmark fades in beside it (frames 5-6) -- all via
// plain transforms, no layout measurement needed. Sized per viewport
// (mobile vs. desktop) at mount time so the mark reads clearly bigger than
// before on every screen size, not just on large viewports.
type IntroSizes = { icon: number; gap: number; textW: number; textPx: number };
const SIZES: { mobile: IntroSizes; desktop: IntroSizes } = {
  mobile: { icon: 108, gap: 16, textW: 220, textPx: 34 },
  desktop: { icon: 128, gap: 20, textW: 250, textPx: 40 },
};

// Choreography timings (seconds). Every beat from the original ~1.9s +
// 0.5s-fade sequence is kept, just stretched (~1.35x) with extra breathing
// room on the pulse-hold beat so the completed mark has time to register
// before it slides and dissolves -- total runtime lands around ~3.3s.
const FLY_DUR = 0.56; // frames 1+2, ascent + descent run in parallel
const RING_START = 0.46; // frame 3, convergence overlaps the tail of the fly-in
const RING_DUR = 0.48;
const GLOW_START = 0.5; // frame 4, ambient pulse settles in right as pieces land
const GLOW_DUR = 0.85; // held noticeably longer so the pulse is easy to enjoy
const SLIDE_START = 1.4; // frame 5
const SLIDE_DUR = 0.42;
const TEXT_START = 1.55; // frame 6, overlaps the tail of the slide
const TEXT_DUR = 0.65;
const DISMISS_MS = 2700;
const EXIT_DUR = 0.6;

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
  const [sizes, setSizes] = useState(SIZES.desktop);

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

    // Reacting to external systems (sessionStorage and the viewport width,
    // both only readable client-side) to decide whether/how to play a
    // one-time intro is an intentional mount effect, not state that could be
    // derived during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSizes(window.innerWidth < 640 ? SIZES.mobile : SIZES.desktop);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    const dismiss = window.setTimeout(() => setShow(false), DISMISS_MS);

    return () => window.clearTimeout(dismiss);
  }, []);

  const { icon: ICON, gap: GAP, textW: TEXT_W, textPx: TEXT_PX } = sizes;
  const LOCKUP_W = ICON + GAP + TEXT_W;
  const ICON_CENTER_X = (LOCKUP_W - ICON) / 2;

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
                className="absolute left-1/2 bottom-full h-20 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-text/55 to-transparent"
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
                initial={{ y: -ICON * 0.64, opacity: 0, filter: "blur(6px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: FLY_DUR, ease: EASE }}
              >
                <path d={LOGO_WHITE_PATH} fill="#F5F7FA" />
              </motion.svg>

              {/* ascent light trail (blue) */}
              <motion.div
                className="absolute left-1/2 top-full h-20 w-1 -translate-x-1/2 rounded-full bg-gradient-to-t from-accent/65 to-transparent"
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
                initial={{ y: ICON * 0.64, opacity: 0, filter: "blur(6px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: FLY_DUR, ease: EASE }}
              >
                <defs>
                  <linearGradient id="flux-intro-blue" x1="30" y1="68" x2="73" y2="37" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#1d4ed8" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <path d={LOGO_BLUE_PATH} fill="url(#flux-intro-blue)" />
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
              <span
                className="font-medium tracking-tight text-text"
                style={{ fontSize: TEXT_PX }}
              >
                Flux Agency
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
