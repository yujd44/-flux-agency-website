"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AmbientApi = {
  enabled: boolean;
  blocked: boolean;
  toggle: () => void;
};

/**
 * Very quiet Web Audio drone (two soft sine layers). Autoplay may be blocked —
 * toggle starts/resumes the context on user gesture.
 */
export function useAmbient(): AmbientApi {
  const [enabled, setEnabled] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    master: GainNode;
    oscA: OscillatorNode;
    oscB: OscillatorNode;
    lfo: OscillatorNode;
    lfoGain: GainNode;
  } | null>(null);

  const teardown = useCallback(() => {
    const nodes = nodesRef.current;
    if (nodes) {
      try {
        nodes.oscA.stop();
        nodes.oscB.stop();
        nodes.lfo.stop();
      } catch {
        /* already stopped */
      }
      nodesRef.current = null;
    }
    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }
  }, []);

  const build = useCallback(async () => {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) {
      setBlocked(true);
      return false;
    }

    const ctx = new AC();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    filter.connect(master);

    const oscA = ctx.createOscillator();
    oscA.type = "sine";
    oscA.frequency.value = 110;
    const gainA = ctx.createGain();
    gainA.gain.value = 0.012;
    oscA.connect(gainA);
    gainA.connect(filter);

    const oscB = ctx.createOscillator();
    oscB.type = "sine";
    oscB.frequency.value = 164.8;
    const gainB = ctx.createGain();
    gainB.gain.value = 0.008;
    oscB.connect(gainB);
    gainB.connect(filter);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.004;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);

    oscA.start();
    oscB.start();
    lfo.start();

    nodesRef.current = { master, oscA, oscB, lfo, lfoGain };

    try {
      if (ctx.state === "suspended") await ctx.resume();
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.018, now + 1.4);
      setBlocked(false);
      return true;
    } catch {
      setBlocked(true);
      teardown();
      return false;
    }
  }, [teardown]);

  const toggle = useCallback(async () => {
    if (enabled) {
      const nodes = nodesRef.current;
      const ctx = ctxRef.current;
      if (nodes && ctx) {
        const now = ctx.currentTime;
        nodes.master.gain.cancelScheduledValues(now);
        nodes.master.gain.setValueAtTime(nodes.master.gain.value, now);
        nodes.master.gain.linearRampToValueAtTime(0.0001, now + 0.5);
        window.setTimeout(() => teardown(), 560);
      } else {
        teardown();
      }
      setEnabled(false);
      return;
    }

    const ok = await build();
    if (ok) setEnabled(true);
  }, [build, enabled, teardown]);

  useEffect(() => () => teardown(), [teardown]);

  return { enabled, blocked, toggle };
}
