"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./ritual.css";
import RitualHeader from "./RitualHeader";
import StageRail, { type StageId } from "./StageRail";
import IntroStage from "./stages/IntroStage";
import MethodStage from "./stages/MethodStage";
import RealizationStage from "./stages/RealizationStage";
import FutureStage from "./stages/FutureStage";

const STAGE_IDS: StageId[] = ["intro", "method", "realization", "future"];

export default function RitualHome() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<StageId>("intro");

  const scrollTo = useCallback((id: StageId | "works") => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sections = STAGE_IDS.map((id) => document.getElementById(id)).filter(
      (n): n is HTMLElement => Boolean(n),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target?.id) return;
        const id = visible.target.id as StageId;
        if (STAGE_IDS.includes(id)) setActive(id);
      },
      {
        root,
        threshold: [0.25, 0.45, 0.6],
        rootMargin: "-10% 0px -35% 0px",
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="ritual-root">
      <RitualHeader active={active} onNavigate={scrollTo} />
      <StageRail active={active} onSelect={scrollTo} />
      <IntroStage />
      <MethodStage />
      <RealizationStage />
      <FutureStage />
    </div>
  );
}
