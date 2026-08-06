/**
 * Adaptive render quality for StageScene / ritual UI.
 * Tuned for weak laptops and old phones without abandoning the brand look.
 */

export type QualityTier = "high" | "medium" | "low";

export type QualitySettings = {
  tier: QualityTier;
  /** Cap for renderer.setPixelRatio */
  dprCap: number;
  antialias: boolean;
  powerPreference: WebGLPowerPreference;
  /** Bake PMREM studio env — expensive; skip on low. */
  enableEnvMap: boolean;
  enableContactShadows: boolean;
  /** Drop rim2 + soften point lights. */
  simplifyLights: boolean;
  /** Disable clearcoat / lower env intensity on materials. */
  simplifyMaterials: boolean;
  particleCount: number;
  linkCount: number;
  beamParticles: number;
  /** Floating service orbs (intro nebula field). */
  orbCount: number;
  /** Network nodes including hub. */
  nodeCount: number;
  panelCount: number;
  accentCount: number;
  pillarRows: number;
  fiberTrails: number;
  tubeSegments: number;
  hubSphereSegs: [width: number, height: number];
  hubDotSegs: [width: number, height: number];
  shadowCircleSegs: number;
  beamRadialSegs: number;
  /** Skip N frames between renders (0 = every frame). */
  frameSkip: number;
  /** Soft FPS governor: raise skip when sustained below this. */
  fpsFloor: number;
};

const HIGH: QualitySettings = {
  tier: "high",
  dprCap: 1.5,
  antialias: true,
  powerPreference: "high-performance",
  enableEnvMap: true,
  enableContactShadows: true,
  simplifyLights: false,
  simplifyMaterials: false,
  particleCount: 120,
  linkCount: 28,
  beamParticles: 48,
  orbCount: 21,
  nodeCount: 18,
  panelCount: 7,
  accentCount: 11,
  pillarRows: 6,
  fiberTrails: 16,
  tubeSegments: 28,
  hubSphereSegs: [18, 14],
  hubDotSegs: [10, 8],
  shadowCircleSegs: 20,
  beamRadialSegs: 10,
  frameSkip: 0,
  fpsFloor: 28,
};

const MEDIUM: QualitySettings = {
  tier: "medium",
  dprCap: 1.25,
  antialias: true,
  powerPreference: "low-power",
  enableEnvMap: true,
  enableContactShadows: true,
  simplifyLights: true,
  simplifyMaterials: true,
  particleCount: 64,
  linkCount: 14,
  beamParticles: 24,
  orbCount: 12,
  nodeCount: 12,
  panelCount: 4,
  accentCount: 6,
  pillarRows: 4,
  fiberTrails: 8,
  tubeSegments: 16,
  hubSphereSegs: [12, 10],
  hubDotSegs: [8, 6],
  shadowCircleSegs: 12,
  beamRadialSegs: 8,
  frameSkip: 0,
  fpsFloor: 26,
};

const LOW: QualitySettings = {
  tier: "low",
  dprCap: 1.0,
  antialias: false,
  powerPreference: "low-power",
  enableEnvMap: false,
  enableContactShadows: false,
  simplifyLights: true,
  simplifyMaterials: true,
  particleCount: 32,
  linkCount: 8,
  beamParticles: 12,
  orbCount: 7,
  nodeCount: 8,
  panelCount: 3,
  accentCount: 4,
  pillarRows: 3,
  fiberTrails: 4,
  tubeSegments: 10,
  hubSphereSegs: [10, 8],
  hubDotSegs: [6, 5],
  shadowCircleSegs: 8,
  beamRadialSegs: 6,
  frameSkip: 1,
  fpsFloor: 22,
};

function readDeviceMemory(): number | undefined {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined;
}

function saveDataEnabled(): boolean {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  return Boolean(conn?.saveData);
}

function isCoarsePointer(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

function isNarrowViewport(): boolean {
  return window.innerWidth < 768;
}

/**
 * Probe WebGL once — major performance caveat → force low.
 * Returns null if context cannot be created at all.
 */
function probeWebGLCaveat(): "ok" | "caveat" | "fail" {
  try {
    const canvas = document.createElement("canvas");
    const attrs: WebGLContextAttributes = {
      failIfMajorPerformanceCaveat: true,
      powerPreference: "low-power",
    };
    const gl =
      canvas.getContext("webgl2", attrs) || canvas.getContext("webgl", attrs);
    if (gl) {
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
      return "ok";
    }
    // Retry without caveat — GPU works but is weak
    const weak =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
    if (weak) {
      const ext = weak.getExtension("WEBGL_lose_context");
      ext?.loseContext();
      return "caveat";
    }
    return "fail";
  } catch {
    return "fail";
  }
}

let cached: QualitySettings | null = null;

/** Resolve once per page load — stable across locale remounts. */
export function resolveQualitySettings(): QualitySettings {
  if (cached) return cached;

  const cores = navigator.hardwareConcurrency || 4;
  const mem = readDeviceMemory();
  const coarse = isCoarsePointer();
  const narrow = isNarrowViewport();
  const saveData = saveDataEnabled();
  const reduceMotion = (() => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  })();
  const dpr = window.devicePixelRatio || 1;
  const gl = probeWebGLCaveat();

  let tier: QualityTier = "high";

  if (gl === "fail" || gl === "caveat") {
    tier = "low";
  } else if (
    saveData ||
    reduceMotion ||
    cores <= 4 ||
    (typeof mem === "number" && mem <= 4) ||
    (coarse && narrow)
  ) {
    tier = "low";
  } else if (
    cores <= 6 ||
    (typeof mem === "number" && mem <= 6) ||
    coarse ||
    narrow ||
    dpr >= 2.5
  ) {
    tier = "medium";
  }

  // Mobile / high-DPR phones never get desktop DPR cap even on "high"
  const base = tier === "high" ? { ...HIGH } : tier === "medium" ? { ...MEDIUM } : { ...LOW };
  if (coarse || narrow) {
    base.dprCap = Math.min(base.dprCap, tier === "low" ? 1.0 : 1.25);
    if (tier === "high") {
      // Soften high on phones: fewer figures, low-power GPU preference
      base.powerPreference = "low-power";
      base.orbCount = Math.min(base.orbCount, 14);
      base.nodeCount = Math.min(base.nodeCount, 14);
      base.panelCount = Math.min(base.panelCount, 5);
      base.accentCount = Math.min(base.accentCount, 7);
      base.particleCount = Math.min(base.particleCount, 80);
      base.fiberTrails = Math.min(base.fiberTrails, 10);
      base.simplifyLights = true;
    }
  }

  cached = base;

  try {
    document.documentElement.dataset.quality = base.tier;
  } catch {
    /* ignore */
  }

  return base;
}

export function getCachedQualityTier(): QualityTier | null {
  return cached?.tier ?? null;
}
