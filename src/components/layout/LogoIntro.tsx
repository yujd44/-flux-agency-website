"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const SESSION_KEY = "flux-intro-shown";
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * One-time animated logo intro: icon mark alone -> crossfades into the full
 * "Flux Agency" lockup -> the whole overlay dissolves to reveal the site
 * underneath (which keeps rendering behind it the whole time). Gated by
 * sessionStorage so it only plays on a fresh page load, never on in-app
 * route navigation. Default state renders nothing on both server and first
 * client render, so there is no hydration mismatch and no flash for repeat
 * loads within the same session.
 */
export default function LogoIntro() {
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState<"mark" | "full">("mark");

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
    const toFull = window.setTimeout(() => setStage("full"), 650);
    const dismiss = window.setTimeout(() => setShow(false), 1900);

    return () => {
      window.clearTimeout(toFull);
      window.clearTimeout(dismiss);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="logo-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-bg"
        >
          <div className="relative flex h-[110px] w-[260px] items-center justify-center">
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.86 }}
              animate={
                stage === "mark"
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.9 }
              }
              transition={{ duration: stage === "mark" ? 0.6 : 0.5, ease: EASE }}
            >
              <Image
                src="/logo-mark.png"
                alt=""
                width={80}
                height={80}
                priority
                className="h-[80px] w-[80px] object-contain"
              />
            </motion.div>

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={
                stage === "full"
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 1.05 }
              }
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Image
                src="/logo-full.png"
                alt="Flux Agency"
                width={240}
                height={160}
                priority
                className="h-auto w-[220px] object-contain sm:w-[240px]"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
