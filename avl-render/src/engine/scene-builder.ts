/**
 * Costruisce la scena Three.js per LEDwall (condivisa tra Viewer3D e export PNG).
 */
import * as THREE from "three";

export interface SceneParams {
  LED_W: number;
  LED_H: number;
  BOT_BAR: number;
  CAB_W: number;
  CAB_H: number;
  CAB_D: number;
  CAB_ROWS: number;
  CAB_COLS: number;
  DEAD_ROWS: number;
  DEAD_COLS: number;
  LEG_X: number[];
  LEG_H: number;
  LEG_ARM: number;
  QX: number;
  QH: number;
  QX_DEPTH: number;
  IS_FLAT: boolean;
  CHORD_R: number;
  Z_TF: number;
  Z_TC: number;
  Z_TB: number;
  TUBE_R: number;
  TUBE_Y: number[];
  Z_TUBE: number;
  BASE_PLATE_W?: number;
  BASE_PLATE_D?: number;
  BASE_PLATE_INSET?: number;
}

export function buildLedwallScene(
  P: SceneParams,
  basePlate = true
): { scene: THREE.Scene; materials: THREE.Material[] } {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8fafc);

  const isFlat = P.IS_FLAT ?? false;
  const MAT = {
    chord: new THREE.MeshStandardMaterial({
      color: isFlat ? 0x708090 : 0x607090,
      metalness: 0.7,
      roughness: 0.3,
    }),
    diagLine: new THREE.LineBasicMaterial({ color: isFlat ? 0x556070 : 0x455a64 }),
    ledON: new THREE.MeshStandardMaterial({
      color: 0x1a6fce,
      emissive: 0x0a2a6a,
      metalness: 0.1,
      roughness: 0.6,
    }),
    ledOFF: new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      metalness: 0.2,
      roughness: 0.7,
    }),
    frame: new THREE.LineBasicMaterial({ color: 0x111111 }),
    bar: new THREE.MeshStandardMaterial({
      color: 0x78909c,
      metalness: 0.5,
      roughness: 0.4,
    }),
    tube: new THREE.MeshStandardMaterial({
      color: 0xc0392b,
      metalness: 0.6,
      roughness: 0.35,
    }),
    clamp: new THREE.MeshStandardMaterial({
      color: 0x27ae60,
      metalness: 0.5,
      roughness: 0.4,
    }),
    base: new THREE.MeshStandardMaterial({
      color: 0x444455,
      metalness: 0.4,
      roughness: 0.5,
    }),
    plateBlack: new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.2,
    }),
  };

  const materials = Object.values(MAT);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight1.position.set(5, 8, 5);
  scene.add(dirLight1);
  const dirLight2 = new THREE.DirectionalLight(0xddeeff, 0.4);
  dirLight2.position.set(-3, 4, -4);
  scene.add(dirLight2);

  function cyl(
    r: number,
    h: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    axis = "y"
  ) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, r > 0.02 ? 12 : 8),
      mat as THREE.MeshStandardMaterial
    );
    if (axis === "x") m.rotation.z = Math.PI / 2;
    if (axis === "z") m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  }
  function bx(
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number
  ) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat as THREE.MeshStandardMaterial
    );
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  }
  function lineSegs(pts: number[][], mat: THREE.Material) {
    const geo = new THREE.BufferGeometry().setFromPoints(
      pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    );
    scene.add(new THREE.LineSegments(geo, mat));
  }

  const QH = P.QH ?? P.QX / 2;
  const zC = P.Z_TC;

  function makeLegQX30(lx: number) {
    const y1 = P.LEG_H;
    const vChords = [
      [lx - QH, zC - QH],
      [lx + QH, zC - QH],
      [lx - QH, zC + QH],
      [lx + QH, zC + QH],
    ];
    vChords.forEach(([x, z]) => cyl(P.CHORD_R, y1, MAT.chord, x, y1 / 2, z));

    const bays = 4;
    const bH = y1 / bays;
    const diagPts: number[][] = [];
    for (let i = 0; i <= bays; i++) {
      const y = i * bH;
      diagPts.push([lx - QH, y, zC - QH], [lx + QH, y, zC - QH]);
      diagPts.push([lx - QH, y, zC + QH], [lx + QH, y, zC + QH]);
      diagPts.push([lx - QH, y, zC - QH], [lx - QH, y, zC + QH]);
      diagPts.push([lx + QH, y, zC - QH], [lx + QH, y, zC + QH]);
      if (i < bays) {
        const yn = (i + 1) * bH;
        diagPts.push([lx - QH, y, zC - QH], [lx + QH, yn, zC - QH], [lx + QH, y, zC - QH], [lx - QH, yn, zC - QH]);
        diagPts.push([lx - QH, y, zC + QH], [lx + QH, yn, zC + QH], [lx + QH, y, zC + QH], [lx - QH, yn, zC + QH]);
        diagPts.push([lx - QH, y, zC - QH], [lx - QH, yn, zC + QH], [lx - QH, y, zC + QH], [lx - QH, yn, zC - QH]);
        diagPts.push([lx + QH, y, zC - QH], [lx + QH, yn, zC + QH], [lx + QH, y, zC + QH], [lx + QH, yn, zC - QH]);
      }
    }
    lineSegs(diagPts, MAT.diagLine);

    const zAF = P.Z_TB;
    const zAB = P.Z_TB + P.LEG_ARM;
    const zAM = (zAF + zAB) / 2;
    [[lx - QH, P.CHORD_R], [lx + QH, P.CHORD_R], [lx - QH, P.QX - P.CHORD_R], [lx + QH, P.QX - P.CHORD_R]].forEach(
      ([x, y]) => cyl(P.CHORD_R, P.LEG_ARM, MAT.chord, x, y, zAM, "z")
    );
    if (basePlate) {
      const bpW = P.BASE_PLATE_W ?? 0.32;
      const bpD = P.BASE_PLATE_D ?? 0.74;
      const bpInset = P.BASE_PLATE_INSET ?? 0.07;
      const bpCenterZ = P.Z_TF - bpInset + bpD / 2;
      bx(bpW, 0.015, bpD, MAT.base, lx, 0.008, bpCenterZ);
    }
  }

  function makeLegFX30(lx: number) {
    const y1 = P.LEG_H;
    const halfW = P.QX_DEPTH / 2;
    const zF = P.Z_TF;
    const zB = P.Z_TB;
    const xL = lx - halfW;
    const xR = lx + halfW;
    if (basePlate) {
      const bpW = P.BASE_PLATE_W ?? 0.32;
      const bpD = P.BASE_PLATE_D ?? 0.74;
      const bpInset = P.BASE_PLATE_INSET ?? 0.07;
      const bpCenterZ = P.Z_TF - bpInset + bpD / 2;
      bx(bpW, 0.02, bpD, MAT.plateBlack, lx, 0.01, bpCenterZ);
    }
    [[xL, zF], [xR, zF], [xL, zB], [xR, zB]].forEach(([x, z]) =>
      cyl(P.CHORD_R, y1, MAT.chord, x, y1 / 2, z)
    );
    const bays = 4;
    const bH = y1 / bays;
    const diagPts: number[][] = [];
    for (let i = 0; i < bays; i++) {
      const y = i * bH;
      const yn = (i + 1) * bH;
      diagPts.push([xL, y, zF], [xR, yn, zB]);
      diagPts.push([xR, y, zB], [xL, yn, zF]);
      diagPts.push([xR, y, zF], [xL, yn, zB]);
      diagPts.push([xL, y, zB], [xR, yn, zF]);
    }
    lineSegs(diagPts, MAT.diagLine);
  }

  const makeLeg = isFlat ? makeLegFX30 : makeLegQX30;

  if (P.BOT_BAR > 0) {
    bx(P.LED_W, P.BOT_BAR, 0.12, MAT.bar, P.LED_W / 2, P.BOT_BAR / 2, 0);
  }

  for (let col = 0; col < P.CAB_COLS; col++) {
    for (let row = 0; row < P.CAB_ROWS; row++) {
      const x = P.CAB_W / 2 + col * P.CAB_W;
      const y = P.BOT_BAR + P.CAB_H / 2 + row * P.CAB_H;
      const mat = row < P.DEAD_ROWS || col < P.DEAD_COLS || col >= P.CAB_COLS - P.DEAD_COLS ? MAT.ledOFF : MAT.ledON;
      bx(P.CAB_W - 0.005, P.CAB_H - 0.005, P.CAB_D, mat, x, y, 0);
      const fr = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(P.CAB_W - 0.005, P.CAB_H - 0.005, P.CAB_D)),
        MAT.frame
      );
      fr.position.set(x, y, 0);
      scene.add(fr);
    }
  }

  if (P.LEG_X.length > 0) P.LEG_X.forEach((lx) => makeLeg(lx));

  if (P.LEG_X.length >= 2 && P.TUBE_Y.length > 0) {
    const spanX = P.LEG_X[P.LEG_X.length - 1] - P.LEG_X[0];
    const xMid = (P.LEG_X[0] + P.LEG_X[P.LEG_X.length - 1]) / 2;
    P.TUBE_Y.forEach((ty) => cyl(P.TUBE_R, spanX, MAT.tube, xMid, ty, P.Z_TUBE, "x"));
    P.LEG_X.forEach((lx) => {
      P.TUBE_Y.forEach((ty) => {
        bx(0.065, 0.065, 0.1, MAT.clamp, lx, ty, P.Z_TUBE);
        bx(0.065, 0.065, 0.1, MAT.clamp, lx, ty, P.Z_TUBE - 0.06);
      });
    });
  }

  // Montaggio diretto con aliscaf + distanziatore (quando tubi = 0)
  if (P.LEG_X.length > 0 && P.TUBE_Y.length === 0) {
    const spacerLen = P.Z_TF - P.CAB_D;
    const spacerCenterZ = P.CAB_D + spacerLen / 2;
    // Due distanziatori per gamba: a 1/3 e 2/3 dell'altezza LED
    const spacerYPositions = [P.BOT_BAR + P.LED_H * 0.33, P.BOT_BAR + P.LED_H * 0.67];
    P.LEG_X.forEach((lx) => {
      spacerYPositions.forEach((sy) => {
        // Distanziatore (barra cilindrica)
        cyl(0.02, spacerLen, MAT.bar, lx, sy, spacerCenterZ, "z");
        // Aliscaf lato truss
        bx(0.07, 0.07, 0.08, MAT.clamp, lx, sy, P.Z_TF);
        // Aliscaf lato LED
        bx(0.07, 0.07, 0.06, MAT.clamp, lx, sy, P.CAB_D + 0.03);
      });
    });
  }

  return { scene, materials };
}
