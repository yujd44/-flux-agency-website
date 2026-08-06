import * as THREE from "three";
import type { QualityTier } from "./qualityTier";

/**
 * Service-themed 3D figures for StageScene — composed MeshPhysical meshes
 * (laptop, wifi, router, globe, cloud, phone, server, browser, gear, desktop,
 * headphones, chip, keyboard, mouse, database, code, tablet, antenna, usb).
 */

export type ServiceFigureKind =
  | "laptop"
  | "desktop"
  | "wifi"
  | "router"
  | "globe"
  | "cloud"
  | "phone"
  | "server"
  | "browser"
  | "gear"
  | "headphones"
  | "chip"
  | "keyboard"
  | "mouse"
  | "database"
  | "code"
  | "tablet"
  | "antenna"
  | "usb";
export type FigureStyle = "glass" | "metal" | "accent";

export type ServiceFigureBuild = {
  root: THREE.Group;
  /** Content group — rotate / breathe this, keep root for position. */
  content: THREE.Group;
  mats: THREE.MeshPhysicalMaterial[];
  pick: THREE.Object3D[];
  /** Collision sphere radius at the given size. */
  radius: number;
};

type MatOpts = {
  tint: THREE.Color;
  envMap: THREE.Texture | null;
  style: FigureStyle;
  navy: THREE.Color;
  metal: THREE.Color;
  /** Drop clearcoat / lower reflections on weak GPUs. */
  simplifyMaterials?: boolean;
};

/** Shared unit primitives — scale per part; dispose once via pool.dispose(). */
export class ServiceFigurePool {
  readonly box: THREE.BoxGeometry;
  readonly sphere: THREE.SphereGeometry;
  readonly cyl: THREE.CylinderGeometry;
  readonly torus: THREE.TorusGeometry;
  readonly torusFull: THREE.TorusGeometry;

  constructor(tier: QualityTier = "high") {
    this.box = new THREE.BoxGeometry(1, 1, 1);
    if (tier === "low") {
      this.sphere = new THREE.SphereGeometry(1, 10, 8);
      this.cyl = new THREE.CylinderGeometry(1, 1, 1, 8, 1);
      this.torus = new THREE.TorusGeometry(1, 0.12, 6, 14, Math.PI * 0.85);
      this.torusFull = new THREE.TorusGeometry(1, 0.14, 6, 12);
    } else if (tier === "medium") {
      this.sphere = new THREE.SphereGeometry(1, 12, 10);
      this.cyl = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
      this.torus = new THREE.TorusGeometry(1, 0.12, 7, 18, Math.PI * 0.85);
      this.torusFull = new THREE.TorusGeometry(1, 0.14, 7, 16);
    } else {
      this.sphere = new THREE.SphereGeometry(1, 16, 12);
      this.cyl = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
      this.torus = new THREE.TorusGeometry(1, 0.12, 8, 24, Math.PI * 0.85);
      this.torusFull = new THREE.TorusGeometry(1, 0.14, 8, 20);
    }
  }

  dispose() {
    this.box.dispose();
    this.sphere.dispose();
    this.cyl.dispose();
    this.torus.dispose();
    this.torusFull.dispose();
  }

