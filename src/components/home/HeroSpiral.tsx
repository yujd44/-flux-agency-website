"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

type SpiralParams = {
  turns: number;
  radius: number;
  height: number;
  width: number;
  thickness: number;
  segments: number;
  /** Radial samples around the solid stadium cross-section. */
  profile: number;
};

/** Preserve committed slender helix silhouette (7370455 era). */
const SPIRAL: SpiralParams = {
  turns: 2.55,
  radius: 1.18,
  height: 4.55,
  width: 0.38,
  thickness: 0.055,
  segments: 720,
  profile: 36,
};

const _center = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _radial = new THREE.Vector3();
const _binormal = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _pos = new THREE.Vector3();

/** Helix frame: center + orthonormal basis (tangent, binormal, normal). */
function frameAt(t: number, p: SpiralParams) {
  const angle = t * p.turns * Math.PI * 2;
  const y = (t - 0.5) * p.height;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  _center.set(cos * p.radius, y, sin * p.radius);
  _tangent
    .set(-sin * p.radius, p.height / (p.turns * Math.PI * 2), cos * p.radius)
    .normalize();
  _radial.set(cos, 0, sin);
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
 * Optical base tint along the ribbon — deep violet → magenta → raspberry.
 * Warm amber / copper arrives from light + iridescence, not flat paint.
 */
const GRADIENT_STOPS: { t: number; hex: string }[] = [
  { t: 0, hex: "#3a1a48" }, // midnight violet
  { t: 0.18, hex: "#5c2a78" }, // royal purple
  { t: 0.38, hex: "#8a2f8e" }, // magenta-violet
  { t: 0.55, hex: "#b32d72" }, // raspberry
  { t: 0.72, hex: "#9a2458" }, // warm crimson
  { t: 0.88, hex: "#6b2a7a" }, // amethyst return
  { t: 1, hex: "#2a2848" }, // midnight blue tip
];

const _gradB = new THREE.Color();

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
 * Solid helical ribbon — dense stadium sweep, capped ends, smooth normals.
 */
function buildRibbonGeometry(p: SpiralParams) {
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const tint = new THREE.Color();
  const face = new THREE.Color();
  const deepBase = new THREE.Color("#1a1028");
  const edgeLift = new THREE.Color("#c07090");

  const hw = p.width * 0.5;
  const ht = p.thickness * 0.5;
  const profile = stadiumProfile(hw, ht, p.profile);
  const ring = profile.length;

  for (let i = 0; i <= p.segments; i++) {
    const t = i / p.segments;
    brandGradient(t, tint);
    const { center, binormal, normal } = frameAt(t, p);

    for (let c = 0; c < ring; c++) {
      const [u, v] = profile[c];
      _pos
        .copy(center)
        .addScaledVector(binormal, u)
        .addScaledVector(normal, v);
      positions.push(_pos.x, _pos.y, _pos.z);

      // Subtle body tint — rim barely lifted so speculars stay optical
      const across = (u / hw + 1) * 0.5;
      const edge = Math.pow(Math.abs(u) / hw, 2.2);
      face.copy(deepBase).lerp(tint, 0.88 + across * 0.06);
      face.lerp(edgeLift, edge * 0.07);
      const lift = 0.96 + Math.max(0, v / ht) * 0.06;
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
    face.copy(deepBase).lerp(tint, 0.9);
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
    face.copy(deepBase).lerp(tint, 0.9);
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

  // Key softbox — warm cream, elongated
  addSoftbox(7.5, 3.2, 0xfff2e8, 2.4, 5.2, 5.8, 4.0, 0, 0.2, 0);
  // Fill softbox — cool lavender
  addSoftbox(5.5, 4.0, 0xe8dff8, 1.35, -4.8, 2.4, 3.6, 0.4, 0, 0);
  // Magenta rim panel
  addSoftbox(4.2, 5.5, 0xff6aaa, 1.55, 1.2, 1.0, -5.5, 0.5, 0.3, 0);
  // Amber accent strip
  addSoftbox(3.0, 1.4, 0xffc090, 1.8, 3.8, -0.6, 2.2, 0.2, 0.4, 0);
  // Cool cyan reflection only — very soft
  addSoftbox(2.4, 2.0, 0xa8d4e8, 0.55, -2.2, 3.5, -3.8, 0.3, 0.5, 0);
  // Top skylight
  addSoftbox(6.0, 6.0, 0xf8f4ff, 0.85, 0.5, 7.2, 0.5, 0.5, 0, 0.5);

  const amb = new THREE.AmbientLight(0xb8a8c8, 0.22);
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
    camera.position.set(3.85, 0.45, 5.55);
    camera.lookAt(1.55, -0.08, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
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
    group.position.set(1.62, -0.22, 0);
    const baseTiltX = -0.34;
    const baseTiltZ = 0.2;
    group.rotation.x = baseTiltX;
    group.rotation.z = baseTiltZ;
    scene.add(group);

    const ribbonGeo = buildRibbonGeometry(SPIRAL);
    const ribbonMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f4eef8"),
      // Satin anodized titanium + multilayer clearcoat
      roughness: 0.32,
      metalness: 0.78,
      clearcoat: 0.72,
      clearcoatRoughness: 0.22,
      ior: 1.5,
      sheen: 0.28,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color("#a060b8"),
      iridescence: 0.62,
      iridescenceIOR: 1.28,
      iridescenceThicknessRange: [180, 520],
      flatShading: false,
      vertexColors: true,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.045,
      envMap,
      envMapIntensity: 1.15,
      side: THREE.FrontSide,
    });
    tintEmissiveByVertexColor(ribbonMat);
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.castShadow = true;
    ribbon.receiveShadow = true;
    group.add(ribbon);

    const floorY = -SPIRAL.height * 0.48;
    const floorGeo = new THREE.CircleGeometry(3.6, 72);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#080a10"),
      metalness: 0.55,
      roughness: 0.38,
      clearcoat: 0.18,
      clearcoatRoughness: 0.55,
      transparent: true,
      opacity: 0.55,
      envMap,
      envMapIntensity: 0.35,
      depthWrite: false,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(1.62, floorY, 0.2);
    floor.receiveShadow = true;
    scene.add(floor);

    const shadowCatcherGeo = new THREE.CircleGeometry(2.8, 56);
    const shadowCatcherMat = new THREE.ShadowMaterial({
      opacity: 0.32,
    });
    const shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.set(1.62, floorY + 0.002, 0.2);
    shadowCatcher.receiveShadow = true;
    scene.add(shadowCatcher);

    const glowGeo = new THREE.CircleGeometry(2.5, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#6b3fa0"),
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(1.65, floorY + 0.008, 0.15);
    scene.add(glow);

    const warmGlowGeo = new THREE.CircleGeometry(1.55, 40);
    const warmGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c04078"),
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warmGlow = new THREE.Mesh(warmGlowGeo, warmGlowMat);
    warmGlow.rotation.x = -Math.PI / 2;
    warmGlow.position.set(1.75, floorY + 0.012, -0.1);
    scene.add(warmGlow);

    // —— Cinematic studio lighting ——
    const hemi = new THREE.HemisphereLight(0xf0ebe6, 0x1c1430, 0.42);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xa8a0c0, 0.18);
    scene.add(ambient);

    // Soft key — large warm softbox feel via RectAreaLight
    const keyArea = new THREE.RectAreaLight(0xfff0e6, 4.2, 5.5, 2.4);
    keyArea.position.set(4.0, 5.2, 3.6);
    keyArea.lookAt(1.6, 0.1, 0);
    scene.add(keyArea);

    const fillArea = new THREE.RectAreaLight(0xe4d8f4, 1.8, 4.0, 3.2);
    fillArea.position.set(-3.6, 2.0, 3.2);
    fillArea.lookAt(1.6, 0, 0.2);
    scene.add(fillArea);

    const rimArea = new THREE.RectAreaLight(0xff6aaa, 2.6, 2.8, 4.5);
    rimArea.position.set(1.4, 1.0, -4.2);
    rimArea.lookAt(1.6, 0.1, 0);
    scene.add(rimArea);

    const amberArea = new THREE.RectAreaLight(0xffb080, 2.1, 2.2, 1.1);
    amberArea.position.set(3.4, -0.2, 2.0);
    amberArea.lookAt(1.6, 0.2, 0);
    scene.add(amberArea);

    // Gentle directional for soft contact shadows only
    const key = new THREE.DirectionalLight(0xfff4ea, 0.55);
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
    key.shadow.radius = 6;
    scene.add(key);

    const rimLight = new THREE.DirectionalLight(0xd070b0, 0.35);
    rimLight.position.set(1.5, 1.2, -4);
    scene.add(rimLight);

    const bounce = new THREE.PointLight(0x8b5cf6, 0.38, 9, 2);
    bounce.position.set(1.7, floorY + 0.45, 1.15);
    scene.add(bounce);

    const warmBounce = new THREE.PointLight(0xe07060, 0.32, 8, 2);
    warmBounce.position.set(2.0, 0.55, -1.15);
    scene.add(warmBounce);

    // Living reflections — extremely slow drift, not mechanical orbit
    const wander = new THREE.PointLight(0xffe4d4, 0.42, 10, 2);
    wander.position.set(3.2, 2.4, 2.8);
    scene.add(wander);

    const wanderCool = new THREE.PointLight(0xc8b0f0, 0.32, 9, 2);
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

      // Museum calm — almost imperceptible inertia
      group.rotation.y = clock.t * 0.055;
      group.rotation.x = baseTiltX + Math.sin(clock.t * 0.22) * 0.012;
      group.rotation.z = baseTiltZ + Math.sin(clock.t * 0.17) * 0.006;
      group.position.y = -0.22 + Math.sin(clock.t * 0.28) * 0.018;

      const a = clock.t * 0.18;
      wander.position.set(
        1.62 + Math.cos(a) * 2.6,
        1.9 + Math.sin(a * 0.65) * 0.85,
        Math.sin(a * 0.9) * 2.4,
      );
      const b = clock.t * 0.13 + 1.9;
      wanderCool.position.set(
        1.62 + Math.cos(b) * 2.1,
        0.7 + Math.sin(b * 0.9) * 0.7,
        Math.sin(b) * 2.2,
      );

      glowMat.opacity = 0.12 + Math.sin(clock.t * 0.35) * 0.025;
      warmGlowMat.opacity = 0.08 + Math.sin(clock.t * 0.28 + 1.2) * 0.02;

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
      floorGeo.dispose();
      floorMat.dispose();
      shadowCatcherGeo.dispose();
      shadowCatcherMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      warmGlowGeo.dispose();
      warmGlowMat.dispose();
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
