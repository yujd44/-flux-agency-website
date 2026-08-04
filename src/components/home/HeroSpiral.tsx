"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

type SpiralParams = {
  turns: number;
  height: number;
  width: number;
  thickness: number;
  segments: number;
  /** Radial samples around the solid stadium cross-section. */
  profile: number;
};

/**
 * Sculptural spiral — organic non-uniform winding matching the reference:
 * wide open top arc, tighter nearly-horizontal mid-left fold, large floor loop.
 */
const SPIRAL: SpiralParams = {
  turns: 2.68,
  height: 4.4,
  width: 0.35,
  thickness: 0.05,
  segments: 820,
  profile: 40,
};

const _center = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _radial = new THREE.Vector3();
const _binormal = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _prev = new THREE.Vector3();
const _next = new THREE.Vector3();

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Organic radius envelope:
 * — large circular resting base
 * — outward mid-left projection (acute horizontal fold)
 * — open graceful arc near the tip
 */
function radiusAt(t: number) {
  const u = THREE.MathUtils.clamp(t, 0, 1);
  const floorR = 1.52;

  // Base coil — full, almost circular
  const base = floorR * (1 - 0.1 * smoothstep(0.1, 0.32, u));
  // Mid-left fold — tighter, projects outward
  const midFold = 0.62 * Math.exp(-Math.pow((u - 0.4) / 0.11, 2));
  // Upper open arc — wide graceful sweep
  const topOpen = 0.48 * Math.exp(-Math.pow((u - 0.78) / 0.18, 2));
  // Soft secondary belly between fold and tip
  const belly = 0.22 * Math.exp(-Math.pow((u - 0.58) / 0.16, 2));
  // Gentle organic wobble (not mechanical)
  const organic = 0.055 * Math.sin(u * Math.PI * 3.05 + 0.55);

  const tipTaper = lerp(1, 0.94, smoothstep(0.9, 1, u));
  const r = (base + midFold + topOpen + belly) * tipTaper + organic;
  // Blend into a true circular resting radius for the first ~12% of the path
  const floorBlend = 1 - smoothstep(0, 0.13, u);
  return lerp(r, floorR, floorBlend * 0.92);
}

/**
 * Vertical profile — near-zero pitch on the floor coil,
 * flattened mid band for the horizontal fold, then elegant rise into the open tip.
 */
function heightAt(t: number, height: number) {
  const u = THREE.MathUtils.clamp(t, 0, 1);

  // Piecewise cumulative height fraction → [0, 1]
  // 0–0.14: floor hold (~6%)
  // 0.14–0.36: rise toward fold (~28%)
  // 0.36–0.52: nearly flat horizontal fold (~34%)
  // 0.52–0.86: sweeping climb (~84%)
  // 0.86–1.0: open top arc (~100%)
  const keys = [
    { t: 0, h: 0 },
    { t: 0.14, h: 0.055 },
    { t: 0.36, h: 0.28 },
    { t: 0.52, h: 0.345 },
    { t: 0.72, h: 0.62 },
    { t: 0.86, h: 0.84 },
    { t: 1, h: 1 },
  ];

  let shaped = 1;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (u <= b.t || i === keys.length - 2) {
      const local = smoothstep(a.t, b.t, u);
      shaped = lerp(a.h, b.h, local);
      break;
    }
  }

  // Remap so t=0 → -h/2 (floor), t=1 → +h/2
  return (shaped - 0.5) * height;
}

function angleAt(t: number, turns: number) {
  const u = THREE.MathUtils.clamp(t, 0, 1);
  // Denser winding near the resting base + mid-left fold; looser open top
  const densify =
    1 +
    0.14 * (1 - smoothstep(0, 0.18, u)) +
    0.1 * Math.exp(-Math.pow((u - 0.42) / 0.12, 2)) -
    0.08 * Math.exp(-Math.pow((u - 0.8) / 0.2, 2));
  return u * turns * Math.PI * 2 * densify;
}

function centerAt(t: number, p: SpiralParams, out: THREE.Vector3) {
  const angle = angleAt(t, p.turns);
  const r = radiusAt(t);
  const y = heightAt(t, p.height);
  return out.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
}

