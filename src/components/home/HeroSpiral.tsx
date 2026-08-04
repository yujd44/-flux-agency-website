"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

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

const SPIRAL: SpiralParams = {
  // Slightly more turns + tighter helix so a slender band still has presence
  turns: 2.55,
  radius: 1.18,
  height: 4.55,
  // Slim luxury band — not a tubular stadium bar
  width: 0.38,
  thickness: 0.055,
  segments: 420,
  profile: 18,
};

/** Helix frame: center + orthonormal basis (tangent, binormal, normal). */
function frameAt(t: number, p: SpiralParams) {
  const angle = t * p.turns * Math.PI * 2;
  const y = (t - 0.5) * p.height;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const center = new THREE.Vector3(cos * p.radius, y, sin * p.radius);
  const tangent = new THREE.Vector3(
    -sin * p.radius,
    p.height / (p.turns * Math.PI * 2),
    cos * p.radius,
  ).normalize();
  const radial = new THREE.Vector3(cos, 0, sin);
  let binormal = new THREE.Vector3().crossVectors(tangent, radial).normalize();
  if (binormal.lengthSq() < 1e-4) binormal.set(0, 1, 0);
  const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
  binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

  return { center, tangent, binormal, normal };
}

/**
 * Multi-stop luxury gradient along the ribbon length.
 * Champagne → rose → magenta → orchid → amethyst → deep violet,
 * with a restrained teal edge near the tip — premium, not rainbow strobe.
 */
