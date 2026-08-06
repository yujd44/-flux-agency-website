"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { StageId } from "./StageRail";
import {
  ServiceFigurePool,
  type FigureStyle,
  type ServiceFigureKind,
} from "./serviceFigures";
import { resolveQualitySettings } from "./qualityTier";

type Props = {
  stage: StageId;
};

const CYAN = new THREE.Color("#4df3ff");
const PURPLE = new THREE.Color("#8a5cf6");
const GREEN = new THREE.Color("#3dff9a");
const NAVY = new THREE.Color("#0a0b1e");
const METAL = new THREE.Color("#c8d4f0");
const GLASS_TINT = new THREE.Color("#1a2240");

type StageVisual = {
  nebulaOpacity: number;
  nebulaSpread: number;
  networkOpacity: number;
  networkScale: number;
  networkSide: number;
  panelsOpacity: number;
  panelsSpread: number;
  hubGlow: number;
  particleLink: number;
  tintMix: number; // 0 cyan → 1 purple
  corridor: number; // Future pillar hall
  wireArch: number; // Realization wireframe cube
};

const VISUALS: Record<StageId, StageVisual> = {
  intro: {
    nebulaOpacity: 1,
    nebulaSpread: 1.05,
    networkOpacity: 0.08,
    networkScale: 0.55,
    networkSide: 0.15,
    panelsOpacity: 0.22,
    panelsSpread: 0.7,
    hubGlow: 0.25,
    particleLink: 0.35,
    tintMix: 0.35,
    corridor: 0,
    wireArch: 0,
  },
  method: {
    nebulaOpacity: 0.72,
    nebulaSpread: 1.15,
    networkOpacity: 1,
    networkScale: 1,
    networkSide: 1,
    panelsOpacity: 0.85,
    panelsSpread: 1,
    hubGlow: 0.85,
    particleLink: 0.75,
    tintMix: 0.55,
    corridor: 0,
    wireArch: 0,
  },
  realization: {
    nebulaOpacity: 0.92,
    nebulaSpread: 1.4,
    networkOpacity: 0.1,
    networkScale: 0.55,
    networkSide: 0.15,
    panelsOpacity: 0.22,
    panelsSpread: 1.05,
    hubGlow: 0.35,
    particleLink: 0.55,
    tintMix: 0.42,
    corridor: 0,
    wireArch: 1,
  },
  future: {
    nebulaOpacity: 0.28,
    nebulaSpread: 0.95,
    networkOpacity: 0.04,
    networkScale: 0.45,
    networkSide: 0,
    panelsOpacity: 0.06,
    panelsSpread: 1,
    hubGlow: 0.2,
    particleLink: 0.08,
    tintMix: 0.5,
    corridor: 1,
    wireArch: 0,
  },
};

function makeGlowTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(0.7, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Lightweight studio env for MeshPhysical reflections — one-time bake. */
function makeStudioEnv(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x05060e);
  envScene.add(new THREE.HemisphereLight(0xe8f0ff, 0x120818, 0.65));

  const disposables: { geo: THREE.BufferGeometry; mat: THREE.Material }[] = [];
  const addSoftbox = (
    w: number,
    h: number,
    color: number,
    intensity: number,
    x: number,
    y: number,
    z: number,
  ) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
    disposables.push({ geo, mat });
  };

  addSoftbox(5.5, 2.4, 0xc8e8ff, 3.2, 4.8, 3.2, 3.4);
  addSoftbox(3.2, 3.8, 0xb090ff, 2.2, -4.2, 1.6, 2.8);
  addSoftbox(4.0, 4.0, 0x60ffe0, 1.8, 1.2, 0.4, -4.6);
  addSoftbox(4.5, 4.5, 0xf0f4ff, 1.0, 0.2, 5.5, 0.6);
  addSoftbox(2.2, 2.2, 0xffffff, 2.4, -1.5, 4.0, 3.5);
  envScene.add(new THREE.AmbientLight(0x8890b0, 0.28));

  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  for (const d of disposables) {
    d.geo.dispose();
    d.mat.dispose();
  }
  pmrem.dispose();
  return envMap;
}

function lerpVisual(a: StageVisual, b: StageVisual, t: number): StageVisual {
  const k = (key: keyof StageVisual) => a[key] + (b[key] - a[key]) * t;
  return {
    nebulaOpacity: k("nebulaOpacity"),
    nebulaSpread: k("nebulaSpread"),
    networkOpacity: k("networkOpacity"),
    networkScale: k("networkScale"),
    networkSide: k("networkSide"),
    panelsOpacity: k("panelsOpacity"),
    panelsSpread: k("panelsSpread"),
    hubGlow: k("hubGlow"),
    particleLink: k("particleLink"),
    tintMix: k("tintMix"),
    corridor: k("corridor"),
    wireArch: k("wireArch"),
  };
}

/** Hollow rectangular monolith — extruded frame, Y-up, base at y=0. */
function makeHollowPillarGeometry(w: number, d: number, h: number, wall: number) {
  const hw = w * 0.5;
  const hd = d * 0.5;
  const iw = Math.max(0.02, hw - wall);
  const id = Math.max(0.02, hd - wall);
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hd);
  shape.lineTo(hw, -hd);
  shape.lineTo(hw, hd);
  shape.lineTo(-hw, hd);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-iw, -id);
  hole.lineTo(-iw, id);
  hole.lineTo(iw, id);
  hole.lineTo(iw, -id);
  hole.closePath();
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, h * 0.5, 0);
  return geo;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function easeOutBack(t: number) {
  const c = 1.70158;
  const u = t - 1;
  return 1 + c * u * u * u + u * u;
}

const _fiberDir = new THREE.Vector3();
const _fiberMid = new THREE.Vector3();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();

/** Place a unit Y-cylinder between two points (transform only — no geo rebuild). */
function placeFiber(
  mesh: THREE.Mesh,
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
) {
  _fiberDir.subVectors(b, a);
  const len = _fiberDir.length();
  if (len < 1e-4) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  _fiberMid.copy(a).add(b).multiplyScalar(0.5);
  mesh.position.copy(_fiberMid);
  _fiberDir.normalize();
  _quat.setFromUnitVectors(_yAxis, _fiberDir);
  mesh.quaternion.copy(_quat);
  mesh.scale.set(radius, len, radius);
}

function hexShape(rx: number, ry: number) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

type HoverTarget = {
  id: string;
  root: THREE.Object3D;
  pick: THREE.Object3D[];
  mats: THREE.MeshPhysicalMaterial[];
  hover: number;
  bounce: number;
};

type StageBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

type WanderBody = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  speed: number;
  /** Per-body steering amplitude — keeps paths from looking identical. */
  turn: number;
  /** Soft curl / bank on the velocity (unique per figure). */
  swirl: number;
  phase: number;
};

type Collider = {
  wander: WanderBody;
  radius: number;
  mass: number;
};

/** Visible stage frustum soft box — figures bounce / spring off these edges. */
const ROOT_BOUNDS: StageBounds = {
  minX: -3.35,
  maxX: 3.35,
  minY: -2.05,
  maxY: 2.05,
  minZ: -2.35,
  maxZ: 1.45,
};
const NETWORK_BOUNDS: StageBounds = {
  minX: -1.55,
  maxX: 1.55,
  minY: -1.15,
  maxY: 1.15,
  minZ: -0.85,
  maxZ: 0.85,
};
const ACCENT_BOUNDS: StageBounds = {
  minX: -2.55,
  maxX: 2.55,
  minY: -1.75,
  maxY: 1.75,
  minZ: -0.85,
  maxZ: 1.05,
};
const ARCH_BOUNDS: StageBounds = {
  minX: -1.35,
  maxX: 1.35,
  minY: -0.95,
  maxY: 0.95,
  minZ: -1.45,
  maxZ: 0.55,
};

const _colN = new THREE.Vector3();
const _colRel = new THREE.Vector3();
const _steer = new THREE.Vector3();

function seedWander(base: THREE.Vector3, speed: number): WanderBody {
  // Independent axis mix so each figure starts on a distinct heading
  const vel = new THREE.Vector3(
    (Math.random() - 0.5) * 2.2,
    (Math.random() - 0.5) * 1.8,
    (Math.random() - 0.5) * 1.4,
  );
  if (vel.lengthSq() < 1e-4) {
    const a = Math.random() * Math.PI * 2;
    vel.set(Math.cos(a), Math.sin(a) * 0.7, (Math.random() - 0.5) * 0.6);
  }
  vel.normalize().multiplyScalar(speed);
  return {
    pos: base.clone(),
    vel,
    speed,
    turn: 0.28 + Math.random() * 0.95,
    swirl: (Math.random() - 0.5) * 1.6,
    phase: Math.random() * Math.PI * 2,
  };
}

function leashBounds(base: THREE.Vector3, amp: number): StageBounds {
  return {
    minX: base.x - amp,
    maxX: base.x + amp,
    minY: base.y - amp * 0.75,
    maxY: base.y + amp * 0.75,
    minZ: base.z - amp * 0.55,
    maxZ: base.z + amp * 0.55,
  };
}

function integrateWander(
  body: WanderBody,
  dt: number,
  bounds: StageBounds,
  opts?: { wallPad?: number; spring?: number; jitter?: number },
) {
  const pad = opts?.wallPad ?? 0.42;
  const spring = opts?.spring ?? 1.8;
  const jitter = opts?.jitter ?? 0.08;

  if (body.pos.x < bounds.minX + pad) {
    body.vel.x += (bounds.minX + pad - body.pos.x) * spring * dt;
  } else if (body.pos.x > bounds.maxX - pad) {
    body.vel.x += (bounds.maxX - pad - body.pos.x) * spring * dt;
  }
  if (body.pos.y < bounds.minY + pad) {
    body.vel.y += (bounds.minY + pad - body.pos.y) * spring * dt;
  } else if (body.pos.y > bounds.maxY - pad) {
    body.vel.y += (bounds.maxY - pad - body.pos.y) * spring * dt;
  }
  if (body.pos.z < bounds.minZ + pad * 0.7) {
    body.vel.z += (bounds.minZ + pad * 0.7 - body.pos.z) * spring * dt;
  } else if (body.pos.z > bounds.maxZ - pad * 0.7) {
    body.vel.z += (bounds.maxZ - pad * 0.7 - body.pos.z) * spring * dt;
  }

  // Smooth unique path: slow phase steer + gentle curl (not shared orbits)
  body.phase += dt * (0.18 + body.turn * 0.32);
  const steer = body.turn * 0.09;
  body.vel.x += Math.sin(body.phase * 1.27) * steer * dt;
  body.vel.y += Math.cos(body.phase * 0.91 + 0.4) * steer * 0.8 * dt;
  body.vel.z += Math.sin(body.phase * 0.63 + 1.7) * steer * 0.5 * dt;

  const swirl = body.swirl * dt * 0.42;
  const vx = body.vel.x;
  const vy = body.vel.y;
  body.vel.x += -vy * swirl * 0.55 - body.vel.z * swirl * 0.35;
  body.vel.y += vx * swirl * 0.45;
  body.vel.z += vx * swirl * 0.28;

  body.vel.x += (Math.random() - 0.5) * jitter * dt;
  body.vel.y += (Math.random() - 0.5) * jitter * 0.8 * dt;
  body.vel.z += (Math.random() - 0.5) * jitter * 0.5 * dt;

  let sp = body.vel.length();
  if (sp < 0.012) {
    _steer.set(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 1.6,
      (Math.random() - 0.5) * 1.1,
    );
    if (_steer.lengthSq() < 1e-4) _steer.set(1, 0.3, -0.2);
    _steer.normalize().multiplyScalar(body.speed);
    body.vel.copy(_steer);
    sp = body.speed;
  } else {
    const blend = 1 - Math.exp(-dt * 0.95);
    const next = sp + (body.speed - sp) * blend;
    body.vel.multiplyScalar(next / sp);
  }

  body.pos.addScaledVector(body.vel, dt);

  if (body.pos.x < bounds.minX) {
    body.pos.x = bounds.minX;
    body.vel.x = Math.abs(body.vel.x) * 0.72;
  } else if (body.pos.x > bounds.maxX) {
    body.pos.x = bounds.maxX;
    body.vel.x = -Math.abs(body.vel.x) * 0.72;
  }
  if (body.pos.y < bounds.minY) {
    body.pos.y = bounds.minY;
    body.vel.y = Math.abs(body.vel.y) * 0.72;
  } else if (body.pos.y > bounds.maxY) {
    body.pos.y = bounds.maxY;
    body.vel.y = -Math.abs(body.vel.y) * 0.72;
  }
  if (body.pos.z < bounds.minZ) {
    body.pos.z = bounds.minZ;
    body.vel.z = Math.abs(body.vel.z) * 0.7;
  } else if (body.pos.z > bounds.maxZ) {
    body.pos.z = bounds.maxZ;
    body.vel.z = -Math.abs(body.vel.z) * 0.7;
  }
}

