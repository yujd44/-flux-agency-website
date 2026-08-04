"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const LUXURY_SRC = "/images/hero-spiral-luxury.png";

/**
 * Luxury hero spiral — animated figure matched to the generated still.
 * Continuous slow 3D orbit + float + glow pulse (never a frozen photo).
 * Static PNG only when prefers-reduced-motion.
 */
export default function HeroSpiral() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="hero-spiral-stage absolute inset-0"
      aria-hidden="true"
    >
      <div className="hero-spiral-perspective absolute inset-0">
        {reduceMotion ? (
          <div className="hero-spiral-figure absolute inset-0">
            <Image
              src={LUXURY_SRC}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 70vw"
              className="hero-spiral-img object-contain object-right"
            />
          </div>
        ) : (
          <motion.div
            className="hero-spiral-figure absolute inset-0 will-change-transform"
            initial={{ rotateY: -14, rotateX: 4, y: 14, scale: 1 }}
            animate={{
              rotateY: [-14, 18, -14],
              rotateX: [4, -5, 4],
              rotateZ: [-2.5, 3, -2.5],
              y: [14, -22, 14],
              scale: [1, 1.04, 1],
            }}
            transition={{
              duration: 12,
              ease: "easeInOut",
              repeat: Infinity,
              times: [0, 0.5, 1],
            }}
          >
            <motion.div
              className="hero-spiral-bloom absolute inset-0"
              animate={{
                filter: [
                  "brightness(1) saturate(1.05) drop-shadow(0 0 28px rgba(232,196,160,0.22)) drop-shadow(0 0 48px rgba(186,140,220,0.16))",
                  "brightness(1.1) saturate(1.18) drop-shadow(0 0 42px rgba(232,196,160,0.38)) drop-shadow(0 0 72px rgba(186,140,220,0.28))",
                  "brightness(1) saturate(1.05) drop-shadow(0 0 28px rgba(232,196,160,0.22)) drop-shadow(0 0 48px rgba(186,140,220,0.16))",
                ],
              }}
              transition={{
                duration: 4.8,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <Image
                src={LUXURY_SRC}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 100vw, 70vw"
                className="hero-spiral-img object-contain object-right"
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
