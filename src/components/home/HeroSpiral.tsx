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

/** Neon rim color: teal (bottom) → purple → orange (top). */
function rimColor(t: number, out: THREE.Color) {
  const teal = new THREE.Color("#2ec4b6");
  const purple = new THREE.Color("#a855f7");
  const orange = new THREE.Color("#ff6a3d");
  if (t < 0.45) {
    return out.copy(teal).lerp(purple, t / 0.45);
  }
  return out.copy(purple).lerp(orange, (t - 0.45) / 0.55);
}

/**
 * Thick helical slab — concrete body (no face gradient).
 * Cross-section: width × thickness rectangle swept along helix.
 */
function buildRibbonGeometry(p: SpiralParams) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const hw = p.width * 0.5;
  const ht = p.thickness * 0.5;
  // Local cross-section corners in (binormal, normal) plane
  const corners: [number, number][] = [
    [-hw, -ht],
    [hw, -ht],
    [hw, ht],
    [-hw, ht],
  ];

  for (let i = 0; i <= p.segments; i++) {
    const t = i / p.segments;
    const { center, binormal, normal } = frameAt(t, p);

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

/** Tiny procedural concrete grain — albedo + roughness variation. */
function makeConcreteMaps(size = 128) {
  const data = new Uint8Array(size * size * 4);
  const rough = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const n = Math.random();
    const g = 92 + Math.floor(n * 38); // cool gray
    data[i * 4] = g;
    data[i * 4 + 1] = g + 2;
    data[i * 4 + 2] = g + 6;
    data[i * 4 + 3] = 255;
    rough[i] = 160 + Math.floor(n * 70);
  }
  const map = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(rough, size, size, THREE.RedFormat);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.needsUpdate = true;

  return { map, roughnessMap };
}

/**
 * Dedicated WebGL spiral — concrete slab + neon rim, studio lit.
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
    // Right-half sculpture framing — leave left clear for copy
    camera.position.set(3.55, 0.55, 5.4);
    camera.lookAt(1.05, -0.05, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
    });

    const group = new THREE.Group();
    group.position.set(1.15, -0.15, 0);
    group.rotation.x = -0.22;
    group.rotation.z = 0.08;
    scene.add(group);

    const { map, roughnessMap } = makeConcreteMaps(128);
    map.repeat.set(3.2, 1.4);
    roughnessMap.repeat.set(3.2, 1.4);

    const ribbonGeo = buildRibbonGeometry(SPIRAL);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#7a8088"),
      map,
      roughnessMap,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: false,
      envMapIntensity: 0.35,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.castShadow = true;
    ribbon.receiveShadow = true;
    group.add(ribbon);

    const rimMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rimOuterGeo = buildRimGeometry(SPIRAL, 1);
    const rimInnerGeo = buildRimGeometry(SPIRAL, -1, 0.022);
    const rimOuter = new THREE.Mesh(rimOuterGeo, rimMat);
    const rimInner = new THREE.Mesh(rimInnerGeo, rimMat);
    group.add(rimOuter, rimInner);

    // Dark reflective floor + soft contact shadow catcher
    const floorY = -SPIRAL.height * 0.48;
    const floorGeo = new THREE.CircleGeometry(3.6, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0a0b0e"),
      metalness: 0.72,
      roughness: 0.28,
      transparent: true,
      opacity: 0.55,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(1.15, floorY, 0.2);
    floor.receiveShadow = true;
    scene.add(floor);

    // Soft ground glow disc (fake AO / neon bounce on floor)
    const glowGeo = new THREE.CircleGeometry(2.2, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#3d2a6b"),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(1.2, floorY + 0.01, 0.15);
    scene.add(glow);

    // Studio lights
    const ambient = new THREE.AmbientLight(0x6a7380, 0.28);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffe2cc, 1.55);
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
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9bb4ff, 0.45);
    fill.position.set(-3.5, 1.8, 2.2);
    scene.add(fill);

    const rimLight = new THREE.DirectionalLight(0xff8a5c, 0.55);
    rimLight.position.set(1.5, 1.2, -4);
    scene.add(rimLight);

    // Cool bounce from below (reads as floor reflection)
    const bounce = new THREE.PointLight(0x2ec4b6, 0.55, 8, 2);
    bounce.position.set(1.4, floorY + 0.4, 1.2);
    scene.add(bounce);

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

      // Continuous helix turn — primary Y so spiral reads as spinning
      group.rotation.y = clock.t * 0.28;
      group.rotation.x = -0.22 + Math.sin(clock.t * 0.45) * 0.035;
      group.position.y = -0.15 + Math.sin(clock.t * 0.55) * 0.05;

      rimMat.opacity = 0.78 + Math.sin(clock.t * 1.1) * 0.12;
      glowMat.opacity = 0.16 + Math.sin(clock.t * 0.9) * 0.06;

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
      rimMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      map.dispose();
      roughnessMap.dispose();
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
