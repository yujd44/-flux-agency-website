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
  /** Initial angular phase so the static silhouette matches the reference. */
  phase: number;
};

/**
 * Classic vertical corkscrew — ~2.3 turns, near-constant radius,
 * flat band faces, resting base coil. Matches the Octane target silhouette.
 */
const SPIRAL: SpiralParams = {
  turns: 2.32,
  radius: 1.28,
  height: 4.35,
  width: 0.44,
  thickness: 0.068,
  segments: 760,
  profile: 40,
  phase: -0.55,
};

const _center = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _radial = new THREE.Vector3();
const _binormal = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _pos = new THREE.Vector3();

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Slight base flare + tip taper — still a classic helix, not organic. */
function radiusAt(t: number, base: number) {
  const u = THREE.MathUtils.clamp(t, 0, 1);
  const floorFlare = 1 + 0.08 * (1 - smoothstep(0, 0.18, u));
  const tipTaper = 1 - 0.06 * smoothstep(0.82, 1, u);
  return base * floorFlare * tipTaper;
}

/** Helix frame: center + orthonormal basis (tangent, binormal, normal). */
function frameAt(t: number, p: SpiralParams) {
  const angle = t * p.turns * Math.PI * 2 + p.phase;
  const y = (t - 0.5) * p.height;
  const r = radiusAt(t, p.radius);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  _center.set(cos * r, y, sin * r);

  // Analytic helix tangent (radius nearly constant → stable frame)
  const dAngle = p.turns * Math.PI * 2;
  _tangent.set(-sin * r * dAngle, p.height, cos * r * dAngle).normalize();
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
 * Deep purple / magenta body. Orange–gold arrives from lights + metal speculars,
 * not baked peach paint.
 */
const GRADIENT_STOPS: { t: number; hex: string }[] = [
  { t: 0, hex: "#2a1240" }, // deep indigo base coil
  { t: 0.16, hex: "#4a1a6e" }, // royal purple
  { t: 0.34, hex: "#7a2488" }, // magenta-violet
  { t: 0.52, hex: "#a82878" }, // hot magenta
  { t: 0.68, hex: "#8a2470" }, // raspberry return
  { t: 0.84, hex: "#5a2278" }, // amethyst
  { t: 1, hex: "#241838" }, // midnight tip
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
  const r = Math.min(ht * 0.98, hw * 0.3);
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
  const deepBase = new THREE.Color("#140818");
  const edgeLift = new THREE.Color("#c06098");

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

      // Deep body tint — edges barely lifted; warm orange stays optical
      const across = (u / hw + 1) * 0.5;
      const edge = Math.pow(Math.abs(u) / hw, 2.4);
      face.copy(deepBase).lerp(tint, 0.9 + across * 0.05);
      face.lerp(edgeLift, edge * 0.06);
      const lift = 0.96 + Math.max(0, v / ht) * 0.05;
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
 * Softbox studio env — warm orange key windows + cool magenta fill.
 * Orange reads as specular highlights on metal, not body wash.
 */
function makeStudioEnv(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x06060c);

  envScene.add(new THREE.HemisphereLight(0xf0e8e0, 0x1a1028, 0.4));

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

  // Key — hot orange/gold (drives outer-curve speculars)
  addSoftbox(6.5, 2.6, 0xffd0a0, 3.4, 5.4, 4.8, 3.6, 0, 0.15, 0);
  // Secondary gold strip — tight specular streaks
  addSoftbox(2.8, 1.2, 0xffa040, 3.8, 4.2, 2.8, 4.2, 0.2, 0.2, 0);
  // Fill — cool lavender (keeps purple body readable)
  addSoftbox(5.0, 4.0, 0xd8c8f0, 1.15, -4.6, 2.2, 3.4, 0.4, 0, 0);
  // Magenta rim — saturated body bounce
  addSoftbox(4.0, 5.2, 0xff58a0, 2.1, 1.0, 0.8, -5.4, 0.5, 0.3, 0);
  // Top skylight — soft white
  addSoftbox(5.5, 5.5, 0xf4f0ff, 0.7, 0.4, 7.0, 0.4, 0.4, 0, 0.4);
  // Floor bounce — violet
  addSoftbox(5.0, 5.0, 0x6a30a0, 0.55, 0.5, -4.2, 0.5, 0.5, 0, 0.5);

  envScene.add(new THREE.AmbientLight(0xa090b8, 0.16));

  const envMap = pmrem.fromScene(envScene, 0.035).texture;
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
 * Classic corkscrew helix — deep magenta metal with orange-gold speculars.
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
    // Slightly looking down onto the corkscrew + floor contact
    const camera = new THREE.PerspectiveCamera(34, 1, 0.2, 60);
    camera.position.set(4.05, 1.35, 5.4);
    camera.lookAt(1.55, -0.55, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
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
    group.position.set(1.58, -0.05, 0);
    // Mild forward lean so the corkscrew reads with depth (like the ref)
    const baseTiltX = -0.22;
    const baseTiltZ = 0.1;
    group.rotation.x = baseTiltX;
    group.rotation.z = baseTiltZ;
    scene.add(group);

    const ribbonGeo = buildRibbonGeometry(SPIRAL);
    const ribbonMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f2eaf8"),
      // Polished anodized metal — orange speculars from lights, purple from albedo
      roughness: 0.18,
      metalness: 0.92,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      ior: 1.48,
      sheen: 0.22,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color("#a04098"),
      iridescence: 0.35,
      iridescenceIOR: 1.25,
      iridescenceThicknessRange: [140, 380],
      flatShading: false,
      vertexColors: true,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.04,
      envMap,
      envMapIntensity: 1.45,
      side: THREE.FrontSide,
    });
    tintEmissiveByVertexColor(ribbonMat);
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.castShadow = true;
    ribbon.receiveShadow = true;
    group.add(ribbon);

    // Soft mirrored ribbon under the floor plane
    const reflectionMat = ribbonMat.clone();
    reflectionMat.transparent = true;
    reflectionMat.opacity = 0.22;
    reflectionMat.depthWrite = false;
    reflectionMat.roughness = 0.48;
    reflectionMat.metalness = 0.6;
    reflectionMat.clearcoat = 0.15;
    reflectionMat.envMapIntensity = 0.3;
    reflectionMat.emissiveIntensity = 0.015;
    reflectionMat.iridescence = 0.15;
    tintEmissiveByVertexColor(reflectionMat);
    const reflection = new THREE.Mesh(ribbonGeo, reflectionMat);
    reflection.scale.y = -1;
    reflection.position.y = -SPIRAL.height;
    reflection.castShadow = false;
    reflection.receiveShadow = false;
    reflection.renderOrder = -1;
    group.add(reflection);

    // Floor Y — ribbon rests at y = -height/2 (minus half thickness)
    const floorLocalY = -SPIRAL.height * 0.5 - SPIRAL.thickness * 0.35;
    const floorY = group.position.y + floorLocalY;

    const floorPivot = new THREE.Group();
    floorPivot.position.set(1.58, 0, 0);
    scene.add(floorPivot);

    const floorGeo = new THREE.CircleGeometry(4.0, 80);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#05060c"),
      metalness: 0.78,
      roughness: 0.22,
      clearcoat: 0.4,
      clearcoatRoughness: 0.4,
      transparent: true,
      opacity: 0.58,
      envMap,
      envMapIntensity: 0.5,
      depthWrite: false,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, floorY, 0.1);
    floor.receiveShadow = true;
    floorPivot.add(floor);

    const shadowCatcherGeo = new THREE.CircleGeometry(3.0, 64);
    const shadowCatcherMat = new THREE.ShadowMaterial({
      opacity: 0.42,
    });
    const shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.set(0, floorY + 0.002, 0.1);
    shadowCatcher.receiveShadow = true;
    floorPivot.add(shadowCatcher);

    // Soft purple / magenta contact glow under the base coil
    const glowGeo = new THREE.CircleGeometry(2.6, 56);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#7a3ab0"),
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0.02, floorY + 0.006, 0.08);
    floorPivot.add(glow);

    const warmGlowGeo = new THREE.CircleGeometry(1.55, 44);
    const warmGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c04090"),
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warmGlow = new THREE.Mesh(warmGlowGeo, warmGlowMat);
    warmGlow.rotation.x = -Math.PI / 2;
    warmGlow.position.set(0.12, floorY + 0.01, -0.04);
    floorPivot.add(warmGlow);

    const contactGeo = new THREE.CircleGeometry(1.4, 40);
    const contactMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#160c24"),
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    const contact = new THREE.Mesh(contactGeo, contactMat);
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(0.05, floorY + 0.004, 0.04);
    contact.scale.set(1.1, 1, 0.88);
    floorPivot.add(contact);

    // —— World-fixed studio lights (highlights travel as the helix turns) ——
    const hemi = new THREE.HemisphereLight(0xece4f0, 0x180e28, 0.32);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0x9078a8, 0.12);
    scene.add(ambient);

    // Hot orange-gold key — intense speculars on outer curves
    const keyArea = new THREE.RectAreaLight(0xffc888, 7.2, 4.8, 2.0);
    keyArea.position.set(4.4, 4.6, 3.8);
    keyArea.lookAt(1.55, 0.1, 0);
    scene.add(keyArea);

    const goldStrip = new THREE.RectAreaLight(0xff9020, 5.5, 2.2, 0.9);
    goldStrip.position.set(3.6, 2.4, 4.0);
    goldStrip.lookAt(1.55, 0.15, 0);
    scene.add(goldStrip);

    const fillArea = new THREE.RectAreaLight(0xd4c4f0, 1.4, 3.8, 3.0);
    fillArea.position.set(-3.4, 1.8, 3.0);
    fillArea.lookAt(1.55, 0, 0.2);
    scene.add(fillArea);

    const rimArea = new THREE.RectAreaLight(0xff48a0, 3.4, 2.6, 4.2);
    rimArea.position.set(1.3, 0.9, -4.0);
    rimArea.lookAt(1.55, 0.1, 0);
    scene.add(rimArea);

    const key = new THREE.DirectionalLight(0xffe8c8, 0.72);
    key.position.set(4.6, 5.2, 4.0);
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

    const rimLight = new THREE.DirectionalLight(0xe050a0, 0.38);
    rimLight.position.set(1.4, 1.0, -3.8);
    scene.add(rimLight);

    const bounce = new THREE.PointLight(0x9a40d0, 0.55, 9, 2);
    bounce.position.set(1.6, floorY + 0.35, 1.0);
    scene.add(bounce);

    const warmBounce = new THREE.PointLight(0xff8030, 0.55, 8, 2);
    warmBounce.position.set(2.4, 1.2, 2.2);
    scene.add(warmBounce);

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

      // Slow elegant Y-axis rotation — lights world-fixed → highlights travel
      const ease = clock.t * 0.04;
      group.rotation.y = ease;
      floorPivot.rotation.y = ease;
      // Locked tilt — no bob so floor contact stays solid
      group.rotation.x = baseTiltX;
      group.rotation.z = baseTiltZ;

      glowMat.opacity = 0.23 + Math.sin(clock.t * 0.22) * 0.03;
      warmGlowMat.opacity = 0.16 + Math.sin(clock.t * 0.18 + 1.1) * 0.025;
      contactMat.opacity = 0.35 + Math.sin(clock.t * 0.14) * 0.03;
      reflectionMat.opacity = 0.18 + Math.sin(clock.t * 0.16) * 0.02;

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
