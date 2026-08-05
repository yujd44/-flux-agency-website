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

/**
 * Single shared WebGL layer for ritual stages.
 * Three systems: nebula field, network architecture, floating glass/wire accents.
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
        antialias: false,
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

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
    });

    const glowTex = makeGlowTexture();
    const root = new THREE.Group();
    scene.add(root);

    // --- 1) Nebula / particle field ---
    const PARTICLE_COUNT = 140;
    const BOKEH_COUNT = 18;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const basePos = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.65) * 3.4;
      const x = Math.cos(a) * r * 1.15 - 0.8;
      const y = Math.sin(a) * r * 0.72 + (Math.random() - 0.5) * 0.6;
      const z = (Math.random() - 0.5) * 2.4;
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

    const nebulaMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      map: glowTex ?? undefined,
    });
    const nebula = new THREE.Points(nebulaGeo, nebulaMat);
    root.add(nebula);

    // Soft bokeh orbs
    const bokehGroup = new THREE.Group();
    root.add(bokehGroup);
    const bokehMatCyan = new THREE.SpriteMaterial({
      map: glowTex ?? undefined,
      color: CYAN,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const bokehMatPurple = new THREE.SpriteMaterial({
      map: glowTex ?? undefined,
      color: PURPLE,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const bokehs: THREE.Sprite[] = [];
    for (let i = 0; i < BOKEH_COUNT; i++) {
      const spr = new THREE.Sprite(i % 2 === 0 ? bokehMatCyan : bokehMatPurple);
      const a = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 2.8;
      spr.position.set(
        Math.cos(a) * r - 0.6,
        Math.sin(a) * r * 0.55,
        -1.2 - Math.random() * 2,
      );
      const s = 0.55 + Math.random() * 1.4;
      spr.scale.set(s, s, 1);
      bokehGroup.add(spr);
      bokehs.push(spr);
    }

    // Connected particle web (subset)
    const LINK_COUNT = 48;
    const linkPositions = new Float32Array(LINK_COUNT * 2 * 3);
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
    const linkMat = new THREE.LineBasicMaterial({
      color: 0xc8dcff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const links = new THREE.LineSegments(linkGeo, linkMat);
    root.add(links);

    // --- 2) Network architecture ---
    const network = new THREE.Group();
    root.add(network);

    type NodeItem = {
      mesh: THREE.Mesh;
      base: THREE.Vector3;
      phase: number;
      spin: number;
      assembleDelay: number;
    };
    const nodes: NodeItem[] = [];
    const nodeDefs: { p: THREE.Vector3; s: number; green?: boolean }[] = [
      { p: new THREE.Vector3(0, 0, 0), s: 0.28, green: true },
      { p: new THREE.Vector3(0.85, 0.55, 0.2), s: 0.16 },
      { p: new THREE.Vector3(1.1, -0.35, -0.15), s: 0.14 },
      { p: new THREE.Vector3(0.35, -0.75, 0.35), s: 0.12, green: true },
      { p: new THREE.Vector3(-0.55, 0.65, -0.25), s: 0.13 },
      { p: new THREE.Vector3(-0.9, -0.2, 0.3), s: 0.15 },
      { p: new THREE.Vector3(0.15, 0.95, -0.4), s: 0.11 },
      { p: new THREE.Vector3(1.45, 0.15, 0.45), s: 0.1 },
      { p: new THREE.Vector3(-0.25, -0.55, -0.5), s: 0.12 },
      { p: new THREE.Vector3(0.65, 0.15, -0.65), s: 0.1, green: true },
      { p: new THREE.Vector3(-1.15, 0.35, 0.1), s: 0.11 },
      { p: new THREE.Vector3(0.4, -0.15, 0.7), s: 0.09 },
    ];

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);

    nodeDefs.forEach((def, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: def.green ? GREEN : PURPLE,
        transparent: true,
        opacity: def.green ? 0.72 : 0.38,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.scale.setScalar(def.s);
      mesh.position.copy(def.p);
      network.add(mesh);

      const edgeMat = new THREE.LineBasicMaterial({
        color: def.green ? 0xb8ffe0 : 0xd8c4ff,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const edges = new THREE.LineSegments(edgesGeo, edgeMat);
      edges.scale.setScalar(def.s * 1.02);
      mesh.add(edges);

      nodes.push({
        mesh,
        base: def.p.clone(),
        phase: Math.random() * Math.PI * 2,
        spin: 0.15 + Math.random() * 0.35,
        assembleDelay: i * 0.045,
      });
    });

    // Fiber connections between nodes
    const fiberPairs: [number, number][] = [
      [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 9],
      [1, 7], [1, 6], [2, 7], [2, 3], [3, 8], [4, 10],
      [5, 10], [5, 8], [6, 4], [9, 2], [11, 0], [11, 2],
    ];
    const fiberPos = new Float32Array(fiberPairs.length * 6);
    const fiberGeo = new THREE.BufferGeometry();
    fiberGeo.setAttribute("position", new THREE.BufferAttribute(fiberPos, 3));
    const fiberMat = new THREE.LineBasicMaterial({
      color: 0xe8f4ff,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const fibers = new THREE.LineSegments(fiberGeo, fiberMat);
    network.add(fibers);

    // Hub ring of small nodes
    const hubRing = new THREE.Group();
    network.add(hubRing);
    const hubDotGeo = new THREE.SphereGeometry(0.035, 8, 8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const dot = new THREE.Mesh(
        hubDotGeo,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.75,
        }),
      );
      dot.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.05);
      hubRing.add(dot);
    }
    const hubRingLine = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 32 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.05);
        }),
      ),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    );
    hubRing.add(hubRingLine);

    // Hub glow sprite
    const hubGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex ?? undefined,
        color: GREEN,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    hubGlow.scale.set(1.4, 1.4, 1);
    network.add(hubGlow);

    // --- 3) Floating glass / wireframe accents ---
    const panels = new THREE.Group();
    root.add(panels);

    type PanelItem = {
      group: THREE.Group;
      base: THREE.Vector3;
      delay: number;
      rotSpeed: number;
    };
    const panelItems: PanelItem[] = [];

    function makeFrame(w: number, h: number, color: THREE.Color, hex = false) {
      const g = new THREE.Group();
      if (hex) {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          pts.push(new THREE.Vector3(Math.cos(a) * w, Math.sin(a) * h, 0));
        }
        pts.push(pts[0].clone());
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        g.add(
          new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity: 0.55,
              depthWrite: false,
            }),
          ),
        );
      } else {
        const box = new THREE.BoxGeometry(w, h, 0.02);
        const edge = new THREE.EdgesGeometry(box);
        g.add(
          new THREE.LineSegments(
            edge,
            new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity: 0.5,
              depthWrite: false,
            }),
          ),
        );
        g.add(
          new THREE.Mesh(
            box,
            new THREE.MeshBasicMaterial({
              color: NAVY,
              transparent: true,
              opacity: 0.18,
              depthWrite: false,
            }),
          ),
        );
      }
      return g;
    }

    const panelDefs = [
      { p: new THREE.Vector3(-2.4, 1.1, 0.8), w: 0.9, h: 0.55, hex: false, c: CYAN },
      { p: new THREE.Vector3(-2.1, -0.9, 0.4), w: 0.7, h: 0.7, hex: true, c: PURPLE },
      { p: new THREE.Vector3(2.2, 1.25, 0.2), w: 0.75, h: 0.45, hex: false, c: CYAN },
      { p: new THREE.Vector3(2.35, -0.7, 0.6), w: 0.55, h: 0.55, hex: true, c: CYAN },
      { p: new THREE.Vector3(-1.6, 0.2, 1.2), w: 0.5, h: 0.35, hex: false, c: PURPLE },
      { p: new THREE.Vector3(1.7, 0.35, 1.0), w: 0.42, h: 0.42, hex: true, c: GREEN },
    ];

    panelDefs.forEach((def, i) => {
      const group = makeFrame(def.w, def.h, def.c, def.hex);
      group.position.copy(def.p);
      // code-window silhouette lines
      if (!def.hex) {
        const lineMat = new THREE.LineBasicMaterial({
          color: def.c,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        });
        for (let row = 0; row < 3; row++) {
          const y = def.h * 0.22 - row * 0.12;
          const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-def.w * 0.32, y, 0.02),
            new THREE.Vector3(def.w * (row === 1 ? 0.18 : 0.28), y, 0.02),
          ]);
          group.add(new THREE.Line(geo, lineMat));
        }
      }
      panels.add(group);
      panelItems.push({
        group,
        base: def.p.clone(),
        delay: i * 0.06,
        rotSpeed: 0.05 + (i % 3) * 0.03,
      });
    });

    // Ambient fill light via fog-ish backdrop sprite
    const wash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex ?? undefined,
        color: CYAN,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    wash.position.set(-0.4, 0.1, -2.5);
    wash.scale.set(8, 6, 1);
    root.add(wash);

    // State for morph
    let fromStage: StageId = stageRef.current;
    let toStage: StageId = stageRef.current;
    let morphT = 1;
    let morphDuration = reduceMotion ? 0.01 : 1.05;
    let currentVisual = { ...VISUALS[toStage] };
    let nodeProgress = nodes.map(() => 1);
    let panelProgress = panelItems.map(() => 1);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const hubOrigin = new THREE.Vector3(0, 0, 0);

    function beginMorph(next: StageId) {
      if (next === toStage && morphT >= 1) return;
      fromStage = toStage;
      toStage = next;
      morphT = 0;
      // stagger reset for assemble feel
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
      linkMat.opacity = 0.05 + linkStrength * 0.18;
    }

    function updateFibers() {
      const arr = fiberGeo.attributes.position.array as Float32Array;
      let wi = 0;
      for (const [ia, ib] of fiberPairs) {
        const a = nodes[ia].mesh.position;
        const b = nodes[ib].mesh.position;
        arr[wi++] = a.x;
        arr[wi++] = a.y;
        arr[wi++] = a.z;
        arr[wi++] = b.x;
        arr[wi++] = b.y;
        arr[wi++] = b.z;
      }
      fiberGeo.attributes.position.needsUpdate = true;
    }

    let raf = 0;
    let running = true;
    let visible = document.visibilityState === "visible";
    const clock = new THREE.Clock();
    let lastStage = stageRef.current;

    function frame() {
      if (!running) return;
      if (!visible) {
        raf = 0;
        return;
      }

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      if (stageRef.current !== lastStage) {
        beginMorph(stageRef.current);
        lastStage = stageRef.current;
      }

      if (morphT < 1) {
        morphT = Math.min(1, morphT + dt / morphDuration);
      }
      const eased = easeOutCubic(morphT);
      currentVisual = lerpVisual(VISUALS[fromStage], VISUALS[toStage], eased);

      // Pointer parallax
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;

      const v = currentVisual;

      // Nebula drift + tint
      const tint = CYAN.clone().lerp(PURPLE, v.tintMix);
      wash.material.color.copy(tint);
      wash.material.opacity = 0.05 + v.nebulaOpacity * 0.06;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const bx = basePos[i * 3];
        const by = basePos[i * 3 + 1];
        const bz = basePos[i * 3 + 2];
        const drift = reduceMotion ? 0 : Math.sin(t * 0.35 + i * 0.2) * 0.04;
        positions[i * 3] = bx * v.nebulaSpread + drift;
        positions[i * 3 + 1] = by * v.nebulaSpread + Math.cos(t * 0.28 + i) * (reduceMotion ? 0 : 0.03);
        positions[i * 3 + 2] = bz;
        const c = i % 3 === 0 ? tint : i % 2 === 0 ? CYAN : PURPLE;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      nebulaGeo.attributes.position.needsUpdate = true;
      nebulaGeo.attributes.color.needsUpdate = true;
      nebulaMat.opacity = 0.35 + v.nebulaOpacity * 0.55;
      nebula.position.x = -0.55 + pointer.x * 0.15;
      nebula.position.y = pointer.y * 0.1;

      bokehGroup.position.x = -0.4 + pointer.x * 0.25;
      bokehGroup.position.y = pointer.y * 0.18;
      bokehMatCyan.opacity = 0.1 + v.nebulaOpacity * 0.16;
      bokehMatPurple.opacity = 0.08 + v.nebulaOpacity * 0.14;
      if (!reduceMotion) {
        for (let i = 0; i < bokehs.length; i++) {
          const s = 0.55 + ((Math.sin(t * 0.4 + i) + 1) * 0.5) * 0.9;
          bokehs[i].scale.setScalar(s * (0.8 + v.nebulaSpread * 0.2));
        }
      }

      updateLinks(v.nebulaSpread, v.particleLink);

      // Network assemble / dissolve
      network.position.set(1.55 * v.networkSide + pointer.x * 0.2, 0.1 + pointer.y * 0.12, 0);
      network.scale.setScalar(v.networkScale);
      network.rotation.y = Math.sin(t * 0.15) * 0.12 + pointer.x * 0.08;
      network.rotation.x = 0.18 + pointer.y * 0.06;

      fiberMat.opacity = 0.08 + v.networkOpacity * 0.32;
      hubGlow.material.opacity = 0.1 + v.hubGlow * 0.4;
      hubGlow.scale.setScalar(1.1 + v.hubGlow * 0.5 + Math.sin(t * 1.2) * 0.08);
      hubRing.rotation.z = t * 0.25;
      hubRing.visible = v.networkOpacity > 0.15;
      hubRing.traverse((obj) => {
        const mat = (obj as THREE.Mesh).material as THREE.Material | undefined;
        if (mat && "opacity" in mat) {
          const m = mat as THREE.MeshBasicMaterial;
          if (m.userData.baseOpacity == null) m.userData.baseOpacity = m.opacity;
          m.opacity = (m.userData.baseOpacity as number) * v.networkOpacity;
        }
      });

      nodes.forEach((node, i) => {
        const target = morphT >= node.assembleDelay ? 1 : 0;
        // when dissolving outgoing stronger network
        const dissolveBias =
          VISUALS[toStage].networkOpacity < VISUALS[fromStage].networkOpacity
            ? 1 - eased
            : null;
        if (dissolveBias != null) {
          nodeProgress[i] = dissolveBias;
        } else {
          nodeProgress[i] += (target - nodeProgress[i]) * (0.06 + node.assembleDelay * 0.02);
        }
        const p = Math.max(0, Math.min(1, nodeProgress[i]));
        const pop = easeOutCubic(p) * v.networkOpacity;
        node.mesh.position.set(
          node.base.x,
          node.base.y + (reduceMotion ? 0 : Math.sin(t * 0.6 + node.phase) * 0.04),
          node.base.z,
        );
        // emerge from hub
        node.mesh.position.lerp(hubOrigin, 1 - pop);
        node.mesh.scale.setScalar(nodeDefs[i].s * (0.25 + pop * 0.75));
        (node.mesh.material as THREE.MeshBasicMaterial).opacity =
          (nodeDefs[i].green ? 0.75 : 0.4) * pop;
        node.mesh.rotation.x = t * node.spin * 0.35;
        node.mesh.rotation.y = t * node.spin * 0.5;
        node.mesh.visible = pop > 0.02;
      });
      updateFibers();

      // Panels
      panels.position.set(pointer.x * 0.35, pointer.y * 0.25, 0);
      panelItems.forEach((item, i) => {
        const dissolving =
          VISUALS[toStage].panelsOpacity < VISUALS[fromStage].panelsOpacity;
        if (dissolving) {
          panelProgress[i] = 1 - eased;
        } else {
          const target = morphT >= item.delay ? 1 : 0;
          panelProgress[i] += (target - panelProgress[i]) * 0.07;
        }
        const p = Math.max(0, Math.min(1, panelProgress[i])) * v.panelsOpacity;
        const e = easeOutCubic(p);
        item.group.position.set(
          item.base.x * v.panelsSpread,
          item.base.y * v.panelsSpread + (reduceMotion ? 0 : Math.sin(t * 0.5 + i) * 0.06),
          item.base.z,
        );
        item.group.scale.setScalar(0.4 + e * 0.6);
        item.group.rotation.z = Math.sin(t * item.rotSpeed + i) * 0.08;
        item.group.rotation.y = Math.cos(t * item.rotSpeed * 0.7) * 0.12;
        item.group.traverse((obj) => {
          const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
          if (!mat) return;
          const apply = (m: THREE.Material) => {
            if ("opacity" in m) {
              const base = (m as THREE.MeshBasicMaterial).userData?.baseOpacity;
              if (base == null) {
                (m as THREE.MeshBasicMaterial).userData.baseOpacity = (m as THREE.MeshBasicMaterial).opacity;
              }
              const b = (m as THREE.MeshBasicMaterial).userData.baseOpacity as number;
              (m as THREE.MeshBasicMaterial).opacity = b * e;
              (m as THREE.MeshBasicMaterial).transparent = true;
            }
          };
          if (Array.isArray(mat)) mat.forEach(apply);
          else apply(mat);
        });
        item.group.visible = e > 0.02;
      });

      camera.position.x = pointer.x * 0.18;
      camera.position.y = 0.15 + pointer.y * 0.12;
      camera.lookAt(pointer.x * 0.05, pointer.y * 0.04, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    const kick = () => {
      if (!running || raf || !visible) return;
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
      nebulaGeo.dispose();
      nebulaMat.dispose();
      linkGeo.dispose();
      linkMat.dispose();
      boxGeo.dispose();
      edgesGeo.dispose();
      fiberGeo.dispose();
      fiberMat.dispose();
      hubDotGeo.dispose();
      glowTex?.dispose();
      bokehMatCyan.dispose();
      bokehMatPurple.dispose();
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
