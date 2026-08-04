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
};

const SPIRAL: SpiralParams = {
  turns: 2.15,
  radius: 1.28,
  height: 4.35,
  width: 0.92,
  thickness: 0.155,
  segments: 220,
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
  // Re-orthogonalize binormal for a stable ribbon face
  binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

  return { center, tangent, binormal, normal };
}

/**
 * Rim palette matched to reference:
 * cool teal/cyan at the base → magenta/pink mid → warm orange-magenta on upper edges.
 */
function rimColor(t: number, out: THREE.Color) {
  const cyan = new THREE.Color("#2ecfc4");
  const teal = new THREE.Color("#1aa8b8");
  const magenta = new THREE.Color("#e056c5");
  const pink = new THREE.Color("#ff6b9d");
  const orange = new THREE.Color("#ff7a4a");

  if (t < 0.28) {
    const k = t / 0.28;
    return out.copy(cyan).lerp(teal, k * 0.55);
  }
  if (t < 0.55) {
    const k = (t - 0.28) / 0.27;
    return out.copy(teal).lerp(magenta, 0.35 + k * 0.65);
  }
  if (t < 0.78) {
    const k = (t - 0.55) / 0.23;
    return out.copy(magenta).lerp(pink, k);
  }
  return out.copy(pink).lerp(orange, (t - 0.78) / 0.22);
}

/**
 * Soft lilac/cream wash along the helix — readable on metal+clearcoat,
 * warm→cool so faces carry gradient, not only the rim.
 */
function bodyTint(t: number, out: THREE.Color) {
  const cool = new THREE.Color("#c9d4e6"); // cool blue-lilac at base
  const cream = new THREE.Color("#efe6dc"); // soft cream mid
  const lilac = new THREE.Color("#e4d6e8"); // muted lilac
  const warm = new THREE.Color("#f0d5c4"); // peach warmth toward top
  if (t < 0.32) {
    return out.copy(cool).lerp(cream, t / 0.32);
  }
  if (t < 0.62) {
    return out.copy(cream).lerp(lilac, (t - 0.32) / 0.3);
  }
  return out.copy(lilac).lerp(warm, (t - 0.62) / 0.38);
}

/**
 * Thick helical slab — smooth premium body with soft face tint.
 * Cross-section: width × thickness rectangle swept along helix.
 */
