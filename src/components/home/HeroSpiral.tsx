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
  // Dense enough for smooth curves without looking faceted while spinning
  segments: 360,
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
 * Brand rim: teal/cyan base → magenta mid → orange/pink upper edge.
 */
function rimColor(t: number, out: THREE.Color) {
  const cyan = new THREE.Color("#2ee6d8");
  const teal = new THREE.Color("#1ab8c4");
  const magenta = new THREE.Color("#e056c5");
  const violet = new THREE.Color("#b86cff");
  const orange = new THREE.Color("#ff7a45");

  if (t < 0.26) {
    const k = t / 0.26;
    return out.copy(cyan).lerp(teal, k * 0.5);
  }
  if (t < 0.52) {
    const k = (t - 0.26) / 0.26;
    return out.copy(teal).lerp(magenta, 0.25 + k * 0.75);
  }
  if (t < 0.74) {
    const k = (t - 0.52) / 0.22;
    return out.copy(magenta).lerp(violet, k * 0.55);
  }
  return out.copy(violet).lerp(orange, (t - 0.74) / 0.26);
}

/**
 * Readable mid-tone body wash — warm gray / lilac, not charcoal void.
 */
function bodyTint(t: number, out: THREE.Color) {
  const cool = new THREE.Color("#c5d0e4");
  const cream = new THREE.Color("#ebe2d8");
  const lilac = new THREE.Color("#ddd0e4");
  const warm = new THREE.Color("#edd4c4");
  if (t < 0.32) {
    return out.copy(cool).lerp(cream, t / 0.32);
  }
  if (t < 0.62) {
    return out.copy(cream).lerp(lilac, (t - 0.32) / 0.3);
  }
  return out.copy(lilac).lerp(warm, (t - 0.62) / 0.38);
}

/**
 * Opaque helical slab — width × thickness rectangle swept along helix.
 * Opaque only: no transparency sorting / shreds when layers overlap.
 */
function buildRibbonGeometry(p: SpiralParams) {
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const tint = new THREE.Color();
  const across = new THREE.Color();

  const hw = p.width * 0.5;
  const ht = p.thickness * 0.5;
  const corners: [number, number][] = [
    [-hw, -ht],
    [hw, -ht],
    [hw, ht],
    [-hw, ht],
  ];
  const creamWash = new THREE.Color("#f4ebe3");
  const coolWash = new THREE.Color("#d0dae8");

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

      const k = (u / hw + 1) * 0.5;
      across.copy(coolWash).lerp(creamWash, k);
      const face = tint.clone().lerp(across, 0.32);
      // Slight face lift so top planes read brighter than underside
      const faceLift = v >= 0 ? 1.08 : 0.92;
      colors.push(face.r * faceLift, face.g * faceLift, face.b * faceLift);
      uvs.push(t * p.turns, c < 2 ? 0 : 1);
    }

    if (i < p.segments) {
      const a = i * 4;
      const b = a + 4;
      for (let e = 0; e < 4; e++) {
        const e1 = (e + 1) % 4;
        indices.push(a + e, a + e1, b + e, a + e1, b + e1, b + e);
      }
    }
  }

  const last = p.segments * 4;
  indices.push(0, 1, 2, 0, 2, 3);
  indices.push(last + 0, last + 2, last + 1, last + 0, last + 3, last + 2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Path along outer/inner top rim of the slab. */
function rimPath(p: SpiralParams, side: 1 | -1, lift = 0.003): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const hw = p.width * 0.5;
  const ht = p.thickness * 0.5;
  for (let i = 0; i <= p.segments; i++) {
    const t = i / p.segments;
    const { center, binormal, normal } = frameAt(t, p);
    pts.push(
      center
        .clone()
        .addScaledVector(binormal, side * hw)
        .addScaledVector(normal, ht + lift),
    );
  }
  return pts;
}

/**
 * Opaque emissive rim tube — no transparency, no DoubleSide shreds.
 * Vertex colors follow brand teal → magenta → orange along the helix.
 */
function buildRimTube(
  p: SpiralParams,
  side: 1 | -1,
  tubeRadius: number,
  colorScale = 1,
  lift = 0.003,
) {
  const pts = rimPath(p, side, lift);
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.35);
  const tubular = p.segments;
  const radial = 6;
  const geo = new THREE.TubeGeometry(curve, tubular, tubeRadius, radial, false);

  const col = new THREE.Color();
  const colors = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    rimColor(t, col);
    col.multiplyScalar(colorScale);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      colors[idx * 3] = col.r;
      colors[idx * 3 + 1] = col.g;
      colors[idx * 3 + 2] = col.b;
    }
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
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
  envScene.add(new THREE.HemisphereLight(0xfff2e8, 0x1a2838, 1.25));
  const key = new THREE.DirectionalLight(0xffe8d8, 1.55);
  key.position.set(3.5, 4.5, 2.5);
  envScene.add(key);
  const cool = new THREE.DirectionalLight(0xb0c8ec, 0.95);
  cool.position.set(-2.5, 1.2, 3);
  envScene.add(cool);
  const magenta = new THREE.DirectionalLight(0xff8ec8, 0.45);
  magenta.position.set(1.2, 0.8, -3);
  envScene.add(magenta);
  const teal = new THREE.PointLight(0x2ecfc4, 0.7, 12, 2);
  teal.position.set(0, -2.5, 1.5);
  envScene.add(teal);
  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  return envMap;
}