/** Path frame via finite differences — stable for non-uniform winding. */
function frameAt(t: number, p: SpiralParams) {
  const eps = 1 / Math.max(256, p.segments);
  const t0 = Math.max(0, t - eps);
  const t1 = Math.min(1, t + eps);

  centerAt(t, p, _center);
  centerAt(t0, p, _prev);
  centerAt(t1, p, _next);

  _tangent.copy(_next).sub(_prev);
  if (_tangent.lengthSq() < 1e-10) {
    _tangent.set(0, 1, 0);
  } else {
    _tangent.normalize();
  }

  const angle = angleAt(t, p.turns);
  _radial.set(Math.cos(angle), 0, Math.sin(angle));
  _binormal.crossVectors(_tangent, _radial);
  if (_binormal.lengthSq() < 1e-8) {
    _binormal.set(0, 1, 0);
  } else {
    _binormal.normalize();
  }
  _normal.crossVectors(_binormal, _tangent).normalize();
  _binormal.crossVectors(_tangent, _normal).normalize();

  return {
    center: _center,
    tangent: _tangent,
    binormal: _binormal,
    normal: _normal,
  };
}

/**
 * Anodized metallic base tint — deep indigo → magenta/hot pink → peach/gold.
 * Specular warmth also comes from softbox lights + iridescence.
 */
const GRADIENT_STOPS: { t: number; hex: string }[] = [
  { t: 0, hex: "#1e1038" }, // deep indigo resting coil
  { t: 0.12, hex: "#3f1a72" }, // royal purple
  { t: 0.26, hex: "#8a2488" }, // magenta-violet
  { t: 0.4, hex: "#d0327c" }, // hot pink
  { t: 0.52, hex: "#ea5c52" }, // coral / peach bloom
  { t: 0.64, hex: "#f2a858" }, // soft gold highlight
  { t: 0.76, hex: "#c84890" }, // magenta return
  { t: 0.9, hex: "#522878" }, // amethyst
  { t: 1, hex: "#242050" }, // midnight tip
];

const _gradB = new THREE.Color();
const _warmLift = new THREE.Color("#ffb078");

function brandGradient(t: number, out: THREE.Color) {
  const u = THREE.MathUtils.clamp(t, 0, 1);
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const a = GRADIENT_STOPS[i];
    const b = GRADIENT_STOPS[i + 1];
    if (u <= b.t || i === GRADIENT_STOPS.length - 2) {
      const local = (u - a.t) / Math.max(1e-6, b.t - a.t);
      return out.set(a.hex).lerp(_gradB.set(b.hex), local);
    }
  }
  return out.set(GRADIENT_STOPS[GRADIENT_STOPS.length - 1].hex);
}

/**
 * Closed stadium (capsule) profile — constant width/thickness, rounded ends.
 */
function stadiumProfile(hw: number, ht: number, samples: number): [number, number][] {
  const r = Math.min(ht * 0.98, hw * 0.32);
  const flat = Math.max(0, hw - r);
  const half = Math.max(8, Math.ceil(samples / 2));
  const pts: [number, number][] = [];

  for (let i = 0; i <= half; i++) {
    const a = -Math.PI / 2 + (i / half) * Math.PI;
    pts.push([flat + Math.cos(a) * r, Math.sin(a) * r]);
  }
  for (let i = 0; i <= half; i++) {
    const a = Math.PI / 2 + (i / half) * Math.PI;
    pts.push([-flat + Math.cos(a) * r, Math.sin(a) * r]);
  }
  return pts;
}

/**
 * Solid sculptural ribbon — dense stadium sweep, capped ends, smooth normals.
 */
