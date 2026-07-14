"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LOGO_BLUE_PATH, LOGO_WHITE_PATH } from "@/lib/logo-paths";

const SESSION_KEY = "flux-intro-shown";
const EASE = [0.22, 1, 0.36, 1] as const;
const MOBILE_BREAKPOINT = 640;

type IntroSizes = { icon: number; gap: number; textW: number; textPx: number };

// "Flux Agency" (11 characters, medium weight, tight tracking) renders at
// roughly 6.3x its font-size in pixel width -- used below to budget the
// wordmark's real on-screen width, not just an arbitrary ratio, so the
// lockup's width estimate stays accurate and never quietly overflows.
const WORDMARK_WIDTH_PER_PX = 6.3;

// Per-category ratios/caps for sizing the lockup off the viewport. The
// wordmark's font-size starts out proportional to the icon (`textPx`) but is
// capped (`textPxCap`) once it would otherwise get typographically oversized
// -- past that point the icon keeps growing into the freed-up width budget
// on its own, since the graphic mark (not a giant wordmark) is what should
// carry the "much bigger" impression. Mobile uses a taller share of the
// viewport height and a much wider share of viewport width (there's little
// horizontal room to spare on a portrait phone) to still read large.
const RATIOS = {
  mobile: { gap: 0.13, textPx: 0.21, textPxCap: 36, heightFraction: 0.34, widthFraction: 0.9 },
  desktop: { gap: 0.16, textPx: 0.31, textPxCap: 58, heightFraction: 0.42, widthFraction: 0.44 },
} as const;

const ICON_MIN = 96;
const ICON_MAX = 460;

/**
 * Sizes the intro lockup off the actual viewport so the mark reads as
 * genuinely large ("a bit less than half the screen") on any device,
 * without ever overflowing: the icon is capped by both a fraction of the
 * viewport height and a fraction of the viewport width (once the wordmark's
 * real on-screen width is budgeted in), so whichever axis is tighter wins
 * and the whole composition always stays comfortably on screen.
 */
function computeIntroSizes(vw: number, vh: number): IntroSizes {
  const r = vw < MOBILE_BREAKPOINT ? RATIOS.mobile : RATIOS.desktop;
  const heightBudget = vh * r.heightFraction;
  const widthBudget = vw * r.widthFraction;

  // Pass 1: assume the wordmark scales proportionally with the icon.
  const proportionalTotalRatio = 1 + r.gap + r.textPx * WORDMARK_WIDTH_PER_PX;
  let icon = Math.min(heightBudget, widthBudget / proportionalTotalRatio);

  // Pass 2: if that would push the font past its readability cap, redo the
  // width budget with the capped (now constant) wordmark width so the icon
  // is free to keep growing into the width the wordmark no longer needs.
  if (icon * r.textPx > r.textPxCap) {
    const cappedTextW = r.textPxCap * WORDMARK_WIDTH_PER_PX;
    icon = Math.min(heightBudget, (widthBudget - cappedTextW) / (1 + r.gap));
  }

  icon = Math.min(ICON_MAX, Math.max(ICON_MIN, icon));
  const textPx = Math.min(icon * r.textPx, r.textPxCap);
  const textW = textPx * WORDMARK_WIDTH_PER_PX;

  return {
    icon: Math.round(icon),
    gap: Math.round(icon * r.gap),
    textW: Math.round(textW),
    textPx: Math.round(textPx),
  };
}

const DEFAULT_SIZES = computeIntroSizes(1440, 900);