/** Elastic-ish sphere collision on wander velocities (AABB-friendly radii). */
function resolvePairCollision(a: Collider, b: Collider, restitution = 0.88) {
  if (a.radius <= 0 || b.radius <= 0) return;
  _colN.subVectors(b.wander.pos, a.wander.pos);
  const dist = _colN.length();
  const minDist = a.radius + b.radius;
  if (dist >= minDist || dist < 1e-6) return;

  _colN.multiplyScalar(1 / dist);
  const overlap = minDist - dist;
  const invMass = 1 / (a.mass + b.mass);
  a.wander.pos.addScaledVector(_colN, -overlap * b.mass * invMass);
  b.wander.pos.addScaledVector(_colN, overlap * a.mass * invMass);

  _colRel.subVectors(a.wander.vel, b.wander.vel);
  const vn = _colRel.dot(_colN);
  if (vn >= 0) return; // already separating

  const j = (-(1 + restitution) * vn) / (1 / a.mass + 1 / b.mass);
  a.wander.vel.addScaledVector(_colN, -j / a.mass);
  b.wander.vel.addScaledVector(_colN, j / b.mass);
}

function resolveGroupCollisions(items: Collider[]) {
  const n = items.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      resolvePairCollision(items[i], items[j]);
    }
  }
}

/**
 * Keep WebGL alive across brief remounts (locale switches tear down [locale] layout).
 * Hard-dispose only after a short idle so /ru ↔ /he does not rebuild Three.js.
 */
const STAGE_KEEPALIVE_MS = 900;
const liveStageRef: { current: StageId } = { current: "intro" };

type StageSceneHandle = {
  attach: (mount: HTMLElement) => void;
  detach: () => void;
  dispose: () => void;
};

let sharedHandle: StageSceneHandle | null = null;
let keepAliveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Single shared WebGL layer for ritual stages.
 * Physical materials, autonomous idle motion, per-mesh hover/scatter — no group parallax.
 */
