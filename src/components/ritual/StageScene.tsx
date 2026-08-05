"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { StageId } from "./StageRail";

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
  },
  realization: {
    nebulaOpacity: 0.55,
    nebulaSpread: 1.25,
    networkOpacity: 0.95,
    networkScale: 1.08,
    networkSide: 0.85,
    panelsOpacity: 1,
    panelsSpread: 1.1,
    hubGlow: 1,
    particleLink: 0.9,
    tintMix: 0.4,
  },
  future: {
    nebulaOpacity: 0.65,
    nebulaSpread: 1.35,
    networkOpacity: 0.28,
    networkScale: 0.72,
    networkSide: 0,
    panelsOpacity: 0.55,
    panelsSpread: 1.2,
    hubGlow: 0.45,
    particleLink: 0.2,
    tintMix: 0.7,
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
  envScene.add(new THREE.HemisphereLight(0xe8f0ff, 0x120818, 0.55));

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

  addSoftbox(5.5, 2.4, 0xc8e8ff, 2.6, 4.8, 3.2, 3.4);
  addSoftbox(3.2, 3.8, 0xb090ff, 1.8, -4.2, 1.6, 2.8);
  addSoftbox(4.0, 4.0, 0x60ffe0, 1.4, 1.2, 0.4, -4.6);
  addSoftbox(4.5, 4.5, 0xf0f4ff, 0.7, 0.2, 5.5, 0.6);
  envScene.add(new THREE.AmbientLight(0x8890b0, 0.2));

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
  };
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

/**
 * Single shared WebGL layer for ritual stages.
 * Real MeshPhysical nodes + cylinder fibers + thick glass panels + cinematic lights.
 * Moderate counts, DPR capped, paused when hidden.
 */
