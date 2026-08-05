"use client";

import { useEffect, useRef } from "react";

type Mode = "nebula" | "structure" | "soft";

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  cyan: boolean;
  hex: boolean;
};

type Props = {
  mode?: Mode;
  className?: string;
  density?: number;
  /** When false, RAF loop idles — keep only the active stage animating. */
  active?: boolean;
};

/**
 * Lightweight 2D canvas nebula — capped particles, paused off-screen / when hidden.
 * Avoids Three.js GPU load from the previous spiral.
 */
export default function NebulaCanvas({
  mode = "nebula",
  className = "",
  density = 1,
  active = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const kickRef = useRef<(() => void) | null>(null);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let visible = true;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: Particle[] = [];

    const countBase = mode === "structure" ? 48 : mode === "soft" ? 36 : 70;
    const count = Math.max(24, Math.round(countBase * density));

    function resize() {
      if (!canvas || !ctx) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      particles = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() ** 0.7 * Math.min(w, h) * 0.38;
        const cx = w * 0.5;
        const cy = h * (mode === "structure" ? 0.42 : 0.48);
        return {
          x: cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
          y: cy + Math.sin(angle) * dist * 0.75 + (Math.random() - 0.5) * 40,
          r: mode === "structure" ? 1.2 + Math.random() * 2.4 : 0.8 + Math.random() * 3.2,
          vx: (Math.random() - 0.5) * (reduceMotion ? 0 : 0.12),
          vy: (Math.random() - 0.5) * (reduceMotion ? 0 : 0.1),
          cyan: Math.random() > 0.42,
          hex: Math.random() > 0.88,
        };
      });
    }

    function drawHex(x: number, y: number, r: number, color: string) {
      if (!ctx) return;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    function frame() {
      if (!ctx || !running) return;
      if (!visible || !activeRef.current) {
        raf = 0;
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, Math.min(w, h) * 0.42);
      g.addColorStop(0, "rgba(77, 243, 255, 0.07)");
      g.addColorStop(0.45, "rgba(138, 92, 246, 0.05)");
      g.addColorStop(1, "rgba(7, 8, 12, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      if (mode === "structure") {
        ctx.strokeStyle = "rgba(200, 220, 255, 0.08)";
        ctx.lineWidth = 0.6;
        for (let i = 0; i < particles.length; i += 3) {
          const a = particles[i];
          const b = particles[(i + 5) % particles.length];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (dx * dx + dy * dy < 12000) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          const cx = w * 0.5;
          const cy = h * 0.48;
          p.vx += (cx - p.x) * 0.000015;
          p.vy += (cy - p.y) * 0.000015;
          p.vx *= 0.995;
          p.vy *= 0.995;
        }

        const color = p.cyan ? "rgba(77, 243, 255, 0.85)" : "rgba(180, 150, 255, 0.8)";
        if (p.hex) {
          drawHex(p.x, p.y, p.r * 2.2, color);
        } else {
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.55 + (p.r / 6) * 0.35;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      raf = requestAnimationFrame(frame);
    }

    const kick = () => {
      if (!running || raf) return;
      if (!visible || !activeRef.current) return;
      raf = requestAnimationFrame(frame);
    };
    kickRef.current = kick;

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) kick();
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running) kick();
    };
    document.addEventListener("visibilitychange", onVis);

    resize();
    window.addEventListener("resize", resize, { passive: true });
    kick();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
      kickRef.current = null;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
    };
  }, [mode, density]);

  useEffect(() => {
    if (active) kickRef.current?.();
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