export default function StageScene({ stage }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  liveStageRef.current = stage;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    if (keepAliveTimer) {
      clearTimeout(keepAliveTimer);
      keepAliveTimer = null;
    }

    if (sharedHandle) {
      sharedHandle.attach(mount);
      return () => {
        sharedHandle?.detach();
        keepAliveTimer = setTimeout(() => {
          sharedHandle?.dispose();
          sharedHandle = null;
          keepAliveTimer = null;
        }, STAGE_KEEPALIVE_MS);
      };
    }

    const mountHolder: { current: HTMLElement | null } = { current: mount };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const quality = resolveQualitySettings();
    const PARTICLE_COUNT = quality.particleCount;
    const LINK_COUNT = quality.linkCount;
    const BEAM_PARTICLES = quality.beamParticles;
    const PILLAR_ROWS = quality.pillarRows;
    const FIBER_TRAILS = quality.fiberTrails;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: quality.antialias,
        alpha: true,
        powerPreference: quality.powerPreference,
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(0, 0.15, 6.2);
    camera.lookAt(0, 0, 0);

    // Mobile: DPR 1 + optional renderScale (<1) → fewer pixels, CSS upscales the canvas.
    const dpr = Math.min(window.devicePixelRatio || 1, quality.dprCap) * quality.renderScale;
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = quality.tier === "low" ? 1.08 : 1.18;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
    });

    const envMap = quality.enableEnvMap ? makeStudioEnv(renderer) : null;
    if (envMap) scene.environment = envMap;

    const glowTex = makeGlowTexture();
    const root = new THREE.Group();
    scene.add(root);

    // —— Cinematic lights (world-fixed; no mouse-driven group drift) ——
    const hemi = new THREE.HemisphereLight(0xdce8ff, 0x100818, quality.simplifyLights ? 0.62 : 0.5);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0x6a78a8, quality.simplifyLights ? 0.32 : 0.22);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xe8f4ff, 1.35);
    key.position.set(4.2, 3.8, 5.0);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xa090ff, quality.simplifyLights ? 0.4 : 0.55);
    fill.position.set(-3.6, 1.4, 2.8);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x50ffe0, quality.simplifyLights ? 0.45 : 0.75);
    rim.position.set(0.6, 1.2, -4.2);
    scene.add(rim);

    let rim2: THREE.DirectionalLight | null = null;
    if (!quality.simplifyLights) {
      rim2 = new THREE.DirectionalLight(0xff80e0, 0.28);
      rim2.position.set(-2.4, -0.8, -3.2);
      scene.add(rim2);
    }

    const hubLight = new THREE.PointLight(
      0x60ffc0,
      quality.simplifyLights ? 0.9 : 1.4,
      quality.simplifyLights ? 5 : 6,
      2,
    );
    hubLight.position.set(1.5, 0.2, 0.4);
    scene.add(hubLight);

    const accentLight = new THREE.PointLight(
      0x9060ff,
      quality.simplifyLights ? 0.5 : 0.85,
      quality.simplifyLights ? 5.5 : 7,
      2,
    );
    accentLight.position.set(-1.2, 0.6, 1.2);
    scene.add(accentLight);

    // Shared geometries — segments scale with quality tier
    const figurePool = new ServiceFigurePool(quality.tier);
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const fiberGeo = new THREE.CylinderGeometry(1, 1, 1, quality.tier === "low" ? 5 : 6, 1);
    const hubCoreGeo = new THREE.SphereGeometry(
      0.12,
      quality.hubSphereSegs[0],
      quality.hubSphereSegs[1],
    );
    const hubShellGeo = new THREE.IcosahedronGeometry(0.2, quality.tier === "low" ? 0 : 1);
    const hubDotGeo = new THREE.SphereGeometry(
      0.032,
      quality.hubDotSegs[0],
      quality.hubDotSegs[1],
    );
    const shadowGeo = new THREE.CircleGeometry(1, quality.shadowCircleSegs);
    const disposables: THREE.BufferGeometry[] = [
      boxGeo,
      edgesGeo,
      fiberGeo,
      hubCoreGeo,
      hubShellGeo,
      hubDotGeo,
      shadowGeo,
    ];
    const materials: THREE.Material[] = [];

    const hoverTargets: HoverTarget[] = [];
    const pickMeshes: THREE.Object3D[] = [];
    const rootColliders: Collider[] = [];
    const networkColliders: Collider[] = [];
    const accentColliders: Collider[] = [];

    function makeContactShadow(parent: THREE.Object3D, radius: number, yOffset: number) {
      if (!quality.enableContactShadows) {
        const stub = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          visible: false,
        });
        materials.push(stub);
        return stub;
      }
      const mat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      materials.push(mat);
      const mesh = new THREE.Mesh(shadowGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = yOffset;
      mesh.scale.setScalar(radius);
      mesh.renderOrder = -2;
      parent.add(mesh);
      return mat;
    }

    const figureMatOpts = {
      envMap,
      navy: NAVY,
      metal: METAL,
      simplifyMaterials: quality.simplifyMaterials,
    };

    function registerHover(
      id: string,
      hoverRoot: THREE.Object3D,
      pick: THREE.Object3D[],
      mats: THREE.MeshPhysicalMaterial[],
    ) {
      for (const p of pick) {
        p.userData.hoverId = id;
        pickMeshes.push(p);
      }
      hoverTargets.push({ id, root: hoverRoot, pick, mats, hover: 0, bounce: 0 });
    }

    // --- 1) Nebula / particle field ---
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const basePos = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.65) * 3.5;
      const x = Math.cos(a) * r * 1.15 - 0.8;
      const y = Math.sin(a) * r * 0.72 + (Math.random() - 0.5) * 0.6;
      const z = (Math.random() - 0.5) * 2.6;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      basePos[i * 3] = x;
      basePos[i * 3 + 1] = y;
      basePos[i * 3 + 2] = z;
      const c = Math.random() > 0.45 ? CYAN : PURPLE;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = 0.04 + Math.random() * 0.1;
    }

    const nebulaGeo = new THREE.BufferGeometry();
    nebulaGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nebulaGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    nebulaGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    disposables.push(nebulaGeo);

    const nebulaMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: glowTex ?? undefined,
    });
    materials.push(nebulaMat);
    const nebula = new THREE.Points(nebulaGeo, nebulaMat);
    root.add(nebula);

    // Physical service figures — wifi / laptop / router / globe / etc. at mixed scales
    const orbGroup = new THREE.Group();
    root.add(orbGroup);
    type OrbItem = {
      pivot: THREE.Group;
      content: THREE.Group;
      mats: THREE.MeshPhysicalMaterial[];
      shadowMat: THREE.MeshBasicMaterial;
      base: THREE.Vector3;
      phase: number;
      pulse: number;
      spin: number;
      size: number;
      kind: ServiceFigureKind;
      wander: WanderBody;
      collider: Collider;
    };
    const orbs: OrbItem[] = [];
    // Explicit roster: IT icons + clear XS→XL size ladder (≈6× span).
    const orbDefs: { kind: ServiceFigureKind; s: number; style: FigureStyle }[] = [
      { kind: "laptop", s: 0.52, style: "glass" },
      { kind: "wifi", s: 0.46, style: "accent" },
      { kind: "globe", s: 0.42, style: "glass" },
      { kind: "server", s: 0.38, style: "metal" },
      { kind: "desktop", s: 0.34, style: "metal" },
      { kind: "router", s: 0.3, style: "metal" },
      { kind: "database", s: 0.28, style: "glass" },
      { kind: "antenna", s: 0.26, style: "accent" },
      { kind: "keyboard", s: 0.24, style: "metal" },
      { kind: "tablet", s: 0.22, style: "glass" },
      { kind: "headphones", s: 0.2, style: "accent" },
      { kind: "browser", s: 0.18, style: "glass" },
      { kind: "cloud", s: 0.16, style: "glass" },
      { kind: "chip", s: 0.14, style: "metal" },
      { kind: "code", s: 0.12, style: "accent" },
      { kind: "phone", s: 0.1, style: "glass" },
      { kind: "usb", s: 0.09, style: "metal" },
      { kind: "mouse", s: 0.08, style: "accent" },
      { kind: "gear", s: 0.07, style: "glass" },
      { kind: "wifi", s: 0.11, style: "glass" },
      { kind: "laptop", s: 0.06, style: "metal" },
    ];
    const activeOrbDefs = orbDefs.slice(0, quality.orbCount);
    activeOrbDefs.forEach((def, i) => {
      const kind = def.kind;
      const tint = i % 3 === 0 ? GREEN : i % 2 === 0 ? CYAN : PURPLE;
      const style = def.style;
      const s = def.s;
      const built = figurePool.build(kind, s, {
        tint,
        style,
        ...figureMatOpts,
      });
      for (const m of built.mats) materials.push(m);

      const pivot = built.root;
      const a = (i / activeOrbDefs.length) * Math.PI * 2 + Math.random() * 0.35;
      const r = 1.05 + (i % 5) * 0.35 + Math.random() * 0.55;
      const base = new THREE.Vector3(
        Math.cos(a) * r - 0.35,
        Math.sin(a * 1.3) * (0.55 + (i % 3) * 0.22),
        -0.45 - (i % 4) * 0.35 - Math.random() * 0.5,
      );
      pivot.position.copy(base);
      const shadowMat = makeContactShadow(pivot, s * 1.35, -s * 1.05);
      orbGroup.add(pivot);

      const id = `orb-${i}`;
      registerHover(id, pivot, built.pick, built.mats);

      const wander = seedWander(base, 0.055 + Math.random() * 0.05);
      const collider: Collider = {
        wander,
        radius: built.radius,
        mass: 0.55 + s * 1.8,
      };
      rootColliders.push(collider);

      orbs.push({
        pivot,
        content: built.content,
        mats: built.mats,
        shadowMat,
        base: base.clone(),
        phase: Math.random() * Math.PI * 2,
        pulse: 0.35 + Math.random() * 0.45,
        spin: 0.08 + Math.random() * 0.18,
        size: s,
        kind,
        wander,
        collider,
      });
    });

    // Connected particle web
    const linkPositions = new Float32Array(LINK_COUNT * 2 * 3);
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
    disposables.push(linkGeo);
    const linkMat = new THREE.LineBasicMaterial({
      color: 0xc8dcff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    materials.push(linkMat);
    const links = new THREE.LineSegments(linkGeo, linkMat);
    root.add(links);

    // --- 2) Network architecture ---
    const network = new THREE.Group();
    root.add(network);

    type NodeItem = {
      group: THREE.Group;
      content: THREE.Group;
      mats: THREE.MeshPhysicalMaterial[];
      edgeMat: THREE.LineBasicMaterial | null;
      shadowMat: THREE.MeshBasicMaterial;
      base: THREE.Vector3;
      size: number;
      phase: number;
      spin: number;
      assembleDelay: number;
      isHub: boolean;
      accent: THREE.Color;
      wander: WanderBody;
      collider: Collider;
      figure: ServiceFigureKind | "hub";
      hitRadius: number;
    };
    const nodes: NodeItem[] = [];
    const nodeDefs: {
      p: THREE.Vector3;
      s: number;
      style: "hub" | FigureStyle;
      figure: ServiceFigureKind | "hub";
    }[] = [
      { p: new THREE.Vector3(0, 0, 0), s: 0.42, style: "hub", figure: "hub" },
      { p: new THREE.Vector3(0.85, 0.55, 0.2), s: 0.3, style: "glass", figure: "globe" },
      { p: new THREE.Vector3(1.1, -0.35, -0.15), s: 0.2, style: "metal", figure: "server" },
      { p: new THREE.Vector3(0.35, -0.75, 0.35), s: 0.34, style: "accent", figure: "wifi" },
      { p: new THREE.Vector3(-0.55, 0.65, -0.25), s: 0.28, style: "glass", figure: "browser" },
      { p: new THREE.Vector3(-0.9, -0.2, 0.3), s: 0.24, style: "metal", figure: "laptop" },
      { p: new THREE.Vector3(0.15, 0.95, -0.4), s: 0.07, style: "glass", figure: "gear" },
      { p: new THREE.Vector3(1.45, 0.15, 0.45), s: 0.22, style: "metal", figure: "router" },
      { p: new THREE.Vector3(-0.25, -0.55, -0.5), s: 0.26, style: "glass", figure: "desktop" },
      { p: new THREE.Vector3(0.65, 0.15, -0.65), s: 0.1, style: "accent", figure: "chip" },
      { p: new THREE.Vector3(-1.15, 0.35, 0.1), s: 0.32, style: "metal", figure: "database" },
      { p: new THREE.Vector3(0.4, -0.15, 0.7), s: 0.06, style: "glass", figure: "phone" },
      { p: new THREE.Vector3(0.95, 0.85, -0.3), s: 0.16, style: "accent", figure: "headphones" },
      { p: new THREE.Vector3(-0.7, -0.7, 0.15), s: 0.38, style: "glass", figure: "cloud" },
      { p: new THREE.Vector3(1.25, 0.55, -0.5), s: 0.14, style: "metal", figure: "antenna" },
      { p: new THREE.Vector3(-1.35, -0.45, -0.2), s: 0.12, style: "accent", figure: "code" },
      { p: new THREE.Vector3(0.05, 0.45, 0.75), s: 0.08, style: "metal", figure: "usb" },
      { p: new THREE.Vector3(-0.45, 0.15, -0.75), s: 0.18, style: "glass", figure: "tablet" },
    ];

    const activeNodeDefs = nodeDefs.slice(0, quality.nodeCount);
    activeNodeDefs.forEach((def, i) => {
      const accent =
        def.style === "accent" || def.style === "hub"
          ? GREEN.clone()
          : def.style === "glass"
            ? PURPLE.clone()
            : METAL.clone();

      let group: THREE.Group;
      let content: THREE.Group;
      let pickables: THREE.Object3D[];
      let hoverMats: THREE.MeshPhysicalMaterial[];
      let edgeMat: THREE.LineBasicMaterial | null = null;
      let hitRadius: number;

      const clearcoat = quality.simplifyMaterials ? 0 : 1;
      const envIntensity = envMap ? (quality.simplifyMaterials ? 0.7 : 1) : 0;

      if (def.style === "hub") {
        group = new THREE.Group();
        content = group;
        pickables = [];
        hoverMats = [];

        const coreMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color("#e8fff4"),
          emissive: GREEN,
          emissiveIntensity: 1.35,
          roughness: 0.18,
          metalness: 0.35,
          clearcoat: clearcoat * 0.9,
          clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.12,
          envMap: envMap ?? undefined,
          envMapIntensity: 1.1 * envIntensity,
        });
        materials.push(coreMat);
        coreMat.userData.baseOpacity = 1;
        coreMat.userData.baseEmissive = coreMat.emissiveIntensity;
        const core = new THREE.Mesh(hubCoreGeo, coreMat);
        group.add(core);
        pickables.push(core);
        hoverMats.push(coreMat);

        const shellMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color("#b8ffe8"),
          emissive: GREEN,
          emissiveIntensity: 0.28,
          roughness: quality.simplifyMaterials ? 0.22 : 0.08,
          metalness: 0.4,
          clearcoat,
          clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.06,
          ior: 1.5,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          envMap: envMap ?? undefined,
          envMapIntensity: 1.85 * envIntensity,
          side: THREE.DoubleSide,
        });
        materials.push(shellMat);
        shellMat.userData.baseOpacity = shellMat.opacity;
        shellMat.userData.baseEmissive = shellMat.emissiveIntensity;
        const shell = new THREE.Mesh(hubShellGeo, shellMat);
        group.add(shell);
        pickables.push(shell);
        hoverMats.push(shellMat);

        const cageMat = new THREE.MeshPhysicalMaterial({
          color: METAL,
          emissive: GREEN,
          emissiveIntensity: 0.1,
          roughness: 0.18,
          metalness: 0.9,
          clearcoat: clearcoat * 0.75,
          clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.15,
          transparent: true,
          opacity: 0.32,
          envMap: envMap ?? undefined,
          envMapIntensity: 1.45 * envIntensity,
        });
        materials.push(cageMat);
        cageMat.userData.baseOpacity = cageMat.opacity;
        cageMat.userData.baseEmissive = cageMat.emissiveIntensity;
        const cage = new THREE.Mesh(boxGeo, cageMat);
        cage.scale.setScalar(def.s * 1.15);
        group.add(cage);
        pickables.push(cage);
        hoverMats.push(cageMat);

        edgeMat = new THREE.LineBasicMaterial({
          color: accent.clone().lerp(new THREE.Color("#ffffff"), 0.45),
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        });
        materials.push(edgeMat);
        edgeMat.userData.baseOpacity = edgeMat.opacity;
        const edges = new THREE.LineSegments(edgesGeo, edgeMat);
        edges.scale.setScalar(def.s * 1.18);
        group.add(edges);
        hitRadius = def.s * 0.95;
      } else {
        const tint =
          def.style === "accent" ? GREEN : def.style === "glass" ? PURPLE : CYAN;
        const built = figurePool.build(def.figure as ServiceFigureKind, def.s, {
          tint,
          style: def.style,
          ...figureMatOpts,
        });
        for (const m of built.mats) materials.push(m);
        group = built.root;
        content = built.content;
        pickables = built.pick;
        hoverMats = built.mats;
        hitRadius = built.radius;
      }

      group.position.copy(def.p);
      network.add(group);

      const shadowMat = makeContactShadow(group, def.s * 1.4, -def.s * 0.85);

      const id = `node-${i}`;
      registerHover(id, group, pickables, hoverMats);

      const wander = seedWander(
        def.p,
        def.style === "hub" ? 0.038 + Math.random() * 0.022 : 0.05 + Math.random() * 0.04,
      );
      const collider: Collider = {
        wander,
        radius: hitRadius * (def.style === "hub" ? 1.15 : 1),
        mass: def.style === "hub" ? 2.2 : 0.5 + def.s * 2.4,
      };
      networkColliders.push(collider);

      nodes.push({
        group,
        content,
        mats: hoverMats,
        edgeMat,
        shadowMat,
        base: def.p.clone(),
        size: def.s,
        phase: Math.random() * Math.PI * 2,
        spin: 0.1 + Math.random() * 0.28,
        assembleDelay: i * 0.04,
        isHub: def.style === "hub",
        accent,
        wander,
        collider,
        figure: def.figure,
        hitRadius,
      });
    });

    const nodeLimit = activeNodeDefs.length;
    const fiberPairs: [number, number][] = (
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5],
        [0, 9],
        [0, 11],
        [0, 12],
        [0, 14],
        [0, 16],
        [1, 7],
        [1, 6],
        [1, 12],
        [2, 7],
        [2, 3],
        [3, 8],
        [3, 13],
        [4, 10],
        [4, 6],
        [5, 10],
        [5, 8],
        [5, 13],
        [9, 2],
        [11, 2],
        [12, 6],
        [14, 1],
        [15, 10],
        [16, 5],
        [17, 4],
      ] as [number, number][]
    ).filter(([a, b]) => a < nodeLimit && b < nodeLimit);

    type FiberItem = {
      mesh: THREE.Mesh;
      mat: THREE.MeshPhysicalMaterial;
      glow: THREE.Mesh;
      glowMat: THREE.MeshBasicMaterial;
    };
    const fiberItems: FiberItem[] = [];

    fiberPairs.forEach((_, i) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#e8f4ff"),
        emissive: i % 3 === 0 ? GREEN : CYAN,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.85,
        clearcoat: quality.simplifyMaterials ? 0 : 0.65,
        clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.2,
        transparent: true,
        opacity: 0.8,
        envMap: envMap ?? undefined,
        envMapIntensity: envMap ? (quality.simplifyMaterials ? 0.55 : 1.05) : 0,
      });
      materials.push(mat);
      const mesh = new THREE.Mesh(fiberGeo, mat);
      network.add(mesh);

      const glowMat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? GREEN : CYAN,
        transparent: true,
        opacity: quality.tier === "low" ? 0.06 : 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      materials.push(glowMat);
      const glow = new THREE.Mesh(fiberGeo, glowMat);
      network.add(glow);

      mat.userData.baseOpacity = mat.opacity;
      mat.userData.baseEmissive = mat.emissiveIntensity;
      glowMat.userData.baseOpacity = glowMat.opacity;
      fiberItems.push({ mesh, mat, glow, glowMat });
    });

    const hubRing = new THREE.Group();
    network.add(hubRing);
    const hubDotMats: THREE.MeshPhysicalMaterial[] = [];
    const hubDotCount = quality.tier === "low" ? 6 : quality.tier === "medium" ? 8 : 10;
    for (let i = 0; i < hubDotCount; i++) {
      const a = (i / hubDotCount) * Math.PI * 2;
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        emissive: GREEN,
        emissiveIntensity: 0.65,
        roughness: 0.22,
        metalness: 0.8,
        clearcoat: quality.simplifyMaterials ? 0 : 0.7,
        clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.2,
        envMap: envMap ?? undefined,
        envMapIntensity: envMap ? (quality.simplifyMaterials ? 0.6 : 1.15) : 0,
      });
      materials.push(mat);
      hubDotMats.push(mat);
      const dot = new THREE.Mesh(hubDotGeo, mat);
      dot.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0.06);
      hubRing.add(dot);
    }
    const hubRingCurve = new THREE.EllipseCurve(0, 0, 0.58, 0.58, 0, Math.PI * 2, false, 0);
    const hubRingPts = hubRingCurve
      .getPoints(quality.tier === "low" ? 24 : 48)
      .map((p) => new THREE.Vector3(p.x, p.y, 0.06));
    const hubRingGeo = new THREE.BufferGeometry().setFromPoints(hubRingPts);
    disposables.push(hubRingGeo);
    const hubRingMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    materials.push(hubRingMat);
    hubRing.add(new THREE.LineLoop(hubRingGeo, hubRingMat));

    const hubGlowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex ?? undefined,
        color: GREEN,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    materials.push(hubGlowSprite.material);
    hubGlowSprite.scale.set(1.35, 1.35, 1);
    network.add(hubGlowSprite);

    // --- 3) Floating glass panels ---
    const panels = new THREE.Group();
    root.add(panels);

    type PanelItem = {
      group: THREE.Group;
      mats: THREE.MeshPhysicalMaterial[];
      edgeMats: THREE.LineBasicMaterial[];
      shadowMat: THREE.MeshBasicMaterial;
      base: THREE.Vector3;
      delay: number;
      rotSpeed: number;
      thickness: number;
      phase: number;
      wander: WanderBody;
      collider: Collider;
    };
    const panelItems: PanelItem[] = [];

    function makeGlassPanel(
      w: number,
      h: number,
      thickness: number,
      accent: THREE.Color,
      hex: boolean,
    ) {
      const g = new THREE.Group();
      const mats: THREE.MeshPhysicalMaterial[] = [];
      const edgeMats: THREE.LineBasicMaterial[] = [];
      const pickables: THREE.Object3D[] = [];

      let body: THREE.Mesh;
      let bodyGeo: THREE.BufferGeometry;

      if (hex) {
        const shape = hexShape(w * 0.5, h * 0.5);
        bodyGeo = new THREE.ExtrudeGeometry(shape, {
          depth: thickness,
          bevelEnabled: quality.tier !== "low",
          bevelThickness: thickness * 0.22,
          bevelSize: Math.min(w, h) * 0.04,
          bevelSegments: quality.tier === "high" ? 2 : 1,
          curveSegments: 1,
        });
        bodyGeo.translate(0, 0, -thickness * 0.5);
      } else {
        bodyGeo = new THREE.BoxGeometry(w, h, thickness);
      }
      disposables.push(bodyGeo);

      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: GLASS_TINT,
        emissive: accent,
        emissiveIntensity: 0.08,
        roughness: quality.simplifyMaterials ? 0.28 : 0.12,
        metalness: 0.6,
        clearcoat: quality.simplifyMaterials ? 0 : 1,
        clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.08,
        ior: 1.5,
        transparent: true,
        opacity: 0.48,
        envMap: envMap ?? undefined,
        envMapIntensity: envMap ? (quality.simplifyMaterials ? 0.9 : 1.7) : 0,
        side: THREE.FrontSide,
      });
      materials.push(bodyMat);
      mats.push(bodyMat);
      body = new THREE.Mesh(bodyGeo, bodyMat);
      g.add(body);
      pickables.push(body);

      const rimMat = new THREE.MeshPhysicalMaterial({
        color: METAL,
        emissive: accent,
        emissiveIntensity: 0.14,
        roughness: 0.18,
        metalness: 0.92,
        clearcoat: quality.simplifyMaterials ? 0 : 0.85,
        clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.16,
        transparent: true,
        opacity: 0.62,
        envMap: envMap ?? undefined,
        envMapIntensity: envMap ? (quality.simplifyMaterials ? 0.75 : 1.45) : 0,
      });
      materials.push(rimMat);
      mats.push(rimMat);

      if (hex) {
        const rimShape = hexShape(w * 0.52, h * 0.52);
        const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
          depth: thickness * 0.35,
          bevelEnabled: false,
          curveSegments: 1,
        });
        rimGeo.translate(0, 0, -thickness * 0.18);
        disposables.push(rimGeo);
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.scale.set(1.02, 1.02, 1);
        g.add(rimMesh);
        pickables.push(rimMesh);
      } else {
        const rimGeo = new THREE.BoxGeometry(w * 1.04, h * 1.04, thickness * 0.35);
        disposables.push(rimGeo);
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.position.z = -thickness * 0.15;
        g.add(rimMesh);
        pickables.push(rimMesh);
      }

      const edgeMat = new THREE.LineBasicMaterial({
        color: accent.clone().lerp(new THREE.Color("#ffffff"), 0.5),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      materials.push(edgeMat);
      edgeMats.push(edgeMat);
      const edgeLines = new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo), edgeMat);
      disposables.push(edgeLines.geometry);
      g.add(edgeLines);

      if (!hex) {
        const lineMat = new THREE.LineBasicMaterial({
          color: accent,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        });
        materials.push(lineMat);
        edgeMats.push(lineMat);
        for (let row = 0; row < 3; row++) {
          const y = h * 0.22 - row * 0.12;
          const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w * 0.32, y, thickness * 0.52),
            new THREE.Vector3(w * (row === 1 ? 0.18 : 0.28), y, thickness * 0.52),
          ]);
          disposables.push(geo);
          g.add(new THREE.Line(geo, lineMat));
        }
      }

      mats.forEach((m) => {
        m.userData.baseOpacity = m.opacity;
        m.userData.baseEmissive = m.emissiveIntensity;
      });
      edgeMats.forEach((m) => {
        m.userData.baseOpacity = m.opacity;
      });

      return { group: g, mats, edgeMats, pickables };
    }

    const panelDefs = [
      { p: new THREE.Vector3(-2.35, 1.05, 0.85), w: 1.25, h: 0.72, t: 0.08, hex: false, c: CYAN },
      { p: new THREE.Vector3(-2.05, -0.95, 0.45), w: 0.85, h: 0.85, t: 0.065, hex: true, c: PURPLE },
      { p: new THREE.Vector3(2.15, 1.2, 0.25), w: 0.7, h: 0.42, t: 0.06, hex: false, c: CYAN },
      { p: new THREE.Vector3(2.3, -0.72, 0.65), w: 0.48, h: 0.48, t: 0.05, hex: true, c: CYAN },
      { p: new THREE.Vector3(-1.55, 0.15, 1.25), w: 0.38, h: 0.26, t: 0.04, hex: false, c: PURPLE },
      { p: new THREE.Vector3(1.65, 0.32, 1.05), w: 1.05, h: 1.05, t: 0.07, hex: true, c: GREEN },
      { p: new THREE.Vector3(-0.2, -1.35, 0.9), w: 0.9, h: 0.5, t: 0.055, hex: false, c: CYAN },
    ];

    panelDefs.slice(0, quality.panelCount).forEach((def, i) => {
      const { group, mats, edgeMats, pickables } = makeGlassPanel(
        def.w,
        def.h,
        def.t,
        def.c,
        def.hex,
      );
      group.position.copy(def.p);
      panels.add(group);
      const shadowMat = makeContactShadow(group, Math.max(def.w, def.h) * 0.55, -def.h * 0.55);
      const id = `panel-${i}`;
      registerHover(id, group, pickables, mats);
      const wander = seedWander(def.p, 0.048 + Math.random() * 0.04);
      const hitR = Math.max(def.w, def.h) * 0.42;
      const collider: Collider = {
        wander,
        radius: hitR,
        mass: 0.7 + Math.max(def.w, def.h) * 0.9,
      };
      rootColliders.push(collider);
      panelItems.push({
        group,
        mats,
        edgeMats,
        shadowMat,
        base: def.p.clone(),
        delay: i * 0.055,
        rotSpeed: 0.045 + (i % 3) * 0.028,
        thickness: def.t,
        phase: Math.random() * Math.PI * 2,
        wander,
        collider,
      });
      group.userData.hitR = hitR;
    });

    // Soft atmospheric wash (kept subtle — not a flat blob substitute)
    const wash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex ?? undefined,
        color: CYAN,
        transparent: true,
        opacity: 0.05,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    materials.push(wash.material);
    wash.position.set(-0.4, 0.1, -2.8);
    wash.scale.set(7.5, 5.5, 1);
    root.add(wash);

    // --- 4) Future: pillar corridor + fiber trails + central beam ---
    const corridor = new THREE.Group();
    corridor.visible = false;
    root.add(corridor);

    const pillarMetalMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#9aa6bc"),
      emissive: new THREE.Color("#1a2848"),
      emissiveIntensity: 0.12,
      roughness: 0.38,
      metalness: 0.92,
      clearcoat: quality.simplifyMaterials ? 0 : 0.55,
      clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.28,
      envMap: envMap ?? undefined,
      envMapIntensity: envMap ? (quality.simplifyMaterials ? 0.85 : 1.65) : 0,
    });
    materials.push(pillarMetalMat);
    pillarMetalMat.userData.baseEmissive = pillarMetalMat.emissiveIntensity;

    const pillarConcreteMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#6e788c"),
      emissive: new THREE.Color("#121828"),
      emissiveIntensity: 0.08,
      roughness: 0.55,
      metalness: 0.72,
      clearcoat: quality.simplifyMaterials ? 0 : 0.35,
      clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.4,
      envMap: envMap ?? undefined,
      envMapIntensity: envMap ? (quality.simplifyMaterials ? 0.7 : 1.25) : 0,
    });
    materials.push(pillarConcreteMat);
    pillarConcreteMat.userData.baseEmissive = pillarConcreteMat.emissiveIntensity;

    const solidPillarGeo = new THREE.BoxGeometry(0.42, 3.4, 0.38);
    solidPillarGeo.translate(0, 1.7, 0);
    const hollowPillarGeo = makeHollowPillarGeometry(0.48, 0.42, 3.55, 0.085);
    disposables.push(solidPillarGeo, hollowPillarGeo);

    type PillarItem = {
      group: THREE.Group;
      mesh: THREE.Mesh;
      mat: THREE.MeshPhysicalMaterial;
      shadowMat: THREE.MeshBasicMaterial;
      base: THREE.Vector3;
      phase: number;
      wander: WanderBody;
      bounds: StageBounds;
    };
    const pillars: PillarItem[] = [];

    for (let row = 0; row < PILLAR_ROWS; row++) {
      const z = -0.35 - row * 1.28;
      const heightScale = 0.92 + row * 0.06;
      for (const side of [-1, 1] as const) {
        const x = side * (1.05 + row * 0.12);
        const hollow = (row + (side > 0 ? 1 : 0)) % 2 === 0;
        const mat = hollow ? pillarMetalMat : pillarConcreteMat;
        const geo = hollow ? hollowPillarGeo : solidPillarGeo;
        const group = new THREE.Group();
        group.position.set(x, -1.55, z);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(1, heightScale, 1);
        group.add(mesh);
        const shadowMat = makeContactShadow(group, 0.55, 0.02);
        corridor.add(group);
        const id = `pillar-${row}-${side > 0 ? "r" : "l"}`;
        registerHover(id, group, [mesh], [mat]);
        const base = group.position.clone();
        pillars.push({
          group,
          mesh,
          mat,
          shadowMat,
          base,
          phase: row * 0.7 + (side > 0 ? 1.2 : 0),
          wander: seedWander(base, 0.04 + row * 0.005 + Math.random() * 0.02),
          bounds: leashBounds(base, 0.28 + row * 0.04),
        });
      }
    }

    // Fiber-optic trails weaving between pillars (shared tube geo via curves)
    type CorridorFiber = {
      mesh: THREE.Mesh;
      mat: THREE.MeshPhysicalMaterial;
      glow: THREE.Mesh;
      glowMat: THREE.MeshBasicMaterial;
      phase: number;
      pulse: number;
    };
    const corridorFibers: CorridorFiber[] = [];
    const tubeRadial = quality.tier === "low" ? 3 : 4;

    for (let i = 0; i < FIBER_TRAILS; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const yBase = -0.85 + (i % 5) * 0.42;
      const pts: THREE.Vector3[] = [];
      const pathSteps = quality.tier === "low" ? 5 : 7;
      for (let s = 0; s < pathSteps; s++) {
        const z = 0.4 - s * 1.15;
        const weave = Math.sin(s * 0.95 + i * 0.55) * 0.35;
        const x = side * (0.55 + s * 0.08) + weave * (side > 0 ? -0.55 : 0.55);
        const y = yBase + Math.sin(s * 0.7 + i) * 0.18 + s * 0.04;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(
        curve,
        quality.tubeSegments,
        0.012,
        tubeRadial,
        false,
      );
      const glowGeo = new THREE.TubeGeometry(
        curve,
        quality.tubeSegments,
        0.032,
        tubeRadial,
        false,
      );
      disposables.push(tubeGeo, glowGeo);

      const tint = i % 3 === 0 ? PURPLE : CYAN;
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#e8f8ff"),
        emissive: tint,
        emissiveIntensity: 0.85,
        roughness: 0.18,
        metalness: 0.55,
        clearcoat: quality.simplifyMaterials ? 0 : 0.8,
        clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.15,
        transparent: true,
        opacity: 0.9,
        envMap: envMap ?? undefined,
        envMapIntensity: envMap ? (quality.simplifyMaterials ? 0.55 : 1.1) : 0,
      });
      materials.push(mat);
      mat.userData.baseOpacity = mat.opacity;
      mat.userData.baseEmissive = mat.emissiveIntensity;

      const mesh = new THREE.Mesh(tubeGeo, mat);
      corridor.add(mesh);

      const glowMat = new THREE.MeshBasicMaterial({
        color: tint,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      materials.push(glowMat);
      glowMat.userData.baseOpacity = glowMat.opacity;
      const glow = new THREE.Mesh(glowGeo, glowMat);
      corridor.add(glow);

      corridorFibers.push({
        mesh,
        mat,
        glow,
        glowMat,
        phase: i * 0.4,
        pulse: 0.55 + (i % 4) * 0.12,
      });
    }

    // Central vertical beam + rising particles
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, -0.2, -7.2);
    corridor.add(beamGroup);

    const beamGeo = new THREE.CylinderGeometry(
      0.045,
      0.09,
      6.5,
      quality.beamRadialSegs,
      1,
      true,
    );
    disposables.push(beamGeo);
    const beamMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#c8f8ff"),
      emissive: CYAN,
      emissiveIntensity: 1.8,
      roughness: 0.12,
      metalness: 0.2,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMap: envMap ?? undefined,
      envMapIntensity: envMap ? 0.6 : 0,
    });
    materials.push(beamMat);
    const beamCore = new THREE.Mesh(beamGeo, beamMat);
    beamCore.position.y = 1.6;
    beamGroup.add(beamCore);

    const beamGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex ?? undefined,
        color: CYAN,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    materials.push(beamGlow.material);
    beamGlow.scale.set(2.4, 5.8, 1);
    beamGlow.position.y = 1.8;
    beamGroup.add(beamGlow);

    let beamPurple: THREE.Sprite | null = null;
    if (quality.tier !== "low") {
      beamPurple = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex ?? undefined,
          color: PURPLE,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      materials.push(beamPurple.material);
      beamPurple.scale.set(3.2, 4.2, 1);
      beamPurple.position.set(0.15, 1.2, 0.2);
      beamGroup.add(beamPurple);
    }

    const beamPos = new Float32Array(BEAM_PARTICLES * 3);
    const beamCol = new Float32Array(BEAM_PARTICLES * 3);
    const beamBaseY = new Float32Array(BEAM_PARTICLES);
    for (let i = 0; i < BEAM_PARTICLES; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.22;
      beamPos[i * 3] = Math.cos(a) * r;
      beamPos[i * 3 + 1] = Math.random() * 5.5;
      beamPos[i * 3 + 2] = Math.sin(a) * r;
      beamBaseY[i] = beamPos[i * 3 + 1];
      const c = i % 3 === 0 ? PURPLE : CYAN;
      beamCol[i * 3] = c.r;
      beamCol[i * 3 + 1] = c.g;
      beamCol[i * 3 + 2] = c.b;
    }
    const beamPtsGeo = new THREE.BufferGeometry();
    beamPtsGeo.setAttribute("position", new THREE.BufferAttribute(beamPos, 3));
    beamPtsGeo.setAttribute("color", new THREE.BufferAttribute(beamCol, 3));
    disposables.push(beamPtsGeo);
    const beamPtsMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: glowTex ?? undefined,
    });
    materials.push(beamPtsMat);
    const beamPts = new THREE.Points(beamPtsGeo, beamPtsMat);
    beamGroup.add(beamPts);

    const beamLight = new THREE.PointLight(0x70f0ff, 0, 14, 2);
    beamLight.position.set(0, 1.5, -7.0);
    scene.add(beamLight);
    const beamFill = new THREE.PointLight(0x9060ff, 0, 10, 2);
    beamFill.position.set(0.4, 0.6, -5.5);
    scene.add(beamFill);

    // Floor contact strip for perspective ground plane feel
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x04060f,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    materials.push(floorMat);
    const floorGeo = new THREE.PlaneGeometry(8, 12);
    disposables.push(floorGeo);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -1.58, -4.2);
    corridor.add(floor);

    // --- 5) Realization: large wireframe cube + floating accents ---
    const wireArch = new THREE.Group();
    wireArch.visible = false;
    root.add(wireArch);

    const archPivot = new THREE.Group();
    archPivot.position.set(-0.15, 0.05, -0.85);
    wireArch.add(archPivot);

    const archFaceMat = new THREE.MeshPhysicalMaterial({
      color: GLASS_TINT,
      emissive: CYAN,
      emissiveIntensity: 0.05,
      roughness: quality.simplifyMaterials ? 0.28 : 0.12,
      metalness: 0.55,
      clearcoat: quality.simplifyMaterials ? 0 : 1,
      clearcoatRoughness: quality.simplifyMaterials ? 1 : 0.1,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMap: envMap ?? undefined,
      envMapIntensity: envMap ? (quality.simplifyMaterials ? 0.7 : 1.4) : 0,
    });
    materials.push(archFaceMat);
    archFaceMat.userData.baseOpacity = archFaceMat.opacity;
    archFaceMat.userData.baseEmissive = archFaceMat.emissiveIntensity;

    const archEdgeMat = new THREE.LineBasicMaterial({
      color: 0xb8e8ff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    materials.push(archEdgeMat);
    archEdgeMat.userData.baseOpacity = archEdgeMat.opacity;

    const archSize = 2.65;
    const archCube = new THREE.Mesh(boxGeo, archFaceMat);
    archCube.scale.setScalar(archSize);
    archPivot.add(archCube);
    const archEdges = new THREE.LineSegments(edgesGeo, archEdgeMat);
    archEdges.scale.setScalar(archSize * 1.001);
    archPivot.add(archEdges);
    registerHover("arch-cube", archPivot, [archCube], [archFaceMat]);

    const innerFaceMat = archFaceMat.clone();
    innerFaceMat.opacity = 0.08;
    innerFaceMat.emissive = PURPLE.clone();
    materials.push(innerFaceMat);
    innerFaceMat.userData.baseOpacity = innerFaceMat.opacity;
    innerFaceMat.userData.baseEmissive = innerFaceMat.emissiveIntensity;
    const innerEdgeMat = archEdgeMat.clone();
    innerEdgeMat.color = new THREE.Color(0xd0c0ff);
    innerEdgeMat.opacity = 0.45;
    materials.push(innerEdgeMat);
    innerEdgeMat.userData.baseOpacity = innerEdgeMat.opacity;

    const innerCube = new THREE.Mesh(boxGeo, innerFaceMat);
    innerCube.scale.setScalar(archSize * 0.55);
    archPivot.add(innerCube);
    const innerEdges = new THREE.LineSegments(edgesGeo, innerEdgeMat);
    innerEdges.scale.setScalar(archSize * 0.552);
    archPivot.add(innerEdges);

    type AccentItem = {
      group: THREE.Group;
      content: THREE.Group;
      mats: THREE.MeshPhysicalMaterial[];
      base: THREE.Vector3;
      phase: number;
      spin: number;
      size: number;
      offset: THREE.Vector3;
      vel: THREE.Vector3;
      mass: number;
      radius: number;
      wander: WanderBody;
      collider: Collider;
      kind: ServiceFigureKind;
    };
    const accents: AccentItem[] = [];
    const accentDefs: {
      p: THREE.Vector3;
      s: number;
      c: THREE.Color;
      kind: ServiceFigureKind;
      style: FigureStyle;
    }[] = [
      { p: new THREE.Vector3(-2.1, 1.15, 0.4), s: 0.44, c: CYAN, kind: "laptop", style: "glass" },
      { p: new THREE.Vector3(2.0, 0.95, 0.15), s: 0.36, c: PURPLE, kind: "wifi", style: "accent" },
      { p: new THREE.Vector3(-1.7, -1.1, 0.55), s: 0.3, c: CYAN, kind: "router", style: "metal" },
      { p: new THREE.Vector3(1.85, -0.85, 0.7), s: 0.1, c: PURPLE, kind: "phone", style: "glass" },
      { p: new THREE.Vector3(0.15, 1.55, -0.2), s: 0.5, c: CYAN, kind: "globe", style: "glass" },
      { p: new THREE.Vector3(-0.35, -1.45, 0.3), s: 0.22, c: GREEN, kind: "headphones", style: "accent" },
      { p: new THREE.Vector3(1.35, 1.35, -0.35), s: 0.18, c: GREEN, kind: "chip", style: "metal" },
      { p: new THREE.Vector3(-2.25, -0.25, 0.2), s: 0.28, c: PURPLE, kind: "database", style: "glass" },
      { p: new THREE.Vector3(2.2, -0.15, 0.55), s: 0.08, c: CYAN, kind: "usb", style: "accent" },
      { p: new THREE.Vector3(-1.1, 1.4, -0.5), s: 0.16, c: CYAN, kind: "antenna", style: "metal" },
      { p: new THREE.Vector3(0.85, -1.35, 0.15), s: 0.14, c: PURPLE, kind: "code", style: "accent" },
    ];

    accentDefs.slice(0, quality.accentCount).forEach((def, i) => {
      const built = figurePool.build(def.kind, def.s, {
        tint: def.c,
        style: def.style,
        ...figureMatOpts,
      });
      // Realization accents stay more translucent / ethereal
      for (const m of built.mats) {
        m.opacity = Math.min(m.opacity, 0.38);
        m.userData.baseOpacity = m.opacity;
        materials.push(m);
      }
      const group = built.root;
      group.position.copy(def.p);
      wireArch.add(group);
      registerHover(`accent-${i}`, group, built.pick, built.mats);
      const wander = seedWander(def.p, 0.05 + Math.random() * 0.045);
      const collider: Collider = {
        wander,
        radius: built.radius,
        mass: 0.55 + def.s * 1.4,
      };
      accentColliders.push(collider);
      accents.push({
        group,
        content: built.content,
        mats: built.mats,
        base: def.p.clone(),
        phase: i * 0.9,
        spin: 0.12 + (i % 3) * 0.06,
        size: def.s,
        offset: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        mass: collider.mass,
        radius: 1.55 + def.s * 2.2,
        wander,
        collider,
        kind: def.kind,
      });
    });

    // Main wireframe cube — light per-mesh scatter (not whole-scene drag)
    const archHome = archPivot.position.clone();
    const archWander = seedWander(archHome, 0.055 + Math.random() * 0.03);
    const archScatter = {
      offset: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      mass: 2.4,
      radius: 2.6,
    };

    const archWash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex ?? undefined,
        color: PURPLE,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    materials.push(archWash.material);
    archWash.position.set(0, 0.2, -2.2);
    archWash.scale.set(6.5, 5.2, 1);
    wireArch.add(archWash);

    // State for morph
    let fromStage: StageId = liveStageRef.current;
    let toStage: StageId = liveStageRef.current;
    let morphT = 1;
    let morphDuration = reduceMotion
      ? 0.01
      : 1.15 * quality.morphDurationScale;
    let currentVisual = { ...VISUALS[toStage] };
    let nodeProgress = nodes.map(() => 1);
    let panelProgress = panelItems.map(() => 1);
    let lastInteractAt = performance.now();
    const wantsPointer = quality.enableHover || quality.enableScatter;

    const pointer = { nx: 0, ny: 0, overUi: false, moved: false, inside: false };
    let activeHoverId: string | null = null;
    let cursorPointer = false;
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const hubOrigin = new THREE.Vector3(0, 0, 0);
    const tmpPos = new THREE.Vector3();
    const tintColor = new THREE.Color();
    const hoverById = new Map(hoverTargets.map((h) => [h.id, h]));
    // Realization pointer repulsion — project into stage plane, push individual meshes
    const scatterPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.55);
    const pointerWorld = new THREE.Vector3();
    const repelDir = new THREE.Vector3();
    const REPEL_STRENGTH = 22;
    const REPEL_SPRING = 9.5;
    const REPEL_DAMP = 0.84;
    const REPEL_MAX = 1.55;

    function setCursor(on: boolean) {
      if (on === cursorPointer) return;
      cursorPointer = on;
      document.documentElement.style.cursor = on ? "pointer" : "";
    }

    function beginMorph(next: StageId) {
      if (next === toStage && morphT >= 1) return;
      fromStage = toStage;
      toStage = next;
      morphT = 0;
      lastInteractAt = performance.now();
      if (!reduceMotion) {
        const outgoing = VISUALS[fromStage];
        const incoming = VISUALS[toStage];
        if (incoming.networkOpacity > outgoing.networkOpacity) {
          nodeProgress = nodes.map(() => 0);
        }
        if (incoming.panelsOpacity > outgoing.panelsOpacity) {
          panelProgress = panelItems.map(() => 0);
        }
      }
    }

    function resize() {
      const el = mountHolder.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }

    function updateLinks(spread: number, linkStrength: number) {
      const arr = linkGeo.attributes.position.array as Float32Array;
      let wi = 0;
      for (let i = 0; i < LINK_COUNT; i++) {
        const a = (i * 3) % PARTICLE_COUNT;
        const b = (i * 7 + 11) % PARTICLE_COUNT;
        arr[wi++] = positions[a * 3] * spread;
        arr[wi++] = positions[a * 3 + 1] * spread;
        arr[wi++] = positions[a * 3 + 2];
        arr[wi++] = positions[b * 3] * spread;
        arr[wi++] = positions[b * 3 + 1] * spread;
        arr[wi++] = positions[b * 3 + 2];
      }
      linkGeo.attributes.position.needsUpdate = true;
      linkMat.opacity = 0.04 + linkStrength * 0.16;
    }

    function updateFibers(opacity: number, glow: number) {
      for (let i = 0; i < fiberPairs.length; i++) {
        const [ia, ib] = fiberPairs[i];
        const a = nodes[ia].group.position;
        const b = nodes[ib].group.position;
        const item = fiberItems[i];
        placeFiber(item.mesh, a, b, 0.008 + glow * 0.006);
        placeFiber(item.glow, a, b, 0.022 + glow * 0.014);
        const baseOp = item.mat.userData.baseOpacity as number;
        const baseEm = item.mat.userData.baseEmissive as number;
        item.mat.opacity = baseOp * opacity;
        item.mat.emissiveIntensity = baseEm * (0.4 + glow * 0.9);
        item.glowMat.opacity = (item.glowMat.userData.baseOpacity as number) * opacity * (0.5 + glow);
        item.mesh.visible = opacity > 0.03 && item.mesh.visible;
        item.glow.visible = item.mesh.visible && opacity > 0.05;
      }
    }

    function pickHoverTarget() {
      if (!quality.enableHover || pointer.overUi || !pickMeshes.length) {
        activeHoverId = null;
        setCursor(false);
        return;
      }
      pointerNdc.set(pointer.nx, pointer.ny);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(pickMeshes, false);
      let nextId: string | null = null;
      for (const hit of hits) {
        const id = hit.object.userData.hoverId as string | undefined;
        if (!id) continue;
        let visible = true;
        let p: THREE.Object3D | null = hit.object;
        while (p) {
          if (!p.visible) {
            visible = false;
            break;
          }
          p = p.parent;
        }
        if (!visible) continue;
        nextId = id;
        break;
      }
      if (nextId && nextId !== activeHoverId) {
        const ht = hoverById.get(nextId);
        if (ht) ht.bounce = 1;
      }
      activeHoverId = nextId;
      setCursor(!!activeHoverId);
    }

    let raf = 0;
    let running = true;
    let tabVisible = document.visibilityState === "visible";
    let introCovering = document.documentElement.dataset.intro === "wait";
    let stageInView = true;
    let lastTs = performance.now();
    let elapsed = 0;
    let lastStage = liveStageRef.current;
    let frameSkip = quality.frameSkip;
    let skipCounter = 0;
    let fpsEma = 60;
    let fpsSampleAcc = 0;
    let fpsSampleFrames = 0;
    let lastDrawnAt = 0;

    function canRender() {
      return tabVisible && !introCovering && stageInView && !!mountHolder.current;
    }

    function noteInteract() {
      lastInteractAt = performance.now();
    }

    function frame(now: number) {
      if (!running) return;
      if (!canRender()) {
        raf = 0;
        return;
      }

      const morphing = morphT < 1 || liveStageRef.current !== lastStage;
      const idleMs = now - lastInteractAt;
      // Mobile idle: drop to ~12fps ambient; active/morph stays at ~30fps.
      const idleCapMs =
        quality.isMobile && !morphing && idleMs > 1800 ? 80 : quality.minFrameMs;
      if (idleCapMs > 0 && now - lastDrawnAt < idleCapMs) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastDrawnAt = now;

      const rawDt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;

      // Adaptive skip: keep fluid motion math lighter when GPU struggles
      if (frameSkip > 0) {
        skipCounter++;
        if (skipCounter <= frameSkip) {
          elapsed += rawDt;
          raf = requestAnimationFrame(frame);
          return;
        }
        skipCounter = 0;
      }

      const dt = rawDt * (frameSkip > 0 ? frameSkip + 1 : 1);
      elapsed += rawDt;
      const t = elapsed;

      fpsSampleAcc += rawDt;
      fpsSampleFrames++;
      if (fpsSampleAcc >= 1.2) {
        const fps = fpsSampleFrames / fpsSampleAcc;
        fpsEma = fpsEma * 0.65 + fps * 0.35;
        fpsSampleAcc = 0;
        fpsSampleFrames = 0;
        const skipCeil = quality.isMobile ? 3 : 2;
        if (fpsEma < quality.fpsFloor && frameSkip < skipCeil) {
          frameSkip += 1;
        } else if (fpsEma > quality.fpsFloor + 12 && frameSkip > quality.frameSkip) {
          frameSkip -= 1;
        }
      }

      if (liveStageRef.current !== lastStage) {
        beginMorph(liveStageRef.current);
        lastStage = liveStageRef.current;
      }

      if (morphT < 1) {
        morphT = Math.min(1, morphT + dt / morphDuration);
      }
      const eased = easeOutCubic(morphT);
      currentVisual = lerpVisual(VISUALS[fromStage], VISUALS[toStage], eased);

      const v = currentVisual;
      const tint = tintColor.copy(CYAN).lerp(PURPLE, v.tintMix);

      hubLight.position.set(1.5 * v.networkSide, 0.25, 0.5);
      hubLight.intensity = 0.4 + v.hubGlow * 1.4;
      accentLight.intensity = 0.35 + v.nebulaOpacity * 0.45;
      key.intensity = 0.95 + v.networkOpacity * 0.4;
      rim.intensity = 0.55 + v.hubGlow * 0.35;

      wash.material.color.copy(tint);
      wash.material.opacity = 0.03 + v.nebulaOpacity * 0.04;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const bx = basePos[i * 3];
        const by = basePos[i * 3 + 1];
        const bz = basePos[i * 3 + 2];
        const drift = reduceMotion ? 0 : Math.sin(t * 0.55 + i * 0.2) * 0.12;
        const driftY = reduceMotion ? 0 : Math.cos(t * 0.48 + i) * 0.09;
        const driftZ = reduceMotion ? 0 : Math.sin(t * 0.4 + i * 0.15) * 0.07;
        positions[i * 3] = bx * v.nebulaSpread + drift;
        positions[i * 3 + 1] = by * v.nebulaSpread + driftY;
        positions[i * 3 + 2] = bz + driftZ;
        const c = i % 3 === 0 ? tint : i % 2 === 0 ? CYAN : PURPLE;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      nebulaGeo.attributes.position.needsUpdate = true;
      nebulaGeo.attributes.color.needsUpdate = true;
      nebulaMat.opacity = 0.28 + v.nebulaOpacity * 0.48;

      // Figures — independent wander + wall bounce; collisions after all integrate
      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i];
        if (!reduceMotion) {
          integrateWander(o.wander, dt, ROOT_BOUNDS, { wallPad: 0.5, spring: 1.9, jitter: 0.07 });
        } else {
          o.wander.pos.copy(o.base);
          o.wander.vel.set(0, 0, 0);
        }
      }

      updateLinks(v.nebulaSpread, v.particleLink);

      // Network — autonomous gentle sway only
      network.position.set(1.55 * v.networkSide, 0.12, 0);
      network.scale.setScalar(v.networkScale);
      network.rotation.y = reduceMotion ? 0 : Math.sin(t * 0.12) * 0.1;
      network.rotation.x = 0.18 + (reduceMotion ? 0 : Math.sin(t * 0.08) * 0.04);
      network.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.09) * 0.035;

      hubGlowSprite.material.opacity = 0.08 + v.hubGlow * 0.32;
      hubGlowSprite.scale.setScalar(1.05 + v.hubGlow * 0.55 + Math.sin(t * 1.1) * 0.08);
      hubRing.rotation.z = t * 0.28;
      hubRing.rotation.x = Math.sin(t * 0.2) * 0.15;
      hubRing.visible = v.networkOpacity > 0.12;
      hubRingMat.opacity = 0.12 + v.networkOpacity * 0.28;
      for (const m of hubDotMats) {
        m.opacity = v.networkOpacity;
        m.emissiveIntensity = 0.3 + v.hubGlow * 0.7;
        m.transparent = true;
      }

      nodes.forEach((node, i) => {
        const dissolving =
          VISUALS[toStage].networkOpacity < VISUALS[fromStage].networkOpacity;
        if (dissolving) {
          nodeProgress[i] = 1 - eased;
        } else {
          const target = morphT >= node.assembleDelay ? 1 : 0;
          nodeProgress[i] += (target - nodeProgress[i]) * (0.055 + node.assembleDelay * 0.015);
        }
        const p = Math.max(0, Math.min(1, nodeProgress[i]));
        const pop = easeOutBack(Math.min(1, p * 1.05)) * v.networkOpacity;
        const clampedPop = Math.max(0, Math.min(1, pop));

        if (!reduceMotion && clampedPop > 0.15) {
          integrateWander(node.wander, dt, NETWORK_BOUNDS, {
            wallPad: 0.32,
            spring: 2.1,
            jitter: 0.07,
          });
        } else if (reduceMotion) {
          node.wander.pos.copy(node.base);
          node.wander.vel.set(0, 0, 0);
        }
        node.group.userData.assembleScale = node.isHub
          ? 0.35 + clampedPop * 0.65
          : 0.22 + clampedPop * 0.78;
        node.content.rotation.x = t * node.spin * 0.32;
        node.content.rotation.y = t * node.spin * 0.48 + clampedPop * 0.4;

        const ht = hoverById.get(`node-${i}`);
        const hoverBoost = ht ? 1 + ht.hover * 1.35 + ht.bounce * 0.75 : 1;
        for (const m of node.mats) {
          const baseOp = (m.userData.baseOpacity as number) ?? m.opacity;
          const baseEm = (m.userData.baseEmissive as number) ?? m.emissiveIntensity;
          m.opacity = baseOp * clampedPop;
          m.emissiveIntensity =
            baseEm * (0.5 + v.hubGlow * 0.8) * clampedPop * hoverBoost;
        }
        if (node.edgeMat) {
          node.edgeMat.opacity =
            (node.edgeMat.userData.baseOpacity as number) * clampedPop;
        }
        node.shadowMat.opacity = 0.08 + clampedPop * 0.18;
        node.group.visible = clampedPop > 0.02;
        node.group.userData._pop = clampedPop;
        node.collider.radius =
          clampedPop > 0.15 ? node.hitRadius * (node.isHub ? 1.15 : 1) : 0;
      });

      if (quality.enableCollisions && !reduceMotion && v.networkOpacity > 0.12) {
        resolveGroupCollisions(networkColliders);
      }
      nodes.forEach((node) => {
        const clampedPop = (node.group.userData._pop as number) ?? 0;
        tmpPos.copy(node.wander.pos);
        tmpPos.lerp(hubOrigin, 1 - clampedPop);
        node.group.position.copy(tmpPos);
      });

      updateFibers(v.networkOpacity, v.hubGlow);

      // Panels — autonomous float; collide with root figures after integrate
      panels.position.set(0, 0, 0);
      const panelEase: number[] = panelItems.map(() => 0);
      panelItems.forEach((item, i) => {
        const dissolving =
          VISUALS[toStage].panelsOpacity < VISUALS[fromStage].panelsOpacity;
        if (dissolving) {
          panelProgress[i] = 1 - eased;
        } else {
          const target = morphT >= item.delay ? 1 : 0;
          panelProgress[i] += (target - panelProgress[i]) * 0.065;
        }
        const p = Math.max(0, Math.min(1, panelProgress[i])) * v.panelsOpacity;
        const e = easeOutCubic(p);
        panelEase[i] = e;

        if (!reduceMotion && e > 0.15) {
          integrateWander(item.wander, dt, ROOT_BOUNDS, {
            wallPad: 0.48,
            spring: 1.85,
            jitter: 0.06,
          });
          item.collider.radius = (item.group.userData.hitR as number) ?? 0.3;
        } else {
          if (reduceMotion) {
            item.wander.pos.copy(item.base);
            item.wander.vel.set(0, 0, 0);
          }
          item.collider.radius = 0;
        }
      });

      if (quality.enableCollisions && !reduceMotion) {
        resolveGroupCollisions(rootColliders);
      }

      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i];
        const breathe = reduceMotion ? 1 : 1 + Math.sin(t * o.pulse + o.phase) * 0.08;
        const spread = breathe * (0.9 + v.nebulaSpread * 0.1);
        o.pivot.position.copy(o.wander.pos);
        o.content.scale.setScalar(spread);
        o.pivot.userData.assembleScale = 1;
        const opMul = 0.75 + v.nebulaOpacity * 0.35;
        for (const m of o.mats) {
          m.opacity = (m.userData.baseOpacity as number) * opMul;
        }
        o.shadowMat.opacity = 0.1 + v.nebulaOpacity * 0.16;
        o.content.rotation.y = t * o.spin;
        o.content.rotation.x = Math.sin(t * 0.18 + o.phase) * 0.35;
        o.content.rotation.z = Math.cos(t * 0.14 + o.phase) * 0.2;
      }

      panelItems.forEach((item, i) => {
        const e = panelEase[i];
        item.group.position.set(
          item.wander.pos.x * (0.55 + v.panelsSpread * 0.45),
          item.wander.pos.y * (0.55 + v.panelsSpread * 0.45),
          item.wander.pos.z + (1 - e) * 0.8,
        );
        item.group.userData.assembleScale = 0.35 + e * 0.65;
        item.group.rotation.x = (1 - e) * 0.55 + Math.sin(t * item.rotSpeed * 0.5) * 0.08;
        item.group.rotation.y = Math.cos(t * item.rotSpeed * 0.7) * 0.16 + (1 - e) * 0.4;
        item.group.rotation.z = Math.sin(t * item.rotSpeed + i) * 0.1;

        const ht = hoverById.get(`panel-${i}`);
        const hoverBoost = ht ? 1 + ht.hover * 1.35 + ht.bounce * 0.7 : 1;
        for (const m of item.mats) {
          m.opacity = (m.userData.baseOpacity as number) * e;
          m.emissiveIntensity =
            (m.userData.baseEmissive as number) * (0.6 + e * 0.6) * hoverBoost;
        }
        for (const m of item.edgeMats) {
          m.opacity = (m.userData.baseOpacity as number) * e;
        }
        item.shadowMat.opacity = 0.06 + e * 0.16;
        item.group.visible = e > 0.02;
      });

      // Future corridor — pillars, fibers, beam
      const corr = v.corridor;
      corridor.visible = corr > 0.02;
      corridor.position.set(-0.35 * corr, 0.05, 0.2);
      if (corr > 0.02) {
        for (let i = 0; i < pillars.length; i++) {
          const p = pillars[i];
          if (!reduceMotion) {
            integrateWander(p.wander, dt, p.bounds, {
              wallPad: 0.12,
              spring: 2.4,
              jitter: 0.06,
            });
          } else {
            p.wander.pos.copy(p.base);
            p.wander.vel.set(0, 0, 0);
          }
          p.group.position.copy(p.wander.pos);
          p.group.userData.assembleScale = 0.4 + corr * 0.6;
          p.group.visible = true;
          p.shadowMat.opacity = 0.12 + corr * 0.18;
        }
        pillarMetalMat.emissiveIntensity =
          (pillarMetalMat.userData.baseEmissive as number) * (0.7 + corr * 0.9);
        pillarConcreteMat.emissiveIntensity =
          (pillarConcreteMat.userData.baseEmissive as number) * (0.7 + corr * 0.8);

        for (let i = 0; i < corridorFibers.length; i++) {
          const f = corridorFibers[i];
          const pulse = reduceMotion
            ? 1
            : 0.72 + Math.sin(t * f.pulse + f.phase) * 0.28;
          f.mat.opacity = (f.mat.userData.baseOpacity as number) * corr * pulse;
          f.mat.emissiveIntensity =
            (f.mat.userData.baseEmissive as number) * corr * (0.65 + pulse * 0.55);
          f.glowMat.opacity =
            (f.glowMat.userData.baseOpacity as number) * corr * pulse;
          f.mesh.visible = corr > 0.05;
          f.glow.visible = corr > 0.08;
        }

        const beamPulse = reduceMotion ? 1 : 0.85 + Math.sin(t * 1.4) * 0.15;
        beamMat.opacity = 0.35 + corr * 0.35 * beamPulse;
        beamMat.emissiveIntensity = 1.2 + corr * 1.1 * beamPulse;
        beamGlow.material.opacity = 0.2 + corr * 0.35 * beamPulse;
        if (beamPurple) beamPurple.material.opacity = 0.1 + corr * 0.18;
        beamPtsMat.opacity = 0.4 + corr * 0.5;
        for (let i = 0; i < BEAM_PARTICLES; i++) {
          let y = beamBaseY[i] + (reduceMotion ? 0 : t * (0.35 + (i % 5) * 0.08));
          y = ((y % 5.5) + 5.5) % 5.5;
          beamPos[i * 3 + 1] = y;
        }
        beamPtsGeo.attributes.position.needsUpdate = true;
        floorMat.opacity = 0.25 + corr * 0.35;
      }
      beamLight.intensity = corr * (1.6 + Math.sin(t * 1.3) * 0.35);
      beamFill.intensity = corr * 0.9;

      // Realization wireframe architecture
      const arch = v.wireArch;
      wireArch.visible = arch > 0.02;
      if (arch > 0.02) {
        archPivot.rotation.x = reduceMotion ? 0.25 : 0.28 + Math.sin(t * 0.18) * 0.06;
        archPivot.rotation.y = reduceMotion ? 0.45 : t * 0.08 + 0.35;
        archPivot.rotation.z = reduceMotion ? 0.08 : Math.sin(t * 0.12) * 0.05;
        archPivot.userData.assembleScale = 0.45 + arch * 0.55;
        archFaceMat.opacity = (archFaceMat.userData.baseOpacity as number) * arch;
        archFaceMat.emissiveIntensity =
          (archFaceMat.userData.baseEmissive as number) * (0.6 + arch);
        archEdgeMat.opacity = (archEdgeMat.userData.baseOpacity as number) * arch;
        innerFaceMat.opacity = (innerFaceMat.userData.baseOpacity as number) * arch;
        innerEdgeMat.opacity = (innerEdgeMat.userData.baseOpacity as number) * arch;
        archWash.material.opacity = 0.04 + arch * 0.1;
        archWash.material.color.copy(tint);

        // Pointer → scene-plane projection for per-mesh repulsion (desktop only)
        let scatterLive = false;
        if (
          quality.enableScatter &&
          !reduceMotion &&
          pointer.inside &&
          arch > 0.25
        ) {
          pointerNdc.set(pointer.nx, pointer.ny);
          raycaster.setFromCamera(pointerNdc, camera);
          scatterLive = !!raycaster.ray.intersectPlane(scatterPlane, pointerWorld);
        }

        const damp = Math.pow(REPEL_DAMP, dt * 60);
        const integrateScatter = (
          idle: THREE.Vector3,
          offset: THREE.Vector3,
          vel: THREE.Vector3,
          mass: number,
          radius: number,
          strengthScale: number,
        ) => {
          if (scatterLive) {
            const dx = idle.x - pointerWorld.x;
            const dy = idle.y - pointerWorld.y;
            const dz = (idle.z - pointerWorld.z) * 0.55;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < radius && dist > 1e-4) {
              const falloff = (1 - dist / radius) ** 2;
              repelDir.set(dx, dy, dz).multiplyScalar(1 / dist);
              const impulse = (REPEL_STRENGTH * strengthScale * falloff * dt) / mass;
              vel.addScaledVector(repelDir, impulse);
              vel.y += falloff * 3.2 * strengthScale * dt;
            }
          }
          vel.x += -offset.x * REPEL_SPRING * dt;
          vel.y += -offset.y * REPEL_SPRING * dt;
          vel.z += -offset.z * REPEL_SPRING * dt;
          vel.multiplyScalar(damp);
          offset.addScaledVector(vel, dt);
          const olen = offset.length();
          if (olen > REPEL_MAX) offset.multiplyScalar(REPEL_MAX / olen);
        };

        if (!reduceMotion) {
          integrateWander(archWander, dt, ARCH_BOUNDS, {
            wallPad: 0.38,
            spring: 1.6,
            jitter: 0.07,
          });
        } else {
          archWander.pos.copy(archHome);
          archWander.vel.set(0, 0, 0);
        }
        tmpPos.copy(archWander.pos);
        integrateScatter(
          tmpPos,
          archScatter.offset,
          archScatter.vel,
          archScatter.mass,
          archScatter.radius,
          0.55,
        );
        archPivot.position.set(
          archWander.pos.x + archScatter.offset.x,
          archWander.pos.y + archScatter.offset.y,
          archWander.pos.z + archScatter.offset.z,
        );

        for (let i = 0; i < accents.length; i++) {
          const a = accents[i];
          if (!reduceMotion) {
            integrateWander(a.wander, dt, ACCENT_BOUNDS, {
              wallPad: 0.4,
              spring: 1.9,
              jitter: 0.07,
            });
          } else {
            a.wander.pos.copy(a.base);
            a.wander.vel.set(0, 0, 0);
            a.offset.set(0, 0, 0);
            a.vel.set(0, 0, 0);
          }
        }
        if (quality.enableCollisions && !reduceMotion) {
          resolveGroupCollisions(accentColliders);
        }
        for (let i = 0; i < accents.length; i++) {
          const a = accents[i];
          if (!reduceMotion) {
            tmpPos.copy(a.wander.pos);
            integrateScatter(tmpPos, a.offset, a.vel, a.mass, a.radius, 1);
          } else {
            tmpPos.copy(a.base);
          }
          a.group.position.set(
            tmpPos.x + a.offset.x,
            tmpPos.y + a.offset.y,
            tmpPos.z + a.offset.z,
          );
          a.content.rotation.x = t * a.spin * 0.7;
          a.content.rotation.y = t * a.spin;
          a.group.userData.assembleScale = 0.35 + arch * 0.65;
          const ht = hoverById.get(`accent-${i}`);
          const hoverBoost = ht ? 1 + ht.hover * 1.2 + ht.bounce * 0.6 : 1;
          for (const m of a.mats) {
            m.opacity = (m.userData.baseOpacity as number) * arch;
            m.emissiveIntensity =
              (m.userData.baseEmissive as number) * arch * hoverBoost;
          }
          a.group.visible = arch > 0.05;
        }
      } else {
        archScatter.offset.set(0, 0, 0);
        archScatter.vel.set(0, 0, 0);
        archWander.pos.copy(archHome);
        archWander.vel.set(0, 0, 0);
        archPivot.position.copy(archHome);
        for (const a of accents) {
          a.offset.set(0, 0, 0);
          a.vel.set(0, 0, 0);
          a.wander.pos.copy(a.base);
          a.wander.vel.set(0, 0, 0);
        }
      }

      // Per-element hover (desktop); touch devices skip raycast entirely
      if (quality.enableHover) {
        if (pointer.moved) {
          pointer.moved = false;
          pickHoverTarget();
        }

        for (const ht of hoverTargets) {
          const target = ht.id === activeHoverId ? 1 : 0;
          ht.hover += (target - ht.hover) * Math.min(1, dt * 10);
          ht.bounce *= Math.exp(-dt * 6);
          if (ht.bounce < 0.002) ht.bounce = 0;

          const assemble = (ht.root.userData.assembleScale as number) ?? 1;
          const spring = 1 + ht.hover * 0.14 + Math.sin(ht.bounce * Math.PI) * 0.18;
          const warpX = 1 + ht.hover * 0.05 * Math.sin(t * 6.5);
          const warpY = 1 - ht.hover * 0.03 * Math.sin(t * 6.5);
          ht.root.scale.set(
            assemble * spring * warpX,
            assemble * spring * warpY,
            assemble * spring,
          );

          if (ht.id.startsWith("orb-")) {
            for (const m of ht.mats) {
              const baseEm = (m.userData.baseEmissive as number) ?? 0.14;
              m.emissiveIntensity =
                baseEm * (0.7 + v.nebulaOpacity * 0.6) * (1 + ht.hover * 1.5 + ht.bounce * 0.9);
            }
          }
        }
      } else {
        for (const ht of hoverTargets) {
          const assemble = (ht.root.userData.assembleScale as number) ?? 1;
          ht.root.scale.setScalar(assemble);
        }
      }

      // Camera: gentle per-stage framing — no mouse parallax
      const camX = -0.2 * corr + -0.08 * arch;
      const camY = 0.2 + corr * 0.45 + arch * 0.08;
      const camZ = 6.2 - corr * 0.35 - arch * 0.15;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(corr * -0.05, 0.15 + corr * 0.55, -corr * 3.2 - arch * 0.5);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    const kick = () => {
      if (!running || raf || !canRender()) return;
      lastTs = performance.now();
      skipCounter = 0;
      raf = requestAnimationFrame(frame);
    };

    const UI_SELECTOR = "a,button,input,textarea,select,label,[role='button']";

    const onPointer = (e: PointerEvent) => {
      if (!wantsPointer) return;
      noteInteract();
      const host = mountHolder.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      pointer.nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const target = e.target as Element | null;
      pointer.overUi = !!(target && target.closest(UI_SELECTOR));
      // Scatter while over ritual viewport (including content panels) — not only bare canvas
      pointer.inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      pointer.moved = true;
    };

    const onTouchWake = () => {
      noteInteract();
      kick();
    };

    const onPointerLeaveDoc = () => {
      pointer.inside = false;
    };

    const onVis = () => {
      tabVisible = document.visibilityState === "visible";
      if (tabVisible) kick();
      else {
        pointer.inside = false;
        setCursor(false);
      }
    };

    const syncIntroGate = () => {
      introCovering = document.documentElement.dataset.intro === "wait";
      if (!introCovering) kick();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const introObserver = new MutationObserver(syncIntroGate);
    introObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-intro"],
    });

    let viewObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      viewObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          stageInView = Boolean(entry?.isIntersecting && (entry.intersectionRatio ?? 0) > 0.05);
          if (stageInView) kick();
          else {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { threshold: [0, 0.05, 0.2] },
      );
    }

    const attach = (el: HTMLElement) => {
      mountHolder.current = el;
      if (renderer.domElement.parentElement !== el) {
        el.appendChild(renderer.domElement);
      }
      viewObserver?.disconnect();
      viewObserver?.observe(el);
      stageInView = true;
      syncIntroGate();
      resize();
      kick();
    };

    const detach = () => {
      viewObserver?.disconnect();
      const host = mountHolder.current;
      if (host && renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
      mountHolder.current = null;
      pointer.inside = false;
      setCursor(false);
    };

    const dispose = () => {
      running = false;
      cancelAnimationFrame(raf);
      setCursor(false);
      introObserver.disconnect();
      viewObserver?.disconnect();
      window.removeEventListener("resize", resize);
      if (wantsPointer) {
        window.removeEventListener("pointermove", onPointer);
        document.documentElement.removeEventListener("mouseleave", onPointerLeaveDoc);
      }
      if (quality.isMobile) {
        window.removeEventListener("touchstart", onTouchWake);
      }
      document.removeEventListener("visibilitychange", onVis);
      for (const g of disposables) g.dispose();
      for (const m of materials) m.dispose();
      figurePool.dispose();
      glowTex?.dispose();
      envMap?.dispose();
      renderer.dispose();
      const host = mountHolder.current;
      if (host && renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
      mountHolder.current = null;
    };

    sharedHandle = { attach, detach, dispose };

    window.addEventListener("resize", resize, { passive: true });
    if (wantsPointer) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("mouseleave", onPointerLeaveDoc);
    }
    if (quality.isMobile) {
      window.addEventListener("touchstart", onTouchWake, { passive: true });
    }
    document.addEventListener("visibilitychange", onVis);
    // First mount: attach wires IO + resize + kick (keeps locale remount path identical)
    attach(mount);

    return () => {
      sharedHandle?.detach();
      keepAliveTimer = setTimeout(() => {
        sharedHandle?.dispose();
        sharedHandle = null;
        keepAliveTimer = null;
      }, STAGE_KEEPALIVE_MS);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="ritual-stage-scene"
      aria-hidden="true"
      data-stage={stage}
    />
  );
}
