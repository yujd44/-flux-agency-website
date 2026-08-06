/**
 * Adaptive render quality for StageScene / ritual UI.
 * Phones (incl. flagship Android) always get an aggressive mobile profile —
 * deviceMemory / core count must NOT promote them to desktop high.
 */

export type QualityTier = "high" | "medium" | "low";

export type QualitySettings = {
  tier: QualityTier;
  /** True for phones / touch-primary devices — drives CSS + stage morph shortcuts. */
  isMobile: boolean;
  /** Cap for renderer.setPixelRatio */
  dprCap: number;
  /** Extra canvas scale (<1 draws fewer pixels, CSS upscales). */
  renderScale: number;
  antialias: boolean;
  powerPreference: WebGLPowerPreference;
  /** Bake PMREM studio env — expensive; skip on low/mobile. */
  enableEnvMap: boolean;
  enableContactShadows: boolean;
  /** Drop rim2 + soften point lights. */
  simplifyLights: boolean;
  /** Disable clearcoat / lower env intensity on materials. */
  simplifyMaterials: boolean;
  /** O(n²) sphere collisions between wanderers. */
  enableCollisions: boolean;
  /** Pointer raycast hover + cursor. */
  enableHover: boolean;
  /** Realization pointer-scatter repulsion. */
  enableScatter: boolean;
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
  /** Hard cap — min ms between rendered frames (0 = uncapped). */
  minFrameMs: number;
  /** StageScene visual morph length multiplier. */
  morphDurationScale: number;
  /** RitualHome panel lock / CSS transition ms. */
  stageTransitionMs: number;
};

const HIGH: QualitySettings = {
  tier: "high",
  isMobile: false,
  dprCap: 1.5,
  renderScale: 1,
  antialias: true,
  powerPreference: "high-performance",
  enableEnvMap: true,
  enableContactShadows: true,
  simplifyLights: false,
  simplifyMaterials: false,
  enableCollisions: true,
  enableHover: true,
  enableScatter: true,
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
  minFrameMs: 0,
  morphDurationScale: 1,
  stageTransitionMs: 900,
};

const MEDIUM: QualitySettings = {
  tier: "medium",
  isMobile: false,
  dprCap: 1.25,
  renderScale: 1,
  antialias: true,
  powerPreference: "low-power",
  enableEnvMap: true,
  enableContactShadows: true,
  simplifyLights: true,
  simplifyMaterials: true,
  enableCollisions: true,
  enableHover: true,
  enableScatter: true,
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
  minFrameMs: 0,
  morphDurationScale: 0.85,
  stageTransitionMs: 700,
};

/** Aggressive phone profile — flagships included (S24 Ultra etc.). */
const MOBILE: QualitySettings = {
  tier: "low",
  isMobile: true,
  dprCap: 1.0,
  renderScale: 0.75,
  antialias: false,
  powerPreference: "low-power",
  enableEnvMap: false,
  enableContactShadows: false,
  simplifyLights: true,
  simplifyMaterials: true,
  enableCollisions: false,
  enableHover: false,
  enableScatter: false,
  particleCount: 18,
  linkCount: 4,
  beamParticles: 6,
  orbCount: 5,
  nodeCount: 6,
  panelCount: 2,
  accentCount: 3,
  pillarRows: 2,
  fiberTrails: 2,
  tubeSegments: 8,
  hubSphereSegs: [8, 6],
  hubDotSegs: [5, 4],
  shadowCircleSegs: 6,
  beamRadialSegs: 4,
  frameSkip: 1,
  fpsFloor: 24,
  minFrameMs: 33, // ~30fps hard cap
  morphDurationScale: 0.45,
  stageTransitionMs: 420,
};

const LOW: QualitySettings = {
  tier: "low",
  isMobile: false,
  dprCap: 1.0,
  renderScale: 0.85,
  antialias: false,
  powerPreference: "low-power",
  enableEnvMap: false,
  enableContactShadows: false,
  simplifyLights: true,
  simplifyMaterials: true,
  enableCollisions: false,
  enableHover: true,
  enableScatter: false,
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
  minFrameMs: 28,
  morphDurationScale: 0.65,
  stageTransitionMs: 550,
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

function mediaMatches(query: string): boolean {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/**
 * Phones / touch-primary devices — NOT "high RAM laptop with touchscreen".
 * S Pen devices often report pointer:fine; use any-pointer + touch + UA + width.
 */
export function detectMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  const android = /Android/i.test(ua);
  const ios = /iPhone|iPod|iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const mobileUa = /Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  const coarsePrimary = mediaMatches("(pointer: coarse)");
  const anyCoarse = mediaMatches("(any-pointer: coarse)");
  const noHover = mediaMatches("(hover: none)");
  const touchPoints = navigator.maxTouchPoints || 0;
  const narrow = window.innerWidth <= 900;

  // Explicit phone / Android phone UA → always mobile
  if (android && (mobileUa || narrow || touchPoints > 0)) return true;
  if (ios) return true;

  // Touch-primary / coarse interaction in a phone-sized viewport
  if ((coarsePrimary || (anyCoarse && noHover) || touchPoints > 1) && narrow) {
    return true;
  }

  // Coarse primary anywhere (phone in landscape, small tablet)
  if (coarsePrimary && touchPoints > 0 && window.innerWidth <= 1024) {
    return true;
  }

  return false;
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
  const saveData = saveDataEnabled();
  const reduceMotion = mediaMatches("(prefers-reduced-motion: reduce)");
  const mobile = detectMobileDevice();
  const gl = probeWebGLCaveat();

  let settings: QualitySettings;

  // Critical: phones never climb to high/medium via RAM/cores (S24 Ultra = 8GB+).
  if (mobile) {
    settings = { ...MOBILE };
    if (gl === "fail") {
      // Still assign low mobile; StageScene will no-op if renderer throws.
      settings = { ...MOBILE, particleCount: 0, orbCount: 3, nodeCount: 4, panelCount: 1 };
    }
  } else if (gl === "fail" || gl === "caveat" || saveData || reduceMotion) {
    settings = { ...LOW };
  } else if (cores <= 4 || (typeof mem === "number" && mem <= 4)) {
    settings = { ...LOW };
  } else if (cores <= 6 || (typeof mem === "number" && mem <= 6)) {
    settings = { ...MEDIUM };
  } else {
    settings = { ...HIGH };
  }

  cached = settings;

  try {
    const root = document.documentElement;
    root.dataset.quality = settings.tier;
    if (settings.isMobile) root.dataset.mobile = "1";
    else delete root.dataset.mobile;
  } catch {
    /* ignore */
  }

  return settings;
}

export function getCachedQualityTier(): QualityTier | null {
  return cached?.tier ?? null;
}

export function getCachedQualitySettings(): QualitySettings | null {
  return cached;
}