function buildRibbonGeometry(p: SpiralParams) {
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const tint = new THREE.Color();
  const face = new THREE.Color();
  const deepBase = new THREE.Color("#140c22");
  const edgeLift = new THREE.Color("#e080a0");

  const hw = p.width * 0.5;
  const ht = p.thickness * 0.5;
  const profile = stadiumProfile(hw, ht, p.profile);
  const ring = profile.length;

  for (let i = 0; i <= p.segments; i++) {
    const t = i / p.segments;
    brandGradient(t, tint);
    const { center, binormal, normal } = frameAt(t, p);

    // Warm anodized bloom strongest on the lit mid-body coils
    const warmZone = Math.exp(-Math.pow((t - 0.56) / 0.2, 2));
    tint.lerp(_warmLift, warmZone * 0.26);

    for (let c = 0; c < ring; c++) {
      const [u, v] = profile[c];
      _pos
        .copy(center)
        .addScaledVector(binormal, u)
        .addScaledVector(normal, v);
      positions.push(_pos.x, _pos.y, _pos.z);

      const across = (u / hw + 1) * 0.5;
      const edge = Math.pow(Math.abs(u) / hw, 2.2);
      face.copy(deepBase).lerp(tint, 0.9 + across * 0.05);
      face.lerp(edgeLift, edge * 0.08);
      // Outer face catches more peach/gold
      if (u > 0) {
        face.lerp(_warmLift, warmZone * 0.12 * (u / hw));
      }
      const lift = 0.95 + Math.max(0, v / ht) * 0.07;
      colors.push(face.r * lift, face.g * lift, face.b * lift);
      uvs.push(t * p.turns, c / ring);
    }

    if (i < p.segments) {
      const a = i * ring;
      const b = a + ring;
      for (let e = 0; e < ring; e++) {
        const e1 = (e + 1) % ring;
        indices.push(a + e, a + e1, b + e, a + e1, b + e1, b + e);
      }
    }
  }

  // Solid end caps so the volume never reads hollow
  const startCenter = positions.length / 3;
  {
    const { center } = frameAt(0, p);
    brandGradient(0, tint);
    face.copy(deepBase).lerp(tint, 0.92);
    positions.push(center.x, center.y, center.z);
    colors.push(face.r, face.g, face.b);
    uvs.push(0, 0.5);
    for (let e = 0; e < ring; e++) {
      const e1 = (e + 1) % ring;
      indices.push(startCenter, e1, e);
    }
  }
  const endCenter = positions.length / 3;
  {
    const { center } = frameAt(1, p);
    brandGradient(1, tint);
    face.copy(deepBase).lerp(tint, 0.92);
    positions.push(center.x, center.y, center.z);
    colors.push(face.r, face.g, face.b);
    uvs.push(p.turns, 0.5);
    const base = p.segments * ring;
    for (let e = 0; e < ring; e++) {
      const e1 = (e + 1) % ring;
      indices.push(endCenter, base + e, base + e1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

type SoftboxAsset = { geo: THREE.BufferGeometry; mat: THREE.Material };

/**
 * Softbox studio env for PMREM — large elongated specular windows, no harsh sparks.
 */
function makeStudioEnv(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x08090e);

  envScene.add(new THREE.HemisphereLight(0xf2ebe4, 0x1a1428, 0.55));

  const disposables: SoftboxAsset[] = [];
  const addSoftbox = (
    w: number,
    h: number,
    color: number,
    intensity: number,
    x: number,
    y: number,
    z: number,
    lookX: number,
    lookY: number,
    lookZ: number,
  ) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.lookAt(lookX, lookY, lookZ);
    envScene.add(mesh);
    disposables.push({ geo, mat });
  };

  // Key softbox — warm cream, elongated (drives gold/peach speculars)
  addSoftbox(7.5, 3.2, 0xfff2e8, 2.7, 5.2, 5.8, 4.0, 0, 0.2, 0);
  // Fill softbox — cool lavender
  addSoftbox(5.5, 4.0, 0xe8dff8, 1.3, -4.8, 2.4, 3.6, 0.4, 0, 0);
  // Magenta rim panel
  addSoftbox(4.2, 5.5, 0xff6aaa, 1.85, 1.2, 1.0, -5.5, 0.5, 0.3, 0);
  // Amber / peach accent strip — key for anodized warmth
  addSoftbox(3.4, 1.6, 0xffb070, 2.35, 3.8, -0.4, 2.2, 0.2, 0.4, 0);
  // Cool cyan reflection only — very soft
  addSoftbox(2.4, 2.0, 0xa8d4e8, 0.45, -2.2, 3.5, -3.8, 0.3, 0.5, 0);
  // Top skylight
  addSoftbox(6.0, 6.0, 0xf8f4ff, 0.8, 0.5, 7.2, 0.5, 0.5, 0, 0.5);
  // Floor bounce panel — soft violet from below
  addSoftbox(5.0, 5.0, 0x6b3fa0, 0.6, 0.5, -4.5, 0.5, 0.5, 0, 0.5);

  const amb = new THREE.AmbientLight(0xb8a8c8, 0.2);
  envScene.add(amb);

  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  for (const d of disposables) {
    d.geo.dispose();
    d.mat.dispose();
  }
  pmrem.dispose();
  return envMap;
}

/**
 * Tint emissive by vertex color. three@0.185+ exposes vColor as vec4 —
 * must use .rgb when multiplying into totalEmissiveRadiance (vec3).
 */
function tintEmissiveByVertexColor(material: THREE.MeshPhysicalMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
#ifdef USE_COLOR
  totalEmissiveRadiance *= vColor.rgb;
#endif`,
    );
  };
  material.needsUpdate = true;
}

/**
 * Dedicated WebGL spiral — museum-grade anodized titanium ribbon.
 * Resource-aware: capped DPR, soft shadows, pauses off-screen / reduced-motion.
 */
