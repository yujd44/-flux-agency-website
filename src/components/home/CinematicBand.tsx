"use client";

import { useEffect, useRef } from "react";

/**
 * Full-bleed mid-page atmosphere — second video between stats and services.
 * Visual punctuation only; no cards or competing copy.
 */
export default function CinematicBand() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (mq.matches) {
        video.pause();
      } else {
        void video.play().catch(() => {});
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || mq.matches) {
          video.pause();
          return;
        }
        void video.play().catch(() => {});
      },
      { threshold: 0.2 },
    );

    io.observe(video);
    mq.addEventListener("change", sync);
    return () => {
      io.disconnect();
      mq.removeEventListener("change", sync);
    };
  }, []);

  return (
    <section
      className="cinematic-band relative mt-16 overflow-hidden lg:mt-24"
      aria-hidden="true"
    >
      <div className="relative h-[min(52vh,420px)] w-full sm:h-[min(56vh,480px)]">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="none"
        >
          <source src="/videos/cinematic-atmosphere.mp4" type="video/mp4" />
        </video>
        <div className="cinematic-band-scrim absolute inset-0" />
      </div>
    </section>
  );
}
