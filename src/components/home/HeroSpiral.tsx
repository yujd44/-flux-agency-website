"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/** Low-poly helical ribbon with concrete body + orange→purple emissive edge. */
function buildSpiralGeometry(
  turns = 2.55,
  radius = 1.45,
  height = 3.9,
  halfWidth = 0.42,
  segments = 90,
) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const orange = new THREE.Color("#ff6a3d");
  const purple = new THREE.Color("#8b5cf6");
  const concrete = new THREE.Color("#6a7078");
  const concreteDark = new THREE.Color("#3a3f48");

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * Math.PI * 2;
    const y = (t - 0.5) * height;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Center of ribbon on helix
    const cx = cos * radius;
    const cz = sin * radius;

    // Tangent along helix
    const tangent = new THREE.Vector3(-sin * radius, height / (turns * Math.PI * 2), cos * radius).normalize();
    const radial = new THREE.Vector3(cos, 0, sin);
    // Ribbon spreads along binormal (perpendicular to tangent in the radial plane)
    let binormal = new THREE.Vector3().crossVectors(tangent, radial).normalize();
    if (binormal.lengthSq() < 0.01) {
      binormal = new THREE.Vector3(0, 1, 0);
    }
    // Slight twist so the face reads as a ribbon, not a tube
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    const outer = new THREE.Vector3(cx, y, cz).addScaledVector(binormal, halfWidth).addScaledVector(normal, 0.02);
    const inner = new THREE.Vector3(cx, y, cz).addScaledVector(binormal, -halfWidth).addScaledVector(normal, -0.05);

    positions.push(outer.x, outer.y, outer.z, inner.x, inner.y, inner.z);

    // Outer edge: emissive warm→cool; inner: cooler concrete
    const edge = orange.clone().lerp(purple, t);
    const body = concreteDark.clone().lerp(concrete, 0.35 + t * 0.4);
    colors.push(edge.r, edge.g, edge.b, body.r, body.g, body.b);

    if (i < segments) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildEdgeGlowGeometry(
  turns = 2.55,
  radius = 1.45,
  height = 3.9,
  segments = 90,
) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const orange = new THREE.Color("#ff8a5c");
  const purple = new THREE.Color("#a78bfa");
  const halfW = 0.055;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * Math.PI * 2;
    const y = (t - 0.5) * height;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const cx = cos * radius;
    const cz = sin * radius;

    const tangent = new THREE.Vector3(-sin * radius, height / (turns * Math.PI * 2), cos * radius).normalize();
    const radial = new THREE.Vector3(cos, 0, sin);
    let binormal = new THREE.Vector3().crossVectors(tangent, radial).normalize();
    if (binormal.lengthSq() < 0.01) binormal = new THREE.Vector3(0, 1, 0);

    // Thin strip along outer helix edge
    const base = new THREE.Vector3(cx, y, cz).addScaledVector(binormal, 0.42);
    const a = base.clone().addScaledVector(tangent, halfW);
    const b = base.clone().addScaledVector(tangent, -halfW).addScaledVector(binormal, 0.04);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);

    const c = orange.clone().lerp(purple, t);
    colors.push(c.r, c.g, c.b, c.r * 0.7, c.g * 0.7, c.b * 0.85);

    if (i < segments) {
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
 * Dedicated WebGL spiral — continuous rotation that reads as a turning helix.
 * Resource-aware: low poly, capped DPR, pauses off-screen / reduced-motion.
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
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      setFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(2.6, 0.35, 5.2);
    camera.lookAt(0.15, 0, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
    });

    const group = new THREE.Group();
    group.rotation.x = -0.18;
    group.rotation.z = 0.12;
    scene.add(group);

    const ribbonGeo = buildSpiralGeometry();
    const ribbonMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.78,
      metalness: 0.12,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    group.add(ribbon);

    const edgeGeo = buildEdgeGlowGeometry();
    const edgeMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    group.add(edge);

    // Soft fill lights — cheap, no shadows
    const key = new THREE.DirectionalLight(0xffc4a8, 1.35);
    key.position.set(3, 2.5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xa78bfa, 0.55);
    fill.position.set(-2.5, 0.5, 2);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0x6a7380, 0.45));

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

      // Continuous spiral turn — primary axis so helix READS as spinning
      group.rotation.y = clock.t * 0.42;
      // Gentle secondary sway + float
      group.rotation.x = -0.18 + Math.sin(clock.t * 0.55) * 0.06;
      group.position.y = Math.sin(clock.t * 0.7) * 0.12;

      // Edge pulse
      edgeMat.opacity = 0.75 + Math.sin(clock.t * 1.4) * 0.2;

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
      edgeGeo.dispose();
      edgeMat.dispose();
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