  private makeMat(
    opts: MatOpts,
    overrides?: Partial<THREE.MeshPhysicalMaterialParameters> & {
      tintMix?: number;
      emissiveBoost?: number;
      style?: FigureStyle;
    },
  ) {
    const { tint, envMap, navy, metal } = opts;
    const simplify = Boolean(opts.simplifyMaterials);
    const style = overrides?.style ?? opts.style;
    const tintMix = overrides?.tintMix ?? 0.25;
    const emissiveBoost = overrides?.emissiveBoost ?? 1;
    const {
      tintMix: _tm,
      emissiveBoost: _eb,
      style: _st,
      ...matOverrides
    } = overrides ?? {};
    void _tm;
    void _eb;
    void _st;

    const isGlass = style === "glass";
    const isAccent = style === "accent";
    const baseColor = isAccent
      ? new THREE.Color("#d8fff0")
      : isGlass
        ? tint.clone().lerp(navy, tintMix)
        : metal.clone().lerp(tint, 0.35);

    const mat = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      emissive: isAccent ? tint.clone().lerp(new THREE.Color("#3dff9a"), 0.4) : tint,
      emissiveIntensity: emissiveBoost * (isGlass ? 0.2 : isAccent ? 0.45 : 0.12),
      roughness: isGlass ? (simplify ? 0.28 : 0.12) : isAccent ? 0.16 : 0.24,
      metalness: isGlass ? 0.4 : isAccent ? 0.78 : 0.9,
      clearcoat: simplify ? 0 : 1,
      clearcoatRoughness: simplify ? 1 : isGlass ? 0.08 : 0.14,
      ior: 1.45,
      specularIntensity: simplify ? 0.55 : 1,
      specularColor: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: isGlass ? 0.68 : isAccent ? 0.84 : 0.9,
      depthWrite: !isGlass,
      envMap: envMap ?? undefined,
      envMapIntensity: envMap ? (isGlass ? (simplify ? 0.85 : 1.55) : simplify ? 0.75 : 1.4) : 0,
      side: THREE.FrontSide,
      ...matOverrides,
    });
    mat.userData.baseOpacity = mat.opacity;
    mat.userData.baseEmissive = mat.emissiveIntensity;
    return mat;
  }

  private addMesh(
    parent: THREE.Group,
    geo: THREE.BufferGeometry,
    mat: THREE.MeshPhysicalMaterial,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.set(rx, ry, rz);
    parent.add(mesh);
    pick.push(mesh);
    if (!mats.includes(mat)) mats.push(mat);
    return mesh;
  }

  build(kind: ServiceFigureKind, size: number, opts: MatOpts): ServiceFigureBuild {
    const root = new THREE.Group();
    const content = new THREE.Group();
    root.add(content);
    const pick: THREE.Object3D[] = [];
    const mats: THREE.MeshPhysicalMaterial[] = [];
    const s = size;

    switch (kind) {
      case "laptop":
        this.buildLaptop(content, s, opts, pick, mats);
        break;
      case "desktop":
        this.buildDesktop(content, s, opts, pick, mats);
        break;
      case "wifi":
        this.buildWifi(content, s, opts, pick, mats);
        break;
      case "router":
        this.buildRouter(content, s, opts, pick, mats);
        break;
      case "globe":
        this.buildGlobe(content, s, opts, pick, mats);
        break;
      case "cloud":
        this.buildCloud(content, s, opts, pick, mats);
        break;
      case "phone":
        this.buildPhone(content, s, opts, pick, mats);
        break;
      case "server":
        this.buildServer(content, s, opts, pick, mats);
        break;
      case "browser":
        this.buildBrowser(content, s, opts, pick, mats);
        break;
      case "gear":
        this.buildGear(content, s, opts, pick, mats);
        break;
      case "headphones":
        this.buildHeadphones(content, s, opts, pick, mats);
        break;
      case "chip":
        this.buildChip(content, s, opts, pick, mats);
        break;
      case "keyboard":
        this.buildKeyboard(content, s, opts, pick, mats);
        break;
      case "mouse":
        this.buildMouse(content, s, opts, pick, mats);
        break;
      case "database":
        this.buildDatabase(content, s, opts, pick, mats);
        break;
      case "code":
        this.buildCode(content, s, opts, pick, mats);
        break;
      case "tablet":
        this.buildTablet(content, s, opts, pick, mats);
        break;
      case "antenna":
        this.buildAntenna(content, s, opts, pick, mats);
        break;
      case "usb":
        this.buildUsb(content, s, opts, pick, mats);
        break;
    }

    return {
      root,
      content,
      mats,
      pick,
      radius: collisionRadius(kind, s),
    };
  }

  private buildLaptop(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const body = this.makeMat(opts, { tintMix: 0.2 });
    const screen = this.makeMat(opts, {
      tintMix: 0.35,
      opacity: opts.style === "glass" ? 0.55 : 0.78,
      emissiveBoost: 1.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const accent = this.makeMat(opts, {
      style: "accent",
      emissiveBoost: 0.7,
      opacity: 0.9,
    });
    mats.push(body, screen, accent);

    // Base / keyboard deck
    this.addMesh(g, this.box, body, pick, mats, 0, -s * 0.12, 0, s * 1.55, s * 0.1, s * 1.05);
    // Trackpad
    this.addMesh(
      g,
      this.box,
      accent,
      pick,
      mats,
      0,
      -s * 0.05,
      s * 0.12,
      s * 0.42,
      s * 0.04,
      s * 0.32,
    );
    // Screen — hinged back
    this.addMesh(
      g,
      this.box,
      screen,
      pick,
      mats,
      0,
      s * 0.42,
      -s * 0.42,
      s * 1.5,
      s * 0.95,
      s * 0.08,
      -0.55,
      0,
      0,
    );
    // Bezel lip
    this.addMesh(
      g,
      this.box,
      body,
      pick,
      mats,
      0,
      s * 0.42,
      -s * 0.46,
      s * 1.52,
      s * 0.98,
      s * 0.035,
      -0.55,
      0,
      0,
    );
  }

  private buildDesktop(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const frame = this.makeMat(opts);
    const glass = this.makeMat(opts, {
      tintMix: 0.4,
      opacity: 0.5,
      depthWrite: false,
      emissiveBoost: 1.2,
      side: THREE.DoubleSide,
    });
    mats.push(frame, glass);

    // Monitor body
    this.addMesh(g, this.box, frame, pick, mats, 0, s * 0.35, 0, s * 1.45, s * 0.95, s * 0.1);
    // Screen glass
    this.addMesh(
      g,
      this.box,
      glass,
      pick,
      mats,
      0,
      s * 0.35,
      s * 0.06,
      s * 1.28,
      s * 0.78,
      s * 0.04,
    );
    // Neck
    this.addMesh(g, this.cyl, frame, pick, mats, 0, -s * 0.25, 0, s * 0.08, s * 0.35, s * 0.08);
    // Base
    this.addMesh(g, this.cyl, frame, pick, mats, 0, -s * 0.48, 0, s * 0.42, s * 0.06, s * 0.42);
  }

  private buildWifi(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const core = this.makeMat(opts, { emissiveBoost: 1.3 });
    const arc = this.makeMat(opts, {
      tintMix: 0.15,
      opacity: opts.style === "glass" ? 0.62 : 0.8,
      emissiveBoost: 1.1,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mats.push(core, arc);

    // Dot
    this.addMesh(g, this.sphere, core, pick, mats, 0, -s * 0.45, 0, s * 0.14, s * 0.14, s * 0.14);
    // Signal arcs (partial torus), stacked
    for (let i = 0; i < 3; i++) {
      const r = s * (0.28 + i * 0.22);
      this.addMesh(
        g,
        this.torus,
        arc,
        pick,
        mats,
        0,
        -s * 0.35 + i * s * 0.08,
        0,
        r,
        r,
        r * 0.9,
        -Math.PI / 2 + 0.15,
        0,
        Math.PI,
      );
    }
  }

  private buildRouter(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const body = this.makeMat(opts, { metalness: 0.88, roughness: 0.26 });
    const accent = this.makeMat(opts, {
      style: "accent",
      emissiveBoost: 1.4,
      opacity: 0.92,
    });
    mats.push(body, accent);

    // Chassis
    this.addMesh(g, this.box, body, pick, mats, 0, -s * 0.08, 0, s * 1.15, s * 0.28, s * 0.7);
    // Status LEDs
    for (let i = 0; i < 4; i++) {
      this.addMesh(
        g,
        this.sphere,
        accent,
        pick,
        mats,
        -s * 0.35 + i * s * 0.22,
        -s * 0.02,
        s * 0.38,
        s * 0.045,
        s * 0.045,
        s * 0.045,
      );
    }
    // Antennas
    for (let i = 0; i < 3; i++) {
      const x = -s * 0.35 + i * s * 0.35;
      this.addMesh(
        g,
        this.cyl,
        body,
        pick,
        mats,
        x,
        s * 0.42,
        -s * 0.05,
        s * 0.035,
        s * 0.7,
        s * 0.035,
        0,
        0,
        (i - 1) * 0.18,
      );
      this.addMesh(
        g,
        this.sphere,
        accent,
        pick,
        mats,
        x,
        s * 0.78,
        -s * 0.05,
        s * 0.05,
        s * 0.05,
        s * 0.05,
      );
    }
  }

  private buildGlobe(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const shell = this.makeMat(opts, {
      tintMix: 0.35,
      opacity: opts.style === "glass" ? 0.42 : 0.62,
      depthWrite: false,
      emissiveBoost: 0.95,
      side: THREE.DoubleSide,
    });
    const ring = this.makeMat(opts, {
      emissiveBoost: 1.2,
      opacity: 0.88,
      metalness: 0.85,
    });
    mats.push(shell, ring);

    // Sphere
    this.addMesh(g, this.sphere, shell, pick, mats, 0, 0, 0, s * 0.55, s * 0.55, s * 0.55);
    // Equator
    this.addMesh(
      g,
      this.torusFull,
      ring,
      pick,
      mats,
      0,
      0,
      0,
      s * 0.58,
      s * 0.58,
      s * 0.58,
      Math.PI / 2,
      0,
      0,
    );
    // Meridian
    this.addMesh(
      g,
      this.torusFull,
      ring,
      pick,
      mats,
      0,
      0,
      0,
      s * 0.58,
      s * 0.58,
      s * 0.58,
      0,
      0,
      0,
    );
    // Tilted orbit ring (network path)
    this.addMesh(
      g,
      this.torusFull,
      ring,
      pick,
      mats,
      0,
      0,
      0,
      s * 0.72,
      s * 0.72,
      s * 0.72,
      0.7,
      0.4,
      0.2,
    );
    // Hub nodes on orbit
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      this.addMesh(
        g,
        this.sphere,
        ring,
        pick,
        mats,
        Math.cos(a) * s * 0.72,
        Math.sin(a) * s * 0.35,
        Math.sin(a) * s * 0.55,
        s * 0.07,
        s * 0.07,
        s * 0.07,
      );
    }
  }

  private buildHeadphones(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const band = this.makeMat(opts, { metalness: 0.9, roughness: 0.22 });
    const cup = this.makeMat(opts, {
      style: "accent",
      emissiveBoost: 1.05,
      opacity: 0.9,
    });
    mats.push(band, cup);

    // Headband (partial torus)
    this.addMesh(
      g,
      this.torus,
      band,
      pick,
      mats,
      0,
      s * 0.15,
      0,
      s * 0.55,
      s * 0.55,
      s * 0.55,
      0,
      0,
      Math.PI,
    );
    // Ear cups
    this.addMesh(
      g,
      this.cyl,
      cup,
      pick,
      mats,
      -s * 0.52,
      -s * 0.05,
      0,
      s * 0.22,
      s * 0.16,
      s * 0.22,
      0,
      0,
      Math.PI / 2,
    );
    this.addMesh(
      g,
      this.cyl,
      cup,
      pick,
      mats,
      s * 0.52,
      -s * 0.05,
      0,
      s * 0.22,
      s * 0.16,
      s * 0.22,
      0,
      0,
      Math.PI / 2,
    );
    // Inner pads
    this.addMesh(
      g,
      this.sphere,
      band,
      pick,
      mats,
      -s * 0.48,
      -s * 0.05,
      s * 0.02,
      s * 0.12,
      s * 0.14,
      s * 0.1,
    );
    this.addMesh(
      g,
      this.sphere,
      band,
      pick,
      mats,
      s * 0.48,
      -s * 0.05,
      s * 0.02,
      s * 0.12,
      s * 0.14,
      s * 0.1,
    );
  }

  private buildCloud(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const puff = this.makeMat(opts, {
      tintMix: 0.22,
      opacity: opts.style === "glass" ? 0.58 : 0.82,
      roughness: 0.18,
      emissiveBoost: 0.9,
    });
    mats.push(puff);

    this.addMesh(g, this.sphere, puff, pick, mats, 0, 0, 0, s * 0.55, s * 0.42, s * 0.48);
    this.addMesh(
      g,
      this.sphere,
      puff,
      pick,
      mats,
      -s * 0.38,
      -s * 0.05,
      s * 0.05,
      s * 0.38,
      s * 0.32,
      s * 0.35,
    );
    this.addMesh(
      g,
      this.sphere,
      puff,
      pick,
      mats,
      s * 0.4,
      -s * 0.02,
      -s * 0.04,
      s * 0.42,
      s * 0.34,
      s * 0.38,
    );
    this.addMesh(
      g,
      this.sphere,
      puff,
      pick,
      mats,
      s * 0.08,
      s * 0.28,
      0,
      s * 0.36,
      s * 0.3,
      s * 0.32,
    );
  }

  private buildPhone(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const shell = this.makeMat(opts);
    const screen = this.makeMat(opts, {
      tintMix: 0.4,
      opacity: 0.55,
      depthWrite: false,
      emissiveBoost: 1.35,
      side: THREE.DoubleSide,
    });
    const bubble = this.makeMat(opts, { emissiveBoost: 1.1, opacity: 0.75 });
    mats.push(shell, screen, bubble);

    // Handset
    this.addMesh(g, this.box, shell, pick, mats, 0, 0, 0, s * 0.55, s * 1.15, s * 0.12);
    // Screen
    this.addMesh(
      g,
      this.box,
      screen,
      pick,
      mats,
      0,
      s * 0.02,
      s * 0.07,
      s * 0.44,
      s * 0.95,
      s * 0.04,
    );
    // Chat bubble
    this.addMesh(
      g,
      this.box,
      bubble,
      pick,
      mats,
      s * 0.55,
      s * 0.25,
      s * 0.05,
      s * 0.38,
      s * 0.22,
      s * 0.08,
    );
    this.addMesh(
      g,
      this.box,
      bubble,
      pick,
      mats,
      s * 0.42,
      s * 0.08,
      s * 0.05,
      s * 0.12,
      s * 0.1,
      s * 0.08,
    );
  }

  private buildServer(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const chassis = this.makeMat(opts, { metalness: 0.95, roughness: 0.28 });
    const bay = this.makeMat(opts, {
      tintMix: 0.1,
      opacity: 0.85,
      emissiveBoost: 0.8,
    });
    const led = this.makeMat(opts, {
      emissiveBoost: 2.2,
      opacity: 0.95,
      color: new THREE.Color("#e8fff4"),
    });
    mats.push(chassis, bay, led);

    // Tower / rack body
    this.addMesh(g, this.box, chassis, pick, mats, 0, 0, 0, s * 0.7, s * 1.35, s * 0.55);
    // Drive bays
    for (let i = 0; i < 4; i++) {
      const y = s * 0.42 - i * s * 0.28;
      this.addMesh(
        g,
        this.box,
        bay,
        pick,
        mats,
        0,
        y,
        s * 0.28,
        s * 0.55,
        s * 0.14,
        s * 0.06,
      );
      this.addMesh(
        g,
        this.sphere,
        led,
        pick,
        mats,
        -s * 0.2,
        y,
        s * 0.34,
        s * 0.04,
        s * 0.04,
        s * 0.04,
      );
    }
  }

  private buildBrowser(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const chrome = this.makeMat(opts);
    const glass = this.makeMat(opts, {
      tintMix: 0.45,
      opacity: 0.48,
      depthWrite: false,
      emissiveBoost: 1.1,
      side: THREE.DoubleSide,
    });
    const bar = this.makeMat(opts, { emissiveBoost: 0.9, opacity: 0.88 });
    mats.push(chrome, glass, bar);

    // Window frame
    this.addMesh(g, this.box, chrome, pick, mats, 0, 0, 0, s * 1.55, s * 1.1, s * 0.08);
    // Content glass
    this.addMesh(
      g,
      this.box,
      glass,
      pick,
      mats,
      0,
      -s * 0.08,
      s * 0.05,
      s * 1.4,
      s * 0.82,
      s * 0.04,
    );
    // Title bar
    this.addMesh(
      g,
      this.box,
      bar,
      pick,
      mats,
      0,
      s * 0.48,
      s * 0.05,
      s * 1.42,
      s * 0.16,
      s * 0.045,
    );
    // Traffic lights
    for (let i = 0; i < 3; i++) {
      this.addMesh(
        g,
        this.sphere,
        bar,
        pick,
        mats,
        -s * 0.58 + i * s * 0.14,
        s * 0.48,
        s * 0.1,
        s * 0.045,
        s * 0.045,
        s * 0.045,
      );
    }
    // Fake code lines
    for (let row = 0; row < 3; row++) {
      const w = s * (0.55 + (row % 2) * 0.25);
      this.addMesh(
        g,
        this.box,
        bar,
        pick,
        mats,
        -s * 0.35 + w * 0.15,
        s * 0.15 - row * s * 0.2,
        s * 0.08,
        w,
        s * 0.06,
        s * 0.03,
      );
    }
  }

  private buildGear(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const ring = this.makeMat(opts, { metalness: 0.92, roughness: 0.22 });
    const hub = this.makeMat(opts, { emissiveBoost: 1.15, opacity: 0.9 });
    mats.push(ring, hub);

    // Outer ring
    this.addMesh(g, this.torusFull, ring, pick, mats, 0, 0, 0, s * 0.55, s * 0.55, s * 0.55);
    // Hub
    this.addMesh(g, this.cyl, hub, pick, mats, 0, 0, 0, s * 0.22, s * 0.18, s * 0.22, Math.PI / 2);
    // Teeth
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const x = Math.cos(a) * s * 0.62;
      const y = Math.sin(a) * s * 0.62;
      this.addMesh(
        g,
        this.box,
        ring,
        pick,
        mats,
        x,
        y,
        0,
        s * 0.18,
        s * 0.22,
        s * 0.14,
        0,
        0,
        a,
      );
    }
  }

  private buildChip(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const body = this.makeMat(opts, { metalness: 0.55, roughness: 0.35 });
    const pin = this.makeMat(opts, { style: "accent", emissiveBoost: 0.85, opacity: 0.9 });
    const die = this.makeMat(opts, {
      tintMix: 0.4,
      opacity: 0.72,
      emissiveBoost: 1.2,
      depthWrite: false,
    });
    mats.push(body, pin, die);

    // Package
    this.addMesh(g, this.box, body, pick, mats, 0, 0, 0, s * 0.85, s * 0.18, s * 0.85);
    // Silicon die
    this.addMesh(g, this.box, die, pick, mats, 0, s * 0.1, 0, s * 0.42, s * 0.06, s * 0.42);
    // Pins on four sides
    for (let i = 0; i < 4; i++) {
      const x = -s * 0.28 + i * s * 0.18;
      this.addMesh(g, this.box, pin, pick, mats, x, 0, s * 0.55, s * 0.08, s * 0.05, s * 0.22);
      this.addMesh(g, this.box, pin, pick, mats, x, 0, -s * 0.55, s * 0.08, s * 0.05, s * 0.22);
      this.addMesh(g, this.box, pin, pick, mats, s * 0.55, 0, x, s * 0.22, s * 0.05, s * 0.08);
      this.addMesh(g, this.box, pin, pick, mats, -s * 0.55, 0, x, s * 0.22, s * 0.05, s * 0.08);
    }
  }

  private buildKeyboard(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const deck = this.makeMat(opts, { metalness: 0.7, roughness: 0.3 });
    const key = this.makeMat(opts, { style: "accent", emissiveBoost: 0.7, opacity: 0.88 });
    mats.push(deck, key);

    this.addMesh(g, this.box, deck, pick, mats, 0, -s * 0.05, 0, s * 1.7, s * 0.12, s * 0.75);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        this.addMesh(
          g,
          this.box,
          key,
          pick,
          mats,
          -s * 0.58 + col * s * 0.29,
          s * 0.04,
          -s * 0.2 + row * s * 0.2,
          s * 0.22,
          s * 0.07,
          s * 0.15,
        );
      }
    }
  }

  private buildMouse(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const shell = this.makeMat(opts);
    const accent = this.makeMat(opts, { style: "accent", emissiveBoost: 1.1, opacity: 0.9 });
    mats.push(shell, accent);

    // Body
    this.addMesh(g, this.sphere, shell, pick, mats, 0, 0, 0, s * 0.38, s * 0.22, s * 0.55);
    // Split line / buttons
    this.addMesh(g, this.box, accent, pick, mats, 0, s * 0.12, -s * 0.05, s * 0.04, s * 0.05, s * 0.45);
    // Scroll wheel
    this.addMesh(
      g,
      this.cyl,
      accent,
      pick,
      mats,
      0,
      s * 0.14,
      -s * 0.05,
      s * 0.08,
      s * 0.1,
      s * 0.08,
      0,
      0,
      Math.PI / 2,
    );
  }

  private buildDatabase(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const disk = this.makeMat(opts, { tintMix: 0.25, emissiveBoost: 0.95 });
    const rim = this.makeMat(opts, { style: "accent", emissiveBoost: 1.15, opacity: 0.88 });
    mats.push(disk, rim);

    for (let i = 0; i < 3; i++) {
      const y = s * 0.38 - i * s * 0.38;
      this.addMesh(g, this.cyl, disk, pick, mats, 0, y, 0, s * 0.55, s * 0.16, s * 0.55);
      this.addMesh(
        g,
        this.torusFull,
        rim,
        pick,
        mats,
        0,
        y,
        0,
        s * 0.56,
        s * 0.56,
        s * 0.56,
        Math.PI / 2,
        0,
        0,
      );
    }
  }

  private buildCode(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const bar = this.makeMat(opts, { emissiveBoost: 1.25, opacity: 0.9 });
    mats.push(bar);

    // Left chevron <
    this.addMesh(
      g,
      this.box,
      bar,
      pick,
      mats,
      -s * 0.35,
      s * 0.18,
      0,
      s * 0.45,
      s * 0.1,
      s * 0.08,
      0,
      0,
      0.55,
    );
    this.addMesh(
      g,
      this.box,
      bar,
      pick,
      mats,
      -s * 0.35,
      -s * 0.18,
      0,
      s * 0.45,
      s * 0.1,
      s * 0.08,
      0,
      0,
      -0.55,
    );
    // Right chevron >
    this.addMesh(
      g,
      this.box,
      bar,
      pick,
      mats,
      s * 0.35,
      s * 0.18,
      0,
      s * 0.45,
      s * 0.1,
      s * 0.08,
      0,
      0,
      -0.55,
    );
    this.addMesh(
      g,
      this.box,
      bar,
      pick,
      mats,
      s * 0.35,
      -s * 0.18,
      0,
      s * 0.45,
      s * 0.1,
      s * 0.08,
      0,
      0,
      0.55,
    );
    // Slash /
    this.addMesh(
      g,
      this.box,
      bar,
      pick,
      mats,
      0,
      0,
      0,
      s * 0.12,
      s * 0.85,
      s * 0.08,
      0,
      0,
      -0.45,
    );
  }

  private buildTablet(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const frame = this.makeMat(opts);
    const glass = this.makeMat(opts, {
      tintMix: 0.42,
      opacity: 0.52,
      depthWrite: false,
      emissiveBoost: 1.25,
      side: THREE.DoubleSide,
    });
    mats.push(frame, glass);

    this.addMesh(g, this.box, frame, pick, mats, 0, 0, 0, s * 1.05, s * 1.45, s * 0.1);
    this.addMesh(
      g,
      this.box,
      glass,
      pick,
      mats,
      0,
      s * 0.02,
      s * 0.06,
      s * 0.9,
      s * 1.22,
      s * 0.04,
    );
    // Home indicator
    this.addMesh(
      g,
      this.box,
      frame,
      pick,
      mats,
      0,
      -s * 0.62,
      s * 0.07,
      s * 0.22,
      s * 0.035,
      s * 0.03,
    );
  }

  private buildAntenna(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const mast = this.makeMat(opts, { metalness: 0.92, roughness: 0.24 });
    const dish = this.makeMat(opts, {
      tintMix: 0.3,
      opacity: opts.style === "glass" ? 0.55 : 0.78,
      emissiveBoost: 1.05,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const tip = this.makeMat(opts, { style: "accent", emissiveBoost: 1.4, opacity: 0.92 });
    mats.push(mast, dish, tip);

    // Mast
    this.addMesh(g, this.cyl, mast, pick, mats, 0, -s * 0.15, 0, s * 0.05, s * 0.9, s * 0.05);
    // Dish (tilted sphere slice look via flattened sphere)
    this.addMesh(
      g,
      this.sphere,
      dish,
      pick,
      mats,
      0,
      s * 0.35,
      s * 0.12,
      s * 0.55,
      s * 0.55,
      s * 0.18,
      -0.55,
      0,
      0,
    );
    // Feed horn
    this.addMesh(
      g,
      this.cyl,
      mast,
      pick,
      mats,
      0,
      s * 0.28,
      s * 0.28,
      s * 0.06,
      s * 0.28,
      s * 0.06,
      1.1,
      0,
      0,
    );
    this.addMesh(g, this.sphere, tip, pick, mats, 0, s * 0.42, s * 0.42, s * 0.07, s * 0.07, s * 0.07);
    // Base
    this.addMesh(g, this.cyl, mast, pick, mats, 0, -s * 0.58, 0, s * 0.28, s * 0.08, s * 0.28);
  }

  private buildUsb(
    g: THREE.Group,
    s: number,
    opts: MatOpts,
    pick: THREE.Object3D[],
    mats: THREE.MeshPhysicalMaterial[],
  ) {
    const body = this.makeMat(opts);
    const tip = this.makeMat(opts, { metalness: 0.95, roughness: 0.2 });
    const led = this.makeMat(opts, { style: "accent", emissiveBoost: 1.6, opacity: 0.95 });
    mats.push(body, tip, led);

    // Housing
    this.addMesh(g, this.box, body, pick, mats, -s * 0.12, 0, 0, s * 0.85, s * 0.35, s * 0.18);
    // Metal connector
    this.addMesh(g, this.box, tip, pick, mats, s * 0.5, 0, 0, s * 0.45, s * 0.28, s * 0.12);
    // Cap detail
    this.addMesh(g, this.box, body, pick, mats, -s * 0.55, 0, 0, s * 0.12, s * 0.38, s * 0.2);
    // Activity LED
    this.addMesh(
      g,
      this.sphere,
      led,
      pick,
      mats,
      -s * 0.2,
      s * 0.12,
      s * 0.1,
      s * 0.05,
      s * 0.05,
      s * 0.05,
    );
  }
}

export function collisionRadius(kind: ServiceFigureKind, s: number): number {
  switch (kind) {
    case "laptop":
      return s * 1.05;
    case "desktop":
      return s * 0.95;
    case "wifi":
      return s * 0.85;
    case "router":
      return s * 0.95;
    case "globe":
      return s * 0.9;
    case "cloud":
      return s * 0.9;
    case "phone":
      return s * 0.8;
    case "server":
      return s * 0.95;
    case "browser":
      return s * 1.0;
    case "gear":
      return s * 0.85;
    case "headphones":
      return s * 0.85;
    case "chip":
      return s * 0.8;
    case "keyboard":
      return s * 1.05;
    case "mouse":
      return s * 0.7;
    case "database":
      return s * 0.9;
    case "code":
      return s * 0.85;
    case "tablet":
      return s * 0.95;
    case "antenna":
      return s * 0.9;
    case "usb":
      return s * 0.75;
    default:
      return s * 0.85;
  }
}

/** Loose mapping across digital products / automation / infra / communication. */
export const SERVICE_KINDS: ServiceFigureKind[] = [
  "laptop",
  "wifi",
  "router",
  "globe",
  "cloud",
  "phone",
  "server",
  "browser",
  "gear",
  "desktop",
  "headphones",
  "chip",
  "keyboard",
  "mouse",
  "database",
  "code",
  "tablet",
  "antenna",
  "usb",
];