export default function HeroSpiral() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFailed(true);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      setFailed(true);
      return;
    }

    RectAreaLightUniformsLib.init();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.2, 60);
    camera.position.set(3.9, 0.52, 5.65);
    camera.lookAt(1.55, -0.15, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
    });

    const envMap = makeStudioEnv(renderer);
    scene.environment = envMap;

    const group = new THREE.Group();
    group.position.set(1.62, -0.18, 0);
    const baseTiltX = -0.3;
    const baseTiltZ = 0.16;
    group.rotation.x = baseTiltX;
    group.rotation.z = baseTiltZ;
    scene.add(group);

    const ribbonGeo = buildRibbonGeometry(SPIRAL);
    const ribbonMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f4eef8"),
      // Satin anodized titanium + multilayer clearcoat
      roughness: 0.28,
      metalness: 0.82,
      clearcoat: 0.78,
      clearcoatRoughness: 0.18,
      ior: 1.5,
      sheen: 0.32,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color("#b060b8"),
      iridescence: 0.7,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [160, 540],
      flatShading: false,
      vertexColors: true,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.055,
      envMap,
      envMapIntensity: 1.25,
      side: THREE.FrontSide,
    });
    tintEmissiveByVertexColor(ribbonMat);
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.castShadow = true;
    ribbon.receiveShadow = true;
    group.add(ribbon);

    // Blurred floor reflection — mirrored ribbon, soft & dark (stays in group → rotates coherently)
    const reflectionMat = ribbonMat.clone();
    reflectionMat.transparent = true;
    reflectionMat.opacity = 0.24;
    reflectionMat.depthWrite = false;
    reflectionMat.roughness = 0.55;
    reflectionMat.metalness = 0.55;
    reflectionMat.clearcoat = 0.2;
    reflectionMat.envMapIntensity = 0.35;
    reflectionMat.emissiveIntensity = 0.02;
    reflectionMat.iridescence = 0.25;
    tintEmissiveByVertexColor(reflectionMat);
    const reflection = new THREE.Mesh(ribbonGeo, reflectionMat);
    reflection.scale.y = -1;
    reflection.position.y = -SPIRAL.height;
    reflection.castShadow = false;
    reflection.receiveShadow = false;
    reflection.renderOrder = -1;
    group.add(reflection);

    // Floor Y in group-local space (ribbon rests near y = -height/2)
    const floorLocalY = -SPIRAL.height * 0.5;
    // World floor under the sculpture (account for group.position.y)
    const floorY = group.position.y + floorLocalY;

    // Floor + contact glow live in a pivot that shares Y rotation with the ribbon
    // so the magenta pool stays under the base coil as it turns.
    const floorPivot = new THREE.Group();
    floorPivot.position.set(1.62, 0, 0);
    scene.add(floorPivot);

    const floorGeo = new THREE.CircleGeometry(4.2, 80);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#06080e"),
      metalness: 0.72,
      roughness: 0.28,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45,
      transparent: true,
      opacity: 0.62,
      envMap,
      envMapIntensity: 0.55,
      depthWrite: false,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, floorY, 0.15);
    floor.receiveShadow = true;
    floorPivot.add(floor);

    const shadowCatcherGeo = new THREE.CircleGeometry(3.2, 64);
    const shadowCatcherMat = new THREE.ShadowMaterial({
      opacity: 0.38,
    });
    const shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.set(0, floorY + 0.002, 0.15);
    shadowCatcher.receiveShadow = true;
    floorPivot.add(shadowCatcher);

    // Soft purple contact glow under the resting coil
    const glowGeo = new THREE.CircleGeometry(2.8, 56);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#6b3fa0"),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0.03, floorY + 0.006, 0.12);
    floorPivot.add(glow);

    const warmGlowGeo = new THREE.CircleGeometry(1.7, 44);
    const warmGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c04888"),
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warmGlow = new THREE.Mesh(warmGlowGeo, warmGlowMat);
    warmGlow.rotation.x = -Math.PI / 2;
    warmGlow.position.set(0.16, floorY + 0.01, -0.05);
    floorPivot.add(warmGlow);

    // Soft elliptical contact blot — denser under the base ring
    const contactGeo = new THREE.CircleGeometry(1.55, 40);
    const contactMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#1a1028"),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const contact = new THREE.Mesh(contactGeo, contactMat);
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(0.08, floorY + 0.004, 0.05);
    contact.scale.set(1.15, 1, 0.85);
    floorPivot.add(contact);

    // —— Cinematic studio lighting ——
    const hemi = new THREE.HemisphereLight(0xf0ebe6, 0x1c1430, 0.4);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xa8a0c0, 0.16);
    scene.add(ambient);

    const keyArea = new THREE.RectAreaLight(0xfff0e6, 4.6, 5.5, 2.4);
    keyArea.position.set(4.0, 5.2, 3.6);
    keyArea.lookAt(1.6, 0.1, 0);
    scene.add(keyArea);

    const fillArea = new THREE.RectAreaLight(0xe4d8f4, 1.7, 4.0, 3.2);
    fillArea.position.set(-3.6, 2.0, 3.2);
    fillArea.lookAt(1.6, 0, 0.2);
    scene.add(fillArea);

    const rimArea = new THREE.RectAreaLight(0xff6aaa, 2.9, 2.8, 4.5);
    rimArea.position.set(1.4, 1.0, -4.2);
    rimArea.lookAt(1.6, 0.1, 0);
    scene.add(rimArea);

    const amberArea = new THREE.RectAreaLight(0xffb070, 2.7, 2.4, 1.2);
    amberArea.position.set(3.4, -0.1, 2.0);
    amberArea.lookAt(1.6, 0.2, 0);
    scene.add(amberArea);

    const key = new THREE.DirectionalLight(0xfff4ea, 0.52);
    key.position.set(4.2, 5.5, 3.8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 22;
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.bias = -0.00035;
    key.shadow.normalBias = 0.025;
    key.shadow.radius = 7;
    scene.add(key);

    const rimLight = new THREE.DirectionalLight(0xd070b0, 0.32);
    rimLight.position.set(1.5, 1.2, -4);
    scene.add(rimLight);

    const bounce = new THREE.PointLight(0x8b5cf6, 0.48, 9, 2);
    bounce.position.set(1.7, floorY + 0.4, 1.1);
    scene.add(bounce);

    const warmBounce = new THREE.PointLight(0xe87850, 0.4, 8, 2);
    warmBounce.position.set(2.0, 0.55, -1.15);
    scene.add(warmBounce);

    // Living reflections — extremely slow drift, not mechanical orbit
    const wander = new THREE.PointLight(0xffe4d4, 0.4, 10, 2);
    wander.position.set(3.2, 2.4, 2.8);
    scene.add(wander);

    const wanderCool = new THREE.PointLight(0xc8b0f0, 0.28, 9, 2);
    wanderCool.position.set(0.4, 1.2, 3.5);
    scene.add(wanderCool);

    let visible = true;
    let raf = 0;
    let last = performance.now();
    const clock = { t: 0 };

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          last = performance.now();
          if (!raf) raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.05 },
    );
    io.observe(mount);

    const onVisibility = () => {
      if (document.hidden) {
        visible = false;
      } else if (mount.getBoundingClientRect().height > 0) {
        visible = true;
        last = performance.now();
        if (!raf) raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const tick = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock.t += dt;

      // Slow elegant Y turn — camera static; floor pivot tracks Y so reflection stays coherent
      const ease = clock.t * 0.036;
      group.rotation.y = ease;
      floorPivot.rotation.y = ease;
      // Barely-there sculptural breath on tilt only (no vertical bob → floor contact stays locked)
      group.rotation.x = baseTiltX + Math.sin(clock.t * 0.15) * 0.008;
      group.rotation.z = baseTiltZ + Math.sin(clock.t * 0.12 + 0.8) * 0.004;

      const a = clock.t * 0.12;
      wander.position.set(
        1.62 + Math.cos(a) * 2.5,
        1.9 + Math.sin(a * 0.6) * 0.75,
        Math.sin(a * 0.85) * 2.3,
      );
      const b = clock.t * 0.09 + 1.9;
      wanderCool.position.set(
        1.62 + Math.cos(b) * 2.0,
        0.7 + Math.sin(b * 0.85) * 0.65,
        Math.sin(b) * 2.1,
      );

      glowMat.opacity = 0.17 + Math.sin(clock.t * 0.26) * 0.03;
      warmGlowMat.opacity = 0.12 + Math.sin(clock.t * 0.2 + 1.2) * 0.025;
      contactMat.opacity = 0.32 + Math.sin(clock.t * 0.16) * 0.035;
      reflectionMat.opacity = 0.2 + Math.sin(clock.t * 0.18) * 0.025;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      ribbonGeo.dispose();
      ribbonMat.dispose();
      reflectionMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      shadowCatcherGeo.dispose();
      shadowCatcherMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      warmGlowGeo.dispose();
      warmGlowMat.dispose();
      contactGeo.dispose();
      contactMat.dispose();
      envMap.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (failed) {
    return (
      <div className="hero-ribbon-mask absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-concrete-ribbon-dark.png"
          alt=""
          className="h-full w-full object-contain object-right object-bottom"
        />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="hero-spiral-stage absolute inset-0"
      aria-hidden="true"
    />
  );
}
