"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export type RibbonFx = {
  tiltX: number;
  tiltY: number;
  scrollY: number;
  spotX: number;
  spotY: number;
  spotActive: boolean;
  specularX: number;
  specularY: number;
};

const MAX_TILT = 3.2;
const MAX_GYRO = 2.4;
const MAX_SCROLL_SHIFT = 36;

const idle: RibbonFx = {
  tiltX: 0,
  tiltY: 0,
  scrollY: 0,
  spotX: 72,
  spotY: 48,
  spotActive: false,
  specularX: 70,
  specularY: 45,
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll-scrubbed parallax + pointer tilt + optional device orientation,
 * cursor spotlight / specular coords for the hero ribbon.
 */
export function useRibbonFx(artRef: RefObject<HTMLElement | null>) {
  const [fx, setFx] = useState<RibbonFx>(idle);
  const state = useRef({
    pointerTilt: { x: 0, y: 0 },
    gyroTilt: { x: 0, y: 0 },
    scrollY: 0,
    spot: { x: 72, y: 48, active: false },
    specular: { x: 70, y: 45 },
  });
  const raf = useRef(0);

  useEffect(() => {
    const el = artRef.current;
    if (!el || prefersReducedMotion()) return;

    const flush = () => {
      raf.current = 0;
      const s = state.current;
      setFx({
        tiltX: s.pointerTilt.x + s.gyroTilt.x,
        tiltY: s.pointerTilt.y + s.gyroTilt.y,
        scrollY: s.scrollY,
        spotX: s.spot.x,
        spotY: s.spot.y,
        spotActive: s.spot.active,
        specularX: s.specular.x,
        specularY: s.specular.y,
      });
    };

    const schedule = () => {
      if (!raf.current) raf.current = requestAnimationFrame(flush);
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      state.current.pointerTilt = {
        x: -((ny - 0.5) * MAX_TILT * 2),
        y: (nx - 0.5) * MAX_TILT * 2,
      };
      state.current.spot = {
        x: Math.min(100, Math.max(0, nx * 100)),
        y: Math.min(100, Math.max(0, ny * 100)),
        active: true,
      };
      state.current.specular = {
        x: Math.min(100, Math.max(0, nx * 100)),
        y: Math.min(100, Math.max(0, ny * 100)),
      };
      schedule();
    };

    const onLeave = () => {
      state.current.pointerTilt = { x: 0, y: 0 };
      state.current.spot = { ...state.current.spot, active: false };
      schedule();
    };

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      // 0 at top of viewport, grows as hero scrolls up
      const progress = Math.min(1, Math.max(0, -rect.top / (rect.height + viewH * 0.35)));
      state.current.scrollY = progress * MAX_SCROLL_SHIFT;
      schedule();
    };

    const onOrient = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0; // front-back
      const gamma = e.gamma ?? 0; // left-right
      state.current.gyroTilt = {
        x: Math.max(-MAX_GYRO, Math.min(MAX_GYRO, -beta * 0.04)),
        y: Math.max(-MAX_GYRO, Math.min(MAX_GYRO, gamma * 0.05)),
      };
      schedule();
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    let gyroAttached = false;
    const attachGyro = () => {
      if (gyroAttached) return;
      window.addEventListener("deviceorientation", onOrient, { passive: true });
      gyroAttached = true;
    };

    // iOS 13+ permission; desktop just no-ops
    const Doe = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof Doe.requestPermission === "function") {
      // Defer until first touch so we don't spam the prompt
      const ask = () => {
        Doe.requestPermission!()
          .then((res) => {
            if (res === "granted") attachGyro();
          })
          .catch(() => {});
        window.removeEventListener("touchend", ask);
      };
      window.addEventListener("touchend", ask, { once: true, passive: true });
    } else if ("DeviceOrientationEvent" in window) {
      attachGyro();
    }

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      if (gyroAttached) window.removeEventListener("deviceorientation", onOrient);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [artRef]);

  return fx;
}