const GRADIENT_STOPS: { t: number; hex: string }[] = [
  { t: 0, hex: "#d4a574" }, // soft champagne / gold highlight
  { t: 0.14, hex: "#c45a6a" }, // rose
  { t: 0.32, hex: "#d63a8a" }, // brand magenta
  { t: 0.5, hex: "#a855c8" }, // orchid
  { t: 0.68, hex: "#6b3fa0" }, // deep amethyst
  { t: 0.84, hex: "#4a2f8a" }, // deep violet
  { t: 1, hex: "#2f5a6e" }, // restrained teal edge
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
 * Closed stadium (flattened capsule) profile in the binormal×normal plane.
 * Filled volume when swept — reads as one solid ribbon, not dual shells.
 */
function stadiumProfile(hw: number, ht: number, samples: number): [number, number][] {
  // Tight end radius — flat band with refined caps, not a fat capsule
  const r = Math.min(ht * 0.92, hw * 0.28);
  const flat = Math.max(0, hw - r);
  const half = Math.max(4, Math.ceil(samples / 2));
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
 * Single solid helical ribbon — stadium cross-section with capped ends.
 * Vertex colors carry the luxury brand gradient; no separate rim tubes.
 */
function buildRibbonGeometry(p: SpiralParams) {
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const tint = new THREE.Color();
  const face = new THREE.Color();
  const deepBase = new THREE.Color("#2a1830");
  const rimLift = new THREE.Color("#e8c9a8");

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
      const pos = center
        .clone()
        .addScaledVector(binormal, u)
        .addScaledVector(normal, v);
      positions.push(pos.x, pos.y, pos.z);

      // Rich brand body (visible on dark), subtle champagne rim — not black void
      const across = (u / hw + 1) * 0.5;
      const edge = Math.pow(Math.abs(u) / hw, 1.5);
      face.copy(deepBase).lerp(tint, 0.78 + across * 0.12);
      face.lerp(rimLift, edge * 0.1);
      const lift = 0.92 + Math.max(0, v / ht) * 0.1;
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

  // Solid end caps (fan from ring centroid) so the volume never reads hollow
  const startCenter = positions.length / 3;
  {
    const { center } = frameAt(0, p);
    brandGradient(0, tint);
    face.copy(deepBase).lerp(tint, 0.82);
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
    face.copy(deepBase).lerp(tint, 0.82);
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

/**
 * Contrast-rich studio env — warm magenta / violet specular windows.
 */
function makeStudioEnv(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.HemisphereLight(0xfff0e8, 0x121018, 0.7));

  const key = new THREE.DirectionalLight(0xfff2ea, 1.35);
  key.position.set(4.2, 5.8, 2.8);
  envScene.add(key);

  const hot = new THREE.DirectionalLight(0xffffff, 0.95);
  hot.position.set(-1.2, 3.5, 4.5);
  envScene.add(hot);

  const cool = new THREE.DirectionalLight(0xc8b8e8, 0.7);
  cool.position.set(-3.2, 1.4, 2.6);
  envScene.add(cool);

  const magenta = new THREE.DirectionalLight(0xff6ab0, 0.75);
  magenta.position.set(1.4, 0.6, -3.4);
  envScene.add(magenta);

  const rose = new THREE.PointLight(0xe07050, 0.75, 14, 2);
  rose.position.set(0, -2.2, 1.8);
  envScene.add(rose);

  const violet = new THREE.PointLight(0x8b5cf6, 0.8, 12, 2);
  violet.position.set(2.5, 2.0, -2.0);
  envScene.add(violet);

  const sparkGeo = new THREE.SphereGeometry(0.35, 16, 12);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfff4ec });
  const sparkA = new THREE.Mesh(sparkGeo, sparkMat);
  sparkA.position.set(5.5, 6.2, 4.2);
  envScene.add(sparkA);
  const sparkB = new THREE.Mesh(sparkGeo, sparkMat.clone());
  (sparkB.material as THREE.MeshBasicMaterial).color.set(0xf0e0ff);
  sparkB.position.set(-4.8, 3.8, 5.5);
  envScene.add(sparkB);
  const sparkC = new THREE.Mesh(sparkGeo, sparkMat.clone());
  (sparkC.material as THREE.MeshBasicMaterial).color.set(0xffc0d8);
  sparkC.position.set(2.2, 1.5, -5.8);
  envScene.add(sparkC);

  const envMap = pmrem.fromScene(envScene, 0.02).texture;
  sparkGeo.dispose();
  sparkMat.dispose();
  (sparkB.material as THREE.Material).dispose();
  (sparkC.material as THREE.Material).dispose();
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
 * Dedicated WebGL spiral — single solid iridescent ribbon.
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.2, 60);
    camera.position.set(3.85, 0.45, 5.55);
    camera.lookAt(1.55, -0.08, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
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
      color: new THREE.Color("#ffffff"),
      // Soft luxury enamel — clearcoat/sheen without candy-plastic blowout
      roughness: 0.42,
      metalness: 0.48,
      clearcoat: 0.62,
      clearcoatRoughness: 0.32,
      ior: 1.45,
      sheen: 0.42,
      sheenRoughness: 0.48,
      sheenColor: new THREE.Color("#b070d0"),
      iridescence: 0.28,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [220, 380],
      flatShading: false,
      vertexColors: true,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.16,
      envMap,
      envMapIntensity: 0.95,
      side: THREE.FrontSide,
    });
    tintEmissiveByVertexColor(ribbonMat);
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.castShadow = true;
    ribbon.receiveShadow = true;
    group.add(ribbon);

    const floorY = -SPIRAL.height * 0.48;
    const floorGeo = new THREE.CircleGeometry(3.6, 64);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0a0b10"),
      metalness: 0.45,
      roughness: 0.42,
      clearcoat: 0.2,
      clearcoatRoughness: 0.5,
      transparent: true,
      opacity: 0.62,
      envMap,
      envMapIntensity: 0.4,
      depthWrite: false,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(1.62, floorY, 0.2);
    floor.receiveShadow = true;
    scene.add(floor);

    const shadowCatcherGeo = new THREE.CircleGeometry(2.8, 48);
    const shadowCatcherMat = new THREE.ShadowMaterial({
      opacity: 0.4,
    });
    const shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.set(1.62, floorY + 0.002, 0.2);
    shadowCatcher.receiveShadow = true;
    scene.add(shadowCatcher);

    const glowGeo = new THREE.CircleGeometry(2.35, 40);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#8b5cf6"),
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(1.65, floorY + 0.008, 0.15);
    scene.add(glow);

    const warmGlowGeo = new THREE.CircleGeometry(1.6, 32);
    const warmGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#e83a8a"),
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warmGlow = new THREE.Mesh(warmGlowGeo, warmGlowMat);
    warmGlow.rotation.x = -Math.PI / 2;
    warmGlow.position.set(1.75, floorY + 0.012, -0.1);
    scene.add(warmGlow);

    const hemi = new THREE.HemisphereLight(0xf4efe8, 0x2a2035, 0.58);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xc8c0d4, 0.3);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff4ea, 1.35);
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
    key.shadow.radius = 4;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xe0d4f0, 0.55);
    fill.position.set(camera.position.x - 0.4, 1.6, camera.position.z + 0.6);
    scene.add(fill);

    const sideFill = new THREE.DirectionalLight(0xb8a8d0, 0.4);
    sideFill.position.set(-3.5, 1.8, 2.2);
    scene.add(sideFill);

    const rimLight = new THREE.DirectionalLight(0xff7ab8, 0.65);
    rimLight.position.set(1.5, 1.2, -4);
    scene.add(rimLight);

    const bounce = new THREE.PointLight(0xb06cff, 0.65, 8, 2);
    bounce.position.set(1.7, floorY + 0.4, 1.2);
    scene.add(bounce);

    const warmBounce = new THREE.PointLight(0xe07050, 0.55, 7, 2);
    warmBounce.position.set(2.0, 0.6, -1.2);
    scene.add(warmBounce);

    const wander = new THREE.PointLight(0xffe8d8, 0.75, 9, 2);
    wander.position.set(3.2, 2.4, 2.8);
    scene.add(wander);

    const wanderCool = new THREE.PointLight(0xd0b8ff, 0.55, 8, 2);
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

      group.rotation.y = clock.t * 0.22;
      group.rotation.x = baseTiltX + Math.sin(clock.t * 0.4) * 0.025;
      group.rotation.z = baseTiltZ;
      group.position.y = -0.22 + Math.sin(clock.t * 0.5) * 0.035;

      const a = clock.t * 0.55;
      wander.position.set(
        1.62 + Math.cos(a) * 2.8,
        1.8 + Math.sin(a * 0.7) * 1.1,
        Math.sin(a) * 2.6,
      );
      const b = clock.t * 0.38 + 1.7;
      wanderCool.position.set(
        1.62 + Math.cos(b) * 2.2,
        0.6 + Math.sin(b * 1.1) * 0.9,
        Math.sin(b) * 2.4,
      );

      glowMat.opacity = 0.14 + Math.sin(clock.t * 0.85) * 0.04;

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