export default function StageScene({ stage }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(0, 0.15, 6.2);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    // No shadow maps — multi-object scene stays light on GPU
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
    });

    const envMap = makeStudioEnv(renderer);
    scene.environment = envMap;

    const glowTex = makeGlowTexture();
    const root = new THREE.Group();
    scene.add(root);

    // —— Cinematic lights (world-fixed; parallax moves root/camera) ——
    const hemi = new THREE.HemisphereLight(0xdce8ff, 0x100818, 0.42);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0x6a78a8, 0.18);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xe8f4ff, 1.15);
    key.position.set(4.2, 3.8, 5.0);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xa090ff, 0.45);
    fill.position.set(-3.6, 1.4, 2.8);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x50ffe0, 0.55);
    rim.position.set(0.6, 1.2, -4.2);
    scene.add(rim);

    const hubLight = new THREE.PointLight(0x60ffc0, 1.4, 6, 2);
    hubLight.position.set(1.5, 0.2, 0.4);
    scene.add(hubLight);

    const accentLight = new THREE.PointLight(0x9060ff, 0.7, 7, 2);
    accentLight.position.set(-1.2, 0.6, 1.2);
    scene.add(accentLight);

    // Shared geometries (dispose on cleanup)
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const fiberGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
    const orbGeo = new THREE.SphereGeometry(1, 16, 12);
    const hubCoreGeo = new THREE.SphereGeometry(0.12, 20, 16);
    const hubShellGeo = new THREE.IcosahedronGeometry(0.2, 1);
    const hubDotGeo = new THREE.SphereGeometry(0.032, 10, 8);
    const disposables: THREE.BufferGeometry[] = [
      boxGeo,
      edgesGeo,
      fiberGeo,
      orbGeo,
      hubCoreGeo,
      hubShellGeo,
      hubDotGeo,
    ];
    const materials: THREE.Material[] = [];

    // --- 1) Nebula / particle field ---
    const PARTICLE_COUNT = 160;
    const ORB_COUNT = 12;
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
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: glowTex ?? undefined,
    });
    materials.push(nebulaMat);
    const nebula = new THREE.Points(nebulaGeo, nebulaMat);
    root.add(nebula);

    // Soft glowing mesh orbs (true spheres, not only sprites)
    const orbGroup = new THREE.Group();
    root.add(orbGroup);
    type OrbItem = {
      mesh: THREE.Mesh;
      mat: THREE.MeshPhysicalMaterial;
      base: THREE.Vector3;
      phase: number;
      pulse: number;
    };
    const orbs: OrbItem[] = [];
    for (let i = 0; i < ORB_COUNT; i++) {
      const tint = i % 2 === 0 ? CYAN : PURPLE;
      const mat = new THREE.MeshPhysicalMaterial({
        color: tint.clone().multiplyScalar(0.35),
        emissive: tint,
        emissiveIntensity: 0.55,
        roughness: 0.55,
        metalness: 0.05,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        envMap,
        envMapIntensity: 0.4,
      });
      materials.push(mat);
      const mesh = new THREE.Mesh(orbGeo, mat);
      const a = Math.random() * Math.PI * 2;
      const r = 1.1 + Math.random() * 2.6;
      const base = new THREE.Vector3(
        Math.cos(a) * r - 0.55,
        Math.sin(a) * r * 0.5,
        -1.0 - Math.random() * 2.2,
      );
      mesh.position.copy(base);
      const s = 0.12 + Math.random() * 0.28;
      mesh.scale.setScalar(s);
      orbGroup.add(mesh);
      orbs.push({
        mesh,
        mat,
        base: base.clone(),
        phase: Math.random() * Math.PI * 2,
        pulse: 0.4 + Math.random() * 0.5,
      });
    }

    // Connected particle web (subset) — thin additive lines for atmosphere
    const LINK_COUNT = 40;
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

    // --- 2) Network architecture (real boxes + cylinder fibers) ---
    const network = new THREE.Group();
    root.add(network);

    type NodeItem = {
      group: THREE.Group;
      body: THREE.Mesh;
      bodyMat: THREE.MeshPhysicalMaterial;
      edgeMat: THREE.LineBasicMaterial;
      base: THREE.Vector3;
      size: number;
      phase: number;
      spin: number;
      assembleDelay: number;
      isHub: boolean;
      accent: THREE.Color;
    };
    const nodes: NodeItem[] = [];
    const nodeDefs: {
      p: THREE.Vector3;
      s: number;
      kind: "hub" | "glass" | "metal" | "accent";
    }[] = [
      { p: new THREE.Vector3(0, 0, 0), s: 0.3, kind: "hub" },
      { p: new THREE.Vector3(0.85, 0.55, 0.2), s: 0.17, kind: "glass" },
      { p: new THREE.Vector3(1.1, -0.35, -0.15), s: 0.15, kind: "metal" },
      { p: new THREE.Vector3(0.35, -0.75, 0.35), s: 0.13, kind: "accent" },
      { p: new THREE.Vector3(-0.55, 0.65, -0.25), s: 0.14, kind: "glass" },
      { p: new THREE.Vector3(-0.9, -0.2, 0.3), s: 0.16, kind: "metal" },
      { p: new THREE.Vector3(0.15, 0.95, -0.4), s: 0.12, kind: "glass" },
      { p: new THREE.Vector3(1.45, 0.15, 0.45), s: 0.11, kind: "metal" },
      { p: new THREE.Vector3(-0.25, -0.55, -0.5), s: 0.13, kind: "glass" },
      { p: new THREE.Vector3(0.65, 0.15, -0.65), s: 0.11, kind: "accent" },
      { p: new THREE.Vector3(-1.15, 0.35, 0.1), s: 0.12, kind: "metal" },
      { p: new THREE.Vector3(0.4, -0.15, 0.7), s: 0.1, kind: "glass" },
      { p: new THREE.Vector3(0.95, 0.85, -0.3), s: 0.09, kind: "metal" },
      { p: new THREE.Vector3(-0.7, -0.7, 0.15), s: 0.1, kind: "glass" },
    ];

    nodeDefs.forEach((def, i) => {
      const group = new THREE.Group();
      group.position.copy(def.p);
      network.add(group);

      const accent =
        def.kind === "accent" || def.kind === "hub"
          ? GREEN.clone()
          : def.kind === "glass"
            ? PURPLE.clone()
            : METAL.clone();

      let body: THREE.Mesh;
      let bodyMat: THREE.MeshPhysicalMaterial;

      if (def.kind === "hub") {
        // Inner emissive core + glass shell
        const coreMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color("#e8fff4"),
          emissive: GREEN,
          emissiveIntensity: 1.2,
          roughness: 0.25,
          metalness: 0.2,
          envMap,
          envMapIntensity: 0.8,
        });
        materials.push(coreMat);
        const core = new THREE.Mesh(hubCoreGeo, coreMat);
        group.add(core);

        bodyMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color("#b8ffe8"),
          emissive: GREEN,
          emissiveIntensity: 0.25,
          roughness: 0.12,
          metalness: 0.35,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          transparent: true,
          opacity: 0.42,
          // Avoid transmission — expensive & unstable on many devices
          depthWrite: false,
          envMap,
          envMapIntensity: 1.6,
          side: THREE.DoubleSide,
        });
        materials.push(bodyMat);
        body = new THREE.Mesh(hubShellGeo, bodyMat);
        group.add(body);

        // Outer cube cage for architectural read
        const cageMat = new THREE.MeshPhysicalMaterial({
          color: METAL,
          emissive: GREEN,
          emissiveIntensity: 0.08,
          roughness: 0.22,
          metalness: 0.85,
          clearcoat: 0.6,
          clearcoatRoughness: 0.2,
          transparent: true,
          opacity: 0.22,
          envMap,
          envMapIntensity: 1.2,
        });
        materials.push(cageMat);
        const cage = new THREE.Mesh(boxGeo, cageMat);
        cage.scale.setScalar(def.s * 1.15);
        group.add(cage);
      } else if (def.kind === "glass") {
        bodyMat = new THREE.MeshPhysicalMaterial({
          color: PURPLE.clone().lerp(NAVY, 0.35),
          emissive: PURPLE,
          emissiveIntensity: 0.18,
          roughness: 0.14,
          metalness: 0.45,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          transparent: true,
          opacity: 0.48,
          envMap,
          envMapIntensity: 1.35,
          side: THREE.FrontSide,
        });
        materials.push(bodyMat);
        body = new THREE.Mesh(boxGeo, bodyMat);
        body.scale.setScalar(def.s);
        group.add(body);
      } else if (def.kind === "accent") {
        bodyMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color("#d8fff0"),
          emissive: GREEN,
          emissiveIntensity: 0.45,
          roughness: 0.2,
          metalness: 0.7,
          clearcoat: 0.85,
          clearcoatRoughness: 0.15,
          transparent: true,
          opacity: 0.72,
          envMap,
          envMapIntensity: 1.25,
        });
        materials.push(bodyMat);
        body = new THREE.Mesh(boxGeo, bodyMat);
        body.scale.setScalar(def.s);
        group.add(body);
      } else {
        bodyMat = new THREE.MeshPhysicalMaterial({
          color: METAL,
          emissive: CYAN,
          emissiveIntensity: 0.08,
          roughness: 0.28,
          metalness: 0.92,
          clearcoat: 0.7,
          clearcoatRoughness: 0.18,
          transparent: true,
          opacity: 0.88,
          envMap,
          envMapIntensity: 1.4,
        });
        materials.push(bodyMat);
        body = new THREE.Mesh(boxGeo, bodyMat);
        body.scale.setScalar(def.s);
        group.add(body);
      }

      const edgeMat = new THREE.LineBasicMaterial({
        color: accent.clone().lerp(new THREE.Color("#ffffff"), 0.45),
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      });
      materials.push(edgeMat);
      const edges = new THREE.LineSegments(edgesGeo, edgeMat);
      edges.scale.setScalar(def.s * (def.kind === "hub" ? 1.18 : 1.02));
      group.add(edges);

      bodyMat.userData.baseOpacity = bodyMat.opacity;
      bodyMat.userData.baseEmissive = bodyMat.emissiveIntensity;
      edgeMat.userData.baseOpacity = edgeMat.opacity;

      nodes.push({
        group,
        body,
        bodyMat,
        edgeMat,
        base: def.p.clone(),
        size: def.s,
        phase: Math.random() * Math.PI * 2,
        spin: 0.12 + Math.random() * 0.32,
        assembleDelay: i * 0.04,
        isHub: def.kind === "hub",
        accent,
      });
    });

    // Fiber tubes between nodes (shared cylinder geo, per-fiber materials)
    const fiberPairs: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 9],
      [0, 11],
      [0, 12],
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
    ];

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
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.8,
        clearcoat: 0.5,
        transparent: true,
        opacity: 0.75,
        envMap,
        envMapIntensity: 0.9,
      });
      materials.push(mat);
      const mesh = new THREE.Mesh(fiberGeo, mat);
      network.add(mesh);

      const glowMat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? GREEN : CYAN,
        transparent: true,
        opacity: 0.12,
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

    // Hub orbital ring
    const hubRing = new THREE.Group();
    network.add(hubRing);
    const hubDotMats: THREE.MeshPhysicalMaterial[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        emissive: GREEN,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.7,
        envMap,
        envMapIntensity: 1,
      });
      materials.push(mat);
      hubDotMats.push(mat);
      const dot = new THREE.Mesh(hubDotGeo, mat);
      dot.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0.06);
      hubRing.add(dot);
    }
    const hubRingCurve = new THREE.EllipseCurve(0, 0, 0.58, 0.58, 0, Math.PI * 2, false, 0);
    const hubRingPts = hubRingCurve.getPoints(48).map((p) => new THREE.Vector3(p.x, p.y, 0.06));
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

    // Soft hub glow sprite (bloom hint without postprocessing)
    const hubGlowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex ?? undefined,
        color: GREEN,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    materials.push(hubGlowSprite.material);
    hubGlowSprite.scale.set(1.6, 1.6, 1);
    network.add(hubGlowSprite);

    // --- 3) Floating glass panels (thick slabs) ---
    const panels = new THREE.Group();
    root.add(panels);

    type PanelItem = {
      group: THREE.Group;
      mats: THREE.MeshPhysicalMaterial[];
      edgeMats: THREE.LineBasicMaterial[];
      base: THREE.Vector3;
      delay: number;
      rotSpeed: number;
      thickness: number;
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

      let body: THREE.Mesh;
      let bodyGeo: THREE.BufferGeometry;

      if (hex) {
        const shape = hexShape(w * 0.5, h * 0.5);
        bodyGeo = new THREE.ExtrudeGeometry(shape, {
          depth: thickness,
          bevelEnabled: true,
          bevelThickness: thickness * 0.22,
          bevelSize: Math.min(w, h) * 0.04,
          bevelSegments: 2,
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
        emissiveIntensity: 0.06,
        roughness: 0.18,
        metalness: 0.55,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        transparent: true,
        opacity: 0.38,
        envMap,
        envMapIntensity: 1.5,
        side: THREE.FrontSide,
      });
      materials.push(bodyMat);
      mats.push(bodyMat);
      body = new THREE.Mesh(bodyGeo, bodyMat);
      g.add(body);

      // Thin metal bezel / rim plate slightly larger
      const rimMat = new THREE.MeshPhysicalMaterial({
        color: METAL,
        emissive: accent,
        emissiveIntensity: 0.12,
        roughness: 0.22,
        metalness: 0.9,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        transparent: true,
        opacity: 0.55,
        envMap,
        envMapIntensity: 1.3,
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
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.scale.set(1.02, 1.02, 1);
        g.add(rim);
      } else {
        const rimGeo = new THREE.BoxGeometry(w * 1.04, h * 1.04, thickness * 0.35);
        disposables.push(rimGeo);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.z = -thickness * 0.15;
        g.add(rim);
      }

      // Edge highlight
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

      // Code-window silhouette lines on rectangular panels
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

      return { group: g, mats, edgeMats };
    }

    const panelDefs = [
      { p: new THREE.Vector3(-2.35, 1.05, 0.85), w: 0.95, h: 0.58, t: 0.07, hex: false, c: CYAN },
      { p: new THREE.Vector3(-2.05, -0.95, 0.45), w: 0.72, h: 0.72, t: 0.06, hex: true, c: PURPLE },
      { p: new THREE.Vector3(2.15, 1.2, 0.25), w: 0.78, h: 0.48, t: 0.065, hex: false, c: CYAN },
      { p: new THREE.Vector3(2.3, -0.72, 0.65), w: 0.58, h: 0.58, t: 0.055, hex: true, c: CYAN },
      { p: new THREE.Vector3(-1.55, 0.15, 1.25), w: 0.52, h: 0.36, t: 0.05, hex: false, c: PURPLE },
      { p: new THREE.Vector3(1.65, 0.32, 1.05), w: 0.44, h: 0.44, t: 0.05, hex: true, c: GREEN },
      { p: new THREE.Vector3(-0.2, -1.35, 0.9), w: 0.7, h: 0.4, t: 0.06, hex: false, c: CYAN },
    ];

    panelDefs.forEach((def, i) => {
      const { group, mats, edgeMats } = makeGlassPanel(def.w, def.h, def.t, def.c, def.hex);
      group.position.copy(def.p);
      panels.add(group);
      panelItems.push({
        group,
        mats,
        edgeMats,
        base: def.p.clone(),
        delay: i * 0.055,
        rotSpeed: 0.045 + (i % 3) * 0.028,
        thickness: def.t,
      });
    });

    // Atmospheric wash
    const wash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex ?? undefined,
        color: CYAN,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    materials.push(wash.material);
    wash.position.set(-0.4, 0.1, -2.8);
    wash.scale.set(9, 7, 1);
    root.add(wash);

    // State for morph
    let fromStage: StageId = stageRef.current;
    let toStage: StageId = stageRef.current;
    let morphT = 1;
    let morphDuration = reduceMotion ? 0.01 : 1.15;
    let currentVisual = { ...VISUALS[toStage] };
    let nodeProgress = nodes.map(() => 1);
    let panelProgress = panelItems.map(() => 1);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const hubOrigin = new THREE.Vector3(0, 0, 0);
    const tmpPos = new THREE.Vector3();
    const tintColor = new THREE.Color();

    function beginMorph(next: StageId) {
      if (next === toStage && morphT >= 1) return;
      fromStage = toStage;
      toStage = next;
      morphT = 0;
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
      const el = mountRef.current;
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

    let raf = 0;
    let running = true;
    let visible = document.visibilityState === "visible";
    let lastTs = performance.now();
    let elapsed = 0;
    let lastStage = stageRef.current;

    function frame(now: number) {
      if (!running) return;
      if (!visible) {
        raf = 0;
        return;
      }

      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      elapsed += dt;
      const t = elapsed;

      if (stageRef.current !== lastStage) {
        beginMorph(stageRef.current);
        lastStage = stageRef.current;
      }

      if (morphT < 1) {
        morphT = Math.min(1, morphT + dt / morphDuration);
      }
      const eased = easeOutCubic(morphT);
      currentVisual = lerpVisual(VISUALS[fromStage], VISUALS[toStage], eased);

      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;

      const v = currentVisual;
      const tint = tintColor.copy(CYAN).lerp(PURPLE, v.tintMix);

      // Lights track network side subtly
      hubLight.position.set(1.5 * v.networkSide + pointer.x * 0.3, 0.25, 0.5);
      hubLight.intensity = 0.4 + v.hubGlow * 1.4;
      accentLight.intensity = 0.35 + v.nebulaOpacity * 0.45;
      key.intensity = 0.85 + v.networkOpacity * 0.35;

      wash.material.color.copy(tint);
      wash.material.opacity = 0.05 + v.nebulaOpacity * 0.07;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const bx = basePos[i * 3];
        const by = basePos[i * 3 + 1];
        const bz = basePos[i * 3 + 2];
        const drift = reduceMotion ? 0 : Math.sin(t * 0.35 + i * 0.2) * 0.04;
        positions[i * 3] = bx * v.nebulaSpread + drift;
        positions[i * 3 + 1] =
          by * v.nebulaSpread + Math.cos(t * 0.28 + i) * (reduceMotion ? 0 : 0.03);
        positions[i * 3 + 2] = bz;
        const c = i % 3 === 0 ? tint : i % 2 === 0 ? CYAN : PURPLE;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      nebulaGeo.attributes.position.needsUpdate = true;
      nebulaGeo.attributes.color.needsUpdate = true;
      nebulaMat.opacity = 0.32 + v.nebulaOpacity * 0.55;
      nebula.position.x = -0.55 + pointer.x * 0.15;
      nebula.position.y = pointer.y * 0.1;

      orbGroup.position.x = -0.35 + pointer.x * 0.28;
      orbGroup.position.y = pointer.y * 0.2;
      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i];
        const breathe = reduceMotion ? 1 : 1 + Math.sin(t * o.pulse + o.phase) * 0.12;
        o.mesh.position.set(
          o.base.x * v.nebulaSpread,
          o.base.y * v.nebulaSpread + (reduceMotion ? 0 : Math.sin(t * 0.3 + o.phase) * 0.08),
          o.base.z,
        );
        const baseScale = o.mesh.userData.baseScale as number | undefined;
        if (baseScale == null) o.mesh.userData.baseScale = o.mesh.scale.x;
        const bs = (o.mesh.userData.baseScale as number) * breathe * (0.85 + v.nebulaSpread * 0.15);
        o.mesh.scale.setScalar(bs);
        o.mat.opacity = (0.12 + v.nebulaOpacity * 0.22) * breathe;
        o.mat.emissiveIntensity = 0.35 + v.nebulaOpacity * 0.45;
      }

      updateLinks(v.nebulaSpread, v.particleLink);

      // Network assemble / dissolve
      network.position.set(1.55 * v.networkSide + pointer.x * 0.22, 0.12 + pointer.y * 0.14, 0);
      network.scale.setScalar(v.networkScale);
      network.rotation.y = Math.sin(t * 0.14) * 0.14 + pointer.x * 0.1;
      network.rotation.x = 0.2 + pointer.y * 0.07;
      network.rotation.z = Math.sin(t * 0.09) * 0.04;

      hubGlowSprite.material.opacity = 0.12 + v.hubGlow * 0.45;
      hubGlowSprite.scale.setScalar(1.2 + v.hubGlow * 0.65 + Math.sin(t * 1.1) * 0.1);
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

        tmpPos.set(
          node.base.x,
          node.base.y + (reduceMotion ? 0 : Math.sin(t * 0.55 + node.phase) * 0.045),
          node.base.z,
        );
        tmpPos.lerp(hubOrigin, 1 - clampedPop);
        node.group.position.copy(tmpPos);

        // Body keeps authored size; group scale drives assemble/dissolve
        node.group.scale.setScalar(
          node.isHub ? 0.35 + clampedPop * 0.65 : 0.22 + clampedPop * 0.78,
        );

        node.group.rotation.x = t * node.spin * 0.32;
        node.group.rotation.y = t * node.spin * 0.48 + clampedPop * 0.4;

        const baseOp = node.bodyMat.userData.baseOpacity as number;
        const baseEm = node.bodyMat.userData.baseEmissive as number;
        node.bodyMat.opacity = baseOp * clampedPop;
        node.bodyMat.emissiveIntensity = baseEm * (0.5 + v.hubGlow * 0.8) * clampedPop;
        node.edgeMat.opacity = (node.edgeMat.userData.baseOpacity as number) * clampedPop;
        node.group.visible = clampedPop > 0.02;
      });

      updateFibers(v.networkOpacity, v.hubGlow);

      // Panels — assemble with rotation + scale + material fade
      panels.position.set(pointer.x * 0.38, pointer.y * 0.28, 0);
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

        item.group.position.set(
          item.base.x * v.panelsSpread,
          item.base.y * v.panelsSpread + (reduceMotion ? 0 : Math.sin(t * 0.48 + i) * 0.07),
          item.base.z + (1 - e) * 0.8,
        );
        item.group.scale.setScalar(0.35 + e * 0.65);
        item.group.rotation.x = (1 - e) * 0.55 + Math.sin(t * item.rotSpeed * 0.5) * 0.06;
        item.group.rotation.y = Math.cos(t * item.rotSpeed * 0.7) * 0.14 + (1 - e) * 0.4;
        item.group.rotation.z = Math.sin(t * item.rotSpeed + i) * 0.08;

        for (const m of item.mats) {
          m.opacity = (m.userData.baseOpacity as number) * e;
          m.emissiveIntensity = (m.userData.baseEmissive as number) * (0.6 + e * 0.6);
        }
        for (const m of item.edgeMats) {
          m.opacity = (m.userData.baseOpacity as number) * e;
        }
        item.group.visible = e > 0.02;
      });

      // Subtle camera parallax
      camera.position.x = pointer.x * 0.22;
      camera.position.y = 0.15 + pointer.y * 0.14;
      camera.position.z = 6.2 - Math.abs(pointer.x) * 0.08;
      camera.lookAt(pointer.x * 0.06, pointer.y * 0.05, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    const kick = () => {
      if (!running || raf || !visible) return;
      lastTs = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.ty = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const onVis = () => {
      visible = document.visibilityState === "visible";
      if (visible) kick();
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    kick();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      for (const g of disposables) g.dispose();
      for (const m of materials) m.dispose();
      glowTex?.dispose();
      envMap.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
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