function buildRibbonGeometry(p: SpiralParams) {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const tint = new THREE.Color();
  const across = new THREE.Color();

  const hw = p.width * 0.5;
  const ht = p.thickness * 0.5;
  // Local cross-section corners in (binormal, normal) plane
  const corners: [number, number][] = [
    [-hw, -ht],
    [hw, -ht],
    [hw, ht],
    [-hw, ht],
  ];
  const creamWash = new THREE.Color("#f7eee6");
  const coolWash = new THREE.Color("#d2dceb");

  for (let i = 0; i <= p.segments; i++) {
    const t = i / p.segments;
    const { center, binormal, normal } = frameAt(t, p);
    bodyTint(t, tint);

    for (let c = 0; c < 4; c++) {
      const [u, v] = corners[c];
      const pos = center
        .clone()
        .addScaledVector(binormal, u)
        .addScaledVector(normal, v);
      positions.push(pos.x, pos.y, pos.z);
      // Approximate face normal; refined by computeVertexNormals for smooth sides
      const n = normal.clone().multiplyScalar(v >= 0 ? 1 : -1);
      if (Math.abs(u) > hw * 0.85) {
        n.copy(binormal).multiplyScalar(u > 0 ? 1 : -1);
      }
      normals.push(n.x, n.y, n.z);
      // Across-ribbon wash + slight face lift so planes read with depth
      const k = (u / hw + 1) * 0.5;
      across.copy(coolWash).lerp(creamWash, k);
      const face = tint.clone().lerp(across, 0.28);
      const faceLift = Math.abs(v) > ht * 0.5 ? 1.05 : 0.97;
      colors.push(face.r * faceLift, face.g * faceLift, face.b * faceLift);
      uvs.push(t * p.turns, c < 2 ? 0 : 1);
    }

    if (i < p.segments) {
      const a = i * 4;
      const b = a + 4;
      // Side quads
      for (let e = 0; e < 4; e++) {
        const e1 = (e + 1) % 4;
        indices.push(a + e, a + e1, b + e, a + e1, b + e1, b + e);
      }
    }
  }

  // Cap ends
  const last = p.segments * 4;
  indices.push(0, 1, 2, 0, 2, 3);
  indices.push(last + 0, last + 2, last + 1, last + 0, last + 3, last + 2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Thin emissive strip along outer + inner rim edges only. */
function buildRimGeometry(p: SpiralParams, side: 1 | -1, rimHalf = 0.028) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const col = new THREE.Color();
  const hw = p.width * 0.5;
  const ht = p.thickness * 0.5;

  for (let i = 0; i <= p.segments; i++) {
    const t = i / p.segments;
    const { center, tangent, binormal, normal } = frameAt(t, p);
    // Outer/inner edge center, slightly proud of the slab face
    const base = center
      .clone()
      .addScaledVector(binormal, side * hw)
      .addScaledVector(normal, ht + 0.004);

    const a = base
      .clone()
      .addScaledVector(tangent, rimHalf)
      .addScaledVector(binormal, side * 0.012);
    const b = base
      .clone()
      .addScaledVector(tangent, -rimHalf)
      .addScaledVector(binormal, side * -0.006)
      .addScaledVector(normal, -0.01);

    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    rimColor(t, col);
    colors.push(col.r, col.g, col.b, col.r * 0.55, col.g * 0.55, col.b * 0.65);

    if (i < p.segments) {
      const i0 = i * 2;
      indices.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Soft wider halo behind the hard rim — glow bleed onto concrete. */
function buildRimHaloGeometry(p: SpiralParams, side: 1 | -1) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const col = new THREE.Color();
  const hw = p.width * 0.5;
  const ht = p.thickness * 0.5;
  const rimHalf = 0.055;

  for (let i = 0; i <= p.segments; i++) {
    const t = i / p.segments;
    const { center, tangent, binormal, normal } = frameAt(t, p);
    const base = center
      .clone()
      .addScaledVector(binormal, side * (hw - 0.02))
      .addScaledVector(normal, ht + 0.001);

    const a = base
      .clone()
      .addScaledVector(tangent, rimHalf)
      .addScaledVector(binormal, side * 0.03)
      .addScaledVector(normal, 0.012);
    const b = base
      .clone()
      .addScaledVector(tangent, -rimHalf)
      .addScaledVector(binormal, side * -0.05)
      .addScaledVector(normal, -0.02);

    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    rimColor(t, col);
    // Dimmer halo so it reads as soft bleed, not a second hard edge
    colors.push(
      col.r * 0.55,
      col.g * 0.5,
      col.b * 0.6,
      col.r * 0.12,
      col.g * 0.14,
      col.b * 0.18,
    );

    if (i < p.segments) {
      const i0 = i * 2;
      indices.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Soft studio environment for metal/clearcoat reflections —
 * cool floor bounce + warm key, no harsh HDR spikes.
 */
function makeStudioEnv(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.HemisphereLight(0xfff0e6, 0x1a2838, 1.1));
  const key = new THREE.DirectionalLight(0xffe4d4, 1.4);
  key.position.set(3.5, 4.5, 2.5);
  envScene.add(key);
  const cool = new THREE.DirectionalLight(0xa8c4e8, 0.85);
  cool.position.set(-2.5, 1.2, 3);
  envScene.add(cool);
  const magenta = new THREE.DirectionalLight(0xff8ec8, 0.35);
  magenta.position.set(1.2, 0.8, -3);
  envScene.add(magenta);
  const teal = new THREE.PointLight(0x2ecfc4, 0.55, 12, 2);
  teal.position.set(0, -2.5, 1.5);
  envScene.add(teal);
  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  return envMap;
}

/**
 * Dedicated WebGL spiral — polished physical ribbon + neon rim, soft studio lit.
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
        powerPreference: "low-power",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      setFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    // Frame further right — leave left clear for copy
    camera.position.set(3.85, 0.45, 5.55);
    camera.lookAt(1.55, -0.08, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Keep midtones readable on dark page bg (avoid crushed charcoal body)
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
    // Sit on the right; slight lean away from vertical (reference tilt)
    group.position.set(1.62, -0.22, 0);
    const baseTiltX = -0.34;
    const baseTiltZ = 0.2;
    group.rotation.x = baseTiltX;
    group.rotation.z = baseTiltZ;
    scene.add(group);

    const ribbonGeo = buildRibbonGeometry(SPIRAL);
    const ribbonMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ebe6e2"),
      roughness: 0.28,
      metalness: 0.62,
      clearcoat: 0.78,
      clearcoatRoughness: 0.18,
      ior: 1.45,
      flatShading: false,
      vertexColors: true,
      // Quiet fill so deep folds stay readable without flattening shine
      emissive: new THREE.Color("#3a4250"),
      emissiveIntensity: 0.06,
      envMap,
      envMapIntensity: 0.95,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.castShadow = true;
    ribbon.receiveShadow = true;
    group.add(ribbon);

    const rimMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rimOuterGeo = buildRimGeometry(SPIRAL, 1);
    const rimInnerGeo = buildRimGeometry(SPIRAL, -1, 0.022);
    const haloOuterGeo = buildRimHaloGeometry(SPIRAL, 1);
    const haloInnerGeo = buildRimHaloGeometry(SPIRAL, -1);
    const rimOuter = new THREE.Mesh(rimOuterGeo, rimMat);
    const rimInner = new THREE.Mesh(rimInnerGeo, rimMat);
    const haloOuter = new THREE.Mesh(haloOuterGeo, haloMat);
    const haloInner = new THREE.Mesh(haloInnerGeo, haloMat);
    group.add(haloOuter, haloInner, rimOuter, rimInner);

    // Dark soft floor + quiet reflective catcher under the sculpture
    const floorY = -SPIRAL.height * 0.48;
    const floorGeo = new THREE.CircleGeometry(3.6, 48);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#08090c"),
      metalness: 0.55,
      roughness: 0.38,
      clearcoat: 0.25,
      clearcoatRoughness: 0.45,
      transparent: true,
      opacity: 0.52,
      envMap,
      envMapIntensity: 0.45,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(1.62, floorY, 0.2);
    floor.receiveShadow = true;
    scene.add(floor);

    // Cool teal/cyan ground glow under the base (reference)
    const glowGeo = new THREE.CircleGeometry(2.35, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#1fc4c0"),
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(1.65, floorY + 0.01, 0.15);
    scene.add(glow);

    // Soft magenta bloom disc slightly above floor for warm bounce
    const warmGlowGeo = new THREE.CircleGeometry(1.6, 28);
    const warmGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c44aa8"),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warmGlow = new THREE.Mesh(warmGlowGeo, warmGlowMat);
    warmGlow.rotation.x = -Math.PI / 2;
    warmGlow.position.set(1.75, floorY + 0.015, -0.1);
    scene.add(warmGlow);

    // Soft studio lights — shaped for metal/clearcoat without neon candy
    const hemi = new THREE.HemisphereLight(0xf4efe8, 0x2a3545, 0.55);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xb8c0cc, 0.28);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff1e6, 1.15);
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
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 3.5;
    scene.add(key);

    // Camera-facing fill — keeps the ribbon face readable, not a silhouette
    const fill = new THREE.DirectionalLight(0xd8e4f2, 0.62);
    fill.position.set(camera.position.x - 0.4, 1.6, camera.position.z + 0.6);
    scene.add(fill);

    const sideFill = new THREE.DirectionalLight(0xb8c4d8, 0.38);
    sideFill.position.set(-3.5, 1.8, 2.2);
    scene.add(sideFill);

    const rimLight = new THREE.DirectionalLight(0xff8ab8, 0.42);
    rimLight.position.set(1.5, 1.2, -4);
    scene.add(rimLight);

    // Cool bounce from below (reads as floor teal reflection)
    const bounce = new THREE.PointLight(0x2ecfc4, 0.7, 8, 2);
    bounce.position.set(1.7, floorY + 0.4, 1.2);
    scene.add(bounce);

    const warmBounce = new THREE.PointLight(0xff9a6b, 0.48, 7, 2);
    warmBounce.position.set(2.0, 0.6, -1.2);
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

      // Gentle helix turn — keep base tilt, breathe slightly on X
      group.rotation.y = clock.t * 0.26;
      group.rotation.x = baseTiltX + Math.sin(clock.t * 0.4) * 0.03;
      group.rotation.z = baseTiltZ;
      group.position.y = -0.22 + Math.sin(clock.t * 0.5) * 0.04;

      rimMat.opacity = 0.88 + Math.sin(clock.t * 1.05) * 0.08;
      haloMat.opacity = 0.36 + Math.sin(clock.t * 0.85) * 0.08;
      glowMat.opacity = 0.22 + Math.sin(clock.t * 0.85) * 0.06;

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
      rimOuterGeo.dispose();
      rimInnerGeo.dispose();
      haloOuterGeo.dispose();
      haloInnerGeo.dispose();
      rimMat.dispose();
      haloMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
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