/**
 * Dedicated WebGL spiral — opaque physical body + emissive rim tubes.
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
    // Slightly wider near plane margin so spinning edges stay in frustum
    const camera = new THREE.PerspectiveCamera(36, 1, 0.2, 60);
    camera.position.set(3.85, 0.45, 5.55);
    camera.lookAt(1.55, -0.08, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
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
      color: new THREE.Color("#f0ebe6"),
      roughness: 0.32,
      metalness: 0.38,
      clearcoat: 0.92,
      clearcoatRoughness: 0.14,
      ior: 1.45,
      flatShading: false,
      vertexColors: true,
      // Quiet fill so folds stay readable against dark page bg
      emissive: new THREE.Color("#4a4558"),
      emissiveIntensity: 0.09,
      envMap,
      envMapIntensity: 1.05,
      side: THREE.FrontSide,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.castShadow = true;
    ribbon.receiveShadow = true;
    group.add(ribbon);

    // Opaque rim tubes — hard edge + softer wider tube (no alpha sorting)
    const rimMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      toneMapped: false,
      side: THREE.FrontSide,
    });
    const haloMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      toneMapped: false,
      side: THREE.FrontSide,
    });
    const rimOuterGeo = buildRimTube(SPIRAL, 1, 0.016, 1.05, 0.004);
    const rimInnerGeo = buildRimTube(SPIRAL, -1, 0.013, 0.95, 0.004);
    const haloOuterGeo = buildRimTube(SPIRAL, 1, 0.038, 0.38, 0.002);
    const haloInnerGeo = buildRimTube(SPIRAL, -1, 0.032, 0.32, 0.002);
    const rimOuter = new THREE.Mesh(rimOuterGeo, rimMat);
    const rimInner = new THREE.Mesh(rimInnerGeo, rimMat);
    const haloOuter = new THREE.Mesh(haloOuterGeo, haloMat);
    const haloInner = new THREE.Mesh(haloInnerGeo, haloMat);
    // Draw soft glow first, hard rim on top; both write depth → no shreds
    group.add(haloOuter, haloInner, rimOuter, rimInner);

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

    // Opaque contact shadow catcher — real soft shadow without alpha shreds
    const shadowCatcherGeo = new THREE.CircleGeometry(2.8, 48);
    const shadowCatcherMat = new THREE.ShadowMaterial({
      opacity: 0.45,
    });
    const shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.set(1.62, floorY + 0.002, 0.2);
    shadowCatcher.receiveShadow = true;
    scene.add(shadowCatcher);

    const glowGeo = new THREE.CircleGeometry(2.35, 40);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#1fc4c0"),
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(1.65, floorY + 0.008, 0.15);
    scene.add(glow);

    const warmGlowGeo = new THREE.CircleGeometry(1.6, 32);
    const warmGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c44aa8"),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warmGlow = new THREE.Mesh(warmGlowGeo, warmGlowMat);
    warmGlow.rotation.x = -Math.PI / 2;
    warmGlow.position.set(1.75, floorY + 0.012, -0.1);
    scene.add(warmGlow);

    const hemi = new THREE.HemisphereLight(0xf4efe8, 0x2a3545, 0.62);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xc0c6d0, 0.32);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff1e6, 1.25);
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

    const fill = new THREE.DirectionalLight(0xd8e4f2, 0.7);
    fill.position.set(camera.position.x - 0.4, 1.6, camera.position.z + 0.6);
    scene.add(fill);

    const sideFill = new THREE.DirectionalLight(0xb8c4d8, 0.42);
    sideFill.position.set(-3.5, 1.8, 2.2);
    scene.add(sideFill);

    const rimLight = new THREE.DirectionalLight(0xff8ab8, 0.5);
    rimLight.position.set(1.5, 1.2, -4);
    scene.add(rimLight);

    const bounce = new THREE.PointLight(0x2ecfc4, 0.78, 8, 2);
    bounce.position.set(1.7, floorY + 0.4, 1.2);
    scene.add(bounce);

    const warmBounce = new THREE.PointLight(0xff9a6b, 0.55, 7, 2);
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

      // Gentle helix turn — keep base tilt, slight breath on X/Y
      group.rotation.y = clock.t * 0.22;
      group.rotation.x = baseTiltX + Math.sin(clock.t * 0.4) * 0.025;
      group.rotation.z = baseTiltZ;
      group.position.y = -0.22 + Math.sin(clock.t * 0.5) * 0.035;

      glowMat.opacity = 0.2 + Math.sin(clock.t * 0.85) * 0.05;

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