// Choreography timings (seconds). Every beat keeps its original order and
// character, just stretched further (~1.5x on top of the previous pass)
// with extra breathing room on the pulse-hold and the pre-dismiss hold, so
// the completed mark has real time to register -- total runtime now lands
// around ~4.9s, still inside the client's ~4.5-5.5s ask.
const FLY_DUR = 0.72; // frames 1+2, ascent + descent run in parallel
const RING_START = 0.6; // frame 3, convergence overlaps the tail of the fly-in
const RING_DUR = 0.62;
const GLOW_START = 0.65; // frame 4, ambient pulse settles in right as pieces land
const GLOW_DUR = 1.3; // held noticeably longer so the pulse is easy to enjoy
const SLIDE_START = 2.0; // frame 5
const SLIDE_DUR = 0.55;
const TEXT_START = 2.35; // frame 6, overlaps the tail of the slide
const TEXT_DUR = 0.85;
const DISMISS_MS = 4100;
const EXIT_DUR = 0.8;

const PARTICLE_COUNT = 14;

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
  const [sizes, setSizes] = useState<IntroSizes>(DEFAULT_SIZES);

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

    // Reacting to external systems (sessionStorage and the viewport size,
    // both only readable client-side) to decide whether/how to play a
    // one-time intro is an intentional mount effect, not state that could be
    // derived during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSizes(computeIntroSizes(window.innerWidth, window.innerHeight));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    const dismiss = window.setTimeout(() => setShow(false), DISMISS_MS);

    return () => window.clearTimeout(dismiss);
  }, []);

  const { icon: ICON, gap: GAP, textW: TEXT_W, textPx: TEXT_PX } = sizes;
  const LOCKUP_W = ICON + GAP + TEXT_W;
  const ICON_CENTER_X = (LOCKUP_W - ICON) / 2;

  // Every decorative flourish (trails, particle burst, residual glow bar)
  // scales off the resolved icon size so proportions stay balanced now that
  // the mark itself can be several times larger than before.
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const radius = ICON * (0.58 + (i % 3) * 0.1);
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          delay: (i % 5) * 0.022,
          blue: i % 2 === 0,
        };
      }),
    [ICON],
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="logo-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_DUR, ease: EASE }}
          // pointer-events-none: this overlay is purely decorative (the real
          // page underneath is already live and interactive). Without this,
          // the element keeps intercepting clicks for the full EXIT_DUR fade
          // -- even once it's visually transparent -- which is exactly what
          // made the very first click after a fresh page load (e.g. on the
          // language switcher) silently swallowed until a second click
          // landed after the node was finally removed from the DOM.
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-bg"
        >
          <div
            className="chrome-ltr relative flex items-center"
            style={{ width: LOCKUP_W, height: ICON }}
          >
            {/* residual glow left where the icon started, fading as it departs */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-accent/45 to-transparent"
              style={{ left: ICON_CENTER_X - 4, width: ICON * 0.5, height: Math.max(3, ICON * 0.02), filter: "blur(4px)" }}
              initial={{ opacity: 0, scaleX: 0.5 }}
              animate={{ opacity: [0, 0.55, 0], scaleX: [0.5, 1.5, 1.9] }}
              transition={{ delay: SLIDE_START, duration: SLIDE_DUR + 0.16, ease: EASE }}
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
                transition={{ delay: RING_START + 0.07, duration: RING_DUR, ease: EASE }}
              />

              {/* fine particle burst */}
              {particles.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: Math.max(3, ICON * 0.025),
                    height: Math.max(3, ICON * 0.025),
                    background: p.blue ? "#2563EB" : "#F5F7FA",
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                  animate={{ x: p.x, y: p.y, opacity: [0, 0.85, 0], scale: [0.4, 1, 0.5] }}
                  transition={{ delay: RING_START + p.delay, duration: 0.65, ease: EASE }}
                />
              ))}

              {/* descent light trail (white) */}
              <motion.div
                className="absolute left-1/2 bottom-full -translate-x-1/2 rounded-full bg-gradient-to-b from-text/55 to-transparent"
                style={{ width: Math.max(2, ICON * 0.014), height: ICON * 0.62, filter: "blur(4px)" }}
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
                className="absolute left-1/2 top-full -translate-x-1/2 rounded-full bg-gradient-to-t from-accent/65 to-transparent"
                style={{ width: Math.max(2, ICON * 0.014), height: ICON * 0.62, filter: "blur(4px)" }}
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
