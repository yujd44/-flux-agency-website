import * as THREE from "three";

/**
 * Service-themed 3D figures for StageScene — composed MeshPhysical meshes
 * (laptop, wifi, cloud, phone, server, browser, gear, desktop).
 */

export type ServiceFigureKind =
  | "laptop"
  | "desktop"
  | "wifi"
  | "cloud"
  | "phone"
  | "server"
  | "browser"
  | "gear";

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
  envMap: THREE.Texture;
  style: FigureStyle;
  navy: THREE.Color;
  metal: THREE.Color;
};

/** Shared unit primitives — scale per part; dispose once via pool.dispose(). */
export class ServiceFigurePool {
  readonly box = new THREE.BoxGeometry(1, 1, 1);
  readonly sphere = new THREE.SphereGeometry(1, 16, 12);
  readonly cyl = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
  readonly torus = new THREE.TorusGeometry(1, 0.12, 8, 24, Math.PI * 0.85);
  readonly torusFull = new THREE.TorusGeometry(1, 0.14, 8, 20);

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
      roughness: isGlass ? 0.12 : isAccent ? 0.16 : 0.24,
      metalness: isGlass ? 0.4 : isAccent ? 0.78 : 0.9,
      clearcoat: 1,
      clearcoatRoughness: isGlass ? 0.08 : 0.14,
      ior: 1.45,
      specularIntensity: 1,
      specularColor: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: isGlass ? 0.68 : isAccent ? 0.84 : 0.9,
      depthWrite: !isGlass,
      envMap,
      envMapIntensity: isGlass ? 1.55 : 1.4,
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
}

export function collisionRadius(kind: ServiceFigureKind, s: number): number {
  switch (kind) {
    case "laptop":
      return s * 1.05;
    case "desktop":
      return s * 0.95;
    case "wifi":
      return s * 0.85;
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
    default:
      return s * 0.85;
  }
}

/** Loose mapping across digital products / automation / infra / communication. */
export const SERVICE_KINDS: ServiceFigureKind[] = [
  "laptop",
  "wifi",
  "cloud",
  "phone",
  "server",
  "browser",
  "gear",
  "desktop",
];
