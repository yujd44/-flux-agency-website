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
  segments: 420,
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
 * Dark brushed charcoal body — cool graphite base → warmer ash toward top.
 */
function bodyTint(t: number, out: THREE.Color) {
  const cool = new THREE.Color("#3a414c");
  const mid = new THREE.Color("#4a505a");
  const warm = new THREE.Color("#5a5558");
  if (t < 0.45) {
    return out.copy(cool).lerp(mid, t / 0.45);
  }
  return out.copy(mid).lerp(warm, (t - 0.45) / 0.55);
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
  const coolWash = new THREE.Color("#2e343e");
  const warmWash = new THREE.Color("#4e4848");

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
      across.copy(coolWash).lerp(warmWash, k);
      const face = tint.clone().lerp(across, 0.28);
      // Slight face lift so top planes catch studio key light
      const faceLift = v >= 0 ? 1.12 : 0.82;
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
  // Tangents for anisotropic brushed speculars along the helix
  try {
    geo.computeTangents();
  } catch {
    // Older / incomplete geometry — anisotropy falls back gracefully
  }
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
 * Opaque emissive rim tube — physical material, no flat MeshBasic slabs.
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
  // Higher radial count → smooth round tubes, no faceted purple strips
  const radial = 12;
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
 * Contrast-rich studio env — bright key + cool bounce so clearcoat
 * produces sharp hotspots on charcoal curves.
 */
function makeStudioEnv(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.HemisphereLight(0xfff2e8, 0x121820, 0.85));

  // Hard specular anchors in the env map (living reflections while spinning)
  const key = new THREE.DirectionalLight(0xfff4ea, 2.4);
  key.position.set(4.2, 5.8, 2.8);
  envScene.add(key);

  const hot = new THREE.DirectionalLight(0xffffff, 1.8);
  hot.position.set(-1.2, 3.5, 4.5);
  envScene.add(hot);

  const cool = new THREE.DirectionalLight(0xb8d0f0, 1.15);
  cool.position.set(-3.2, 1.4, 2.6);
  envScene.add(cool);

  const magenta = new THREE.DirectionalLight(0xff7ab8, 0.75);
  magenta.position.set(1.4, 0.6, -3.4);
  envScene.add(magenta);

  const teal = new THREE.PointLight(0x2ecfc4, 1.1, 14, 2);
  teal.position.set(0, -2.2, 1.8);
  envScene.add(teal);

  // Small bright spheres act as specular “windows” in the PMREM
  const sparkGeo = new THREE.SphereGeometry(0.35, 16, 12);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfff8f0 });
  const sparkA = new THREE.Mesh(sparkGeo, sparkMat);
  sparkA.position.set(5.5, 6.2, 4.2);
  envScene.add(sparkA);
  const sparkB = new THREE.Mesh(sparkGeo, sparkMat.clone());
  (sparkB.material as THREE.MeshBasicMaterial).color.set(0xe8f0ff);
  sparkB.position.set(-4.8, 3.8, 5.5);
  envScene.add(sparkB);
  const sparkC = new THREE.Mesh(sparkGeo, sparkMat.clone());
  (sparkC.material as THREE.MeshBasicMaterial).color.set(0xffc8e8);
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
 * Dedicated WebGL spiral — opaque physical body + lit rim tubes.
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
    // Slightly wider near plane margin so spinning edges stay in frustum
    const camera = new THREE.PerspectiveCamera(36, 1, 0.2, 60);
    camera.position.set(3.85, 0.45, 5.55);
    camera.lookAt(1.55, -0.08, 0);

    // Higher DPR for cleaner rim edges (AA + denser sampling)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
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
      color: new THREE.Color("#4a5058"),
      roughness: 0.26,
      metalness: 0.86,
      clearcoat: 0.92,
      clearcoatRoughness: 0.08,
      ior: 1.48,
      sheen: 0.35,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color("#c8b0c8"),
      anisotropy: 0.72,
      anisotropyRotation: 0,
      flatShading: false,
      vertexColors: true,
      // Keep charcoal readable without washing out speculars
      emissive: new THREE.Color("#12151c"),
      emissiveIntensity: 0.03,
      envMap,
      envMapIntensity: 1.55,
      side: THREE.FrontSide,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.castShadow = true;
    ribbon.receiveShadow = true;
    group.add(ribbon);

    // Physical neon rims — lit metal + vertex-tinted emissive (no flat Basic slabs)
    const rimMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ffffff"),
      roughness: 0.16,
      metalness: 0.62,
      clearcoat: 0.75,
      clearcoatRoughness: 0.1,
      vertexColors: true,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.72,
      envMap,
      envMapIntensity: 1.05,
      toneMapped: true,
      side: THREE.FrontSide,
    });
    // Tint emissive by vertex color so cyan→magenta→orange stays brand-true
    rimMat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
#ifdef USE_COLOR
  totalEmissiveRadiance *= vColor;
#endif`,
      );
    };
    const rimOuterGeo = buildRimTube(SPIRAL, 1, 0.015, 1.2, 0.004);
    const rimInnerGeo = buildRimTube(SPIRAL, -1, 0.012, 1.1, 0.004);
    const rimOuter = new THREE.Mesh(rimOuterGeo, rimMat);
    const rimInner = new THREE.Mesh(rimInnerGeo, rimMat);
    group.add(rimOuter, rimInner);

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

    const hemi = new THREE.HemisphereLight(0xf4efe8, 0x2a3545, 0.55);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xc0c6d0, 0.22);
    scene.add(ambient);

    // Stronger key — hard specular hotspots on charcoal curves
    const key = new THREE.DirectionalLight(0xfff4ea, 2.15);
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

    const fill = new THREE.DirectionalLight(0xd8e4f2, 0.55);
    fill.position.set(camera.position.x - 0.4, 1.6, camera.position.z + 0.6);
    scene.add(fill);

    const sideFill = new THREE.DirectionalLight(0xb8c4d8, 0.38);
    sideFill.position.set(-3.5, 1.8, 2.2);
    scene.add(sideFill);

    const rimLight = new THREE.DirectionalLight(0xff8ab8, 0.72);
    rimLight.position.set(1.5, 1.2, -4);
    scene.add(rimLight);

    const bounce = new THREE.PointLight(0x2ecfc4, 0.95, 8, 2);
    bounce.position.set(1.7, floorY + 0.4, 1.2);
    scene.add(bounce);

    const warmBounce = new THREE.PointLight(0xff9a6b, 0.7, 7, 2);
    warmBounce.position.set(2.0, 0.6, -1.2);
    scene.add(warmBounce);

    // Moving accent light — living speculars while the helix rotates
    const wander = new THREE.PointLight(0xffe8d8, 1.65, 9, 2);
    wander.position.set(3.2, 2.4, 2.8);
    scene.add(wander);

    const wanderCool = new THREE.PointLight(0xc8dcff, 0.85, 8, 2);
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

      // Gentle helix turn — keep base tilt, slight breath on X/Y
      group.rotation.y = clock.t * 0.22;
      group.rotation.x = baseTiltX + Math.sin(clock.t * 0.4) * 0.025;
      group.rotation.z = baseTiltZ;
      group.position.y = -0.22 + Math.sin(clock.t * 0.5) * 0.035;

      // Orbit key accents around the sculpture for living hotspots
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
      rimMat.dispose();
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
