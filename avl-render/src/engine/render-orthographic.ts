/**
 * Render ortografico Three.js per PNG professionali.
 * Viste frontale, laterale, pianta con quote, frecce, pannello dati e title block.
 * Output ad alta risoluzione (2800×2000) per stampa/presentazione.
 */
import * as THREE from "three";
import { buildLedwallScene, type SceneParams } from "./scene-builder";
import type { DrawMeta } from "./draw-technical";

/* ── Canvas dimensions ─────────────────────────────────────────── */
const W = 3200;
const H = 2400;
const MARGIN = 100;
const DIM_OFFSET = 50;
const ARROW_LEN = 12;
const ARROW_W = 5;

/* ── Fonts ─────────────────────────────────────────────────────── */
const F_DIM = "bold 22px 'Segoe UI', Arial, sans-serif";
const F_DIM_SM = "bold 18px 'Segoe UI', Arial, sans-serif";
const F_TITLE = "bold 36px 'Segoe UI', Arial, sans-serif";
const F_SUBTITLE = "bold 20px 'Segoe UI', Arial, sans-serif";
const F_LABEL = "600 17px 'Segoe UI', Arial, sans-serif";
const F_VALUE = "bold 17px 'Segoe UI', Arial, sans-serif";
const F_TB = "13px 'Segoe UI', Arial, sans-serif";

/* ── Colors ────────────────────────────────────────────────────── */
const C_DIM = "#1a1a1a";
const C_DIM_LINE = "#333333";
const C_EXT_LINE = "#888888";
const C_ACCENT = "#0066cc";
const C_BORDER = "#cccccc";
const C_BG = "#ffffff";
const C_PANEL_BG = "#f4f6f8";
const C_PANEL_BORDER = "#d0d4d8";
const C_HEADER_BG = "#1a2332";
const C_HEADER_FG = "#ffffff";

/* ── Extended meta with project data ───────────────────────────── */
export interface RenderMeta extends DrawMeta {
  ledSize?: string;
  activeSize?: string;
  pitch?: string;
  cabinet?: string;
  resolution?: string;
  truss?: string;
  legs?: string;
  legSpacing?: string;
  tubes?: string;
  controller?: string;
  power?: string;
  network?: string;
  ledWeight?: string;
  totalWeight?: string;
  bottomBar?: string;
  totalHeight?: string;
  totalDepth?: string;
  deadRow?: string;
  revision?: string;
  client?: string;
  location?: string;
}

/* ══════════════════════════════════════════════════════════════════
   DIMENSION DRAWING — with proper arrows
   ══════════════════════════════════════════════════════════════════ */

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-ARROW_LEN, -ARROW_W);
  ctx.lineTo(-ARROW_LEN, ARROW_W);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDimension(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  value: string,
  isHorizontal: boolean,
  opts?: { font?: string; offset?: number; color?: string; side?: "left" | "right" | "top" | "bottom" },
) {
  const font = opts?.font ?? F_DIM;
  const offset = opts?.offset ?? DIM_OFFSET;
  const color = opts?.color ?? C_DIM;

  ctx.strokeStyle = C_DIM_LINE;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.font = font;

  if (isHorizontal) {
    const above = opts?.side === "top";
    const y = above ? Math.min(y1, y2) - offset : Math.max(y1, y2) + offset;
    const extDir = above ? -1 : 1;
    // Extension lines
    ctx.save();
    ctx.strokeStyle = C_EXT_LINE;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y1 + extDir * 4);
    ctx.lineTo(x1, y + extDir * 6);
    ctx.moveTo(x2, y2 + extDir * 4);
    ctx.lineTo(x2, y + extDir * 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Dimension line
    ctx.strokeStyle = C_DIM_LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1 + ARROW_LEN, y);
    ctx.lineTo(x2 - ARROW_LEN, y);
    ctx.stroke();

    // Arrows
    ctx.fillStyle = C_DIM_LINE;
    drawArrowHead(ctx, x1, y, 0);
    drawArrowHead(ctx, x2, y, Math.PI);

    // Text with white background
    ctx.font = font;
    const tw = ctx.measureText(value).width;
    const tx = (x1 + x2) / 2;
    const ty = above ? y + 8 : y - 8;
    ctx.fillStyle = C_BG;
    ctx.fillRect(tx - tw / 2 - 4, ty - 14, tw + 8, 20);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, tx, ty - 3);
  } else {
    const right = opts?.side === "right";
    const x = right ? Math.max(x1, x2) + offset : Math.min(x1, x2) - offset;
    const extDir = right ? 1 : -1;
    // Extension lines
    ctx.save();
    ctx.strokeStyle = C_EXT_LINE;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1 + extDir * 4, y1);
    ctx.lineTo(x + extDir * 6, y1);
    ctx.moveTo(x2 + extDir * 4, y2);
    ctx.lineTo(x + extDir * 6, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Dimension line
    ctx.strokeStyle = C_DIM_LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y1 + ARROW_LEN);
    ctx.lineTo(x, y2 - ARROW_LEN);
    ctx.stroke();

    // Arrows
    ctx.fillStyle = C_DIM_LINE;
    drawArrowHead(ctx, x, y1, Math.PI / 2);
    drawArrowHead(ctx, x, y2, -Math.PI / 2);

    // Text rotated
    ctx.save();
    const midY = (y1 + y2) / 2;
    ctx.font = font;
    const tw = ctx.measureText(value).width;
    const textOff = right ? 10 : -10;
    const textRot = right ? Math.PI / 2 : -Math.PI / 2;
    ctx.translate(x + textOff, midY);
    ctx.rotate(textRot);
    ctx.fillStyle = C_BG;
    ctx.fillRect(-tw / 2 - 4, -12, tw + 8, 20);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, 0, -2);
    ctx.restore();
  }
}

/* ══════════════════════════════════════════════════════════════════
   DATA PANEL — right side of each view
   ══════════════════════════════════════════════════════════════════ */

function drawDataPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  panelW: number,
  meta: RenderMeta,
  viewName: string,
) {
  const lineH = 24;
  const padX = 14;
  const padY = 10;

  // Collect data rows
  const sections: { title: string; rows: [string, string][] }[] = [];

  // Always show header section
  const headerRows: [string, string][] = [];
  if (meta.client) headerRows.push(["Cliente", meta.client]);
  if (meta.location) headerRows.push(["Location", meta.location]);
  headerRows.push(["Data", meta.date]);
  if (meta.designer !== "—") headerRows.push(["Progettista", meta.designer]);
  if (meta.revision) headerRows.push(["Revisione", meta.revision]);
  sections.push({ title: meta.projectName || "Progetto", rows: headerRows });

  // LED section
  const ledRows: [string, string][] = [];
  if (meta.ledSize) ledRows.push(["Fisico", meta.ledSize]);
  if (meta.activeSize) ledRows.push(["Attivo", meta.activeSize]);
  if (meta.pitch) ledRows.push(["Pitch", meta.pitch]);
  if (meta.cabinet) ledRows.push(["Cabinet", meta.cabinet]);
  if (meta.resolution) ledRows.push(["Risoluzione", meta.resolution]);
  if (meta.deadRow) ledRows.push(["Fila morta", meta.deadRow]);
  if (ledRows.length > 0) sections.push({ title: "LED WALL", rows: ledRows });

  // Structure section
  const strRows: [string, string][] = [];
  if (meta.totalHeight) strRows.push(["H Totale", meta.totalHeight]);
  if (meta.totalDepth) strRows.push(["Profondità", meta.totalDepth]);
  if (meta.bottomBar) strRows.push(["Bottom bar", meta.bottomBar]);
  if (meta.truss) strRows.push(["Truss", meta.truss]);
  if (meta.legs) strRows.push(["Gambe", meta.legs]);
  if (meta.legSpacing) strRows.push(["Interasse", meta.legSpacing]);
  if (meta.tubes) strRows.push(["Tubi", meta.tubes]);
  if (strRows.length > 0) sections.push({ title: "STRUTTURA", rows: strRows });

  // Technical section
  const techRows: [string, string][] = [];
  if (meta.controller) techRows.push(["Centralina", meta.controller]);
  if (meta.power) techRows.push(["Corrente", meta.power]);
  if (meta.network) techRows.push(["Rete", meta.network]);
  if (meta.ledWeight) techRows.push(["Peso LED", meta.ledWeight]);
  if (meta.totalWeight) techRows.push(["Carico tot.", meta.totalWeight]);
  if (techRows.length > 0) sections.push({ title: "DATI TECNICI", rows: techRows });

  // Calculate total height
  let totalH = padY;
  for (const sec of sections) {
    totalH += 32; // section header
    totalH += sec.rows.length * lineH;
    totalH += 8; // spacing
  }
  totalH += padY;

  // Draw panel background
  ctx.save();
  ctx.fillStyle = C_PANEL_BG;
  ctx.strokeStyle = C_PANEL_BORDER;
  ctx.lineWidth = 1.5;

  // Rounded rect
  const r = 8;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + panelW - r, y);
  ctx.arcTo(x + panelW, y, x + panelW, y + r, r);
  ctx.lineTo(x + panelW, y + totalH - r);
  ctx.arcTo(x + panelW, y + totalH, x + panelW - r, y + totalH, r);
  ctx.lineTo(x + r, y + totalH);
  ctx.arcTo(x, y + totalH, x, y + totalH - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw sections
  let cy = y + padY;
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];

    // Section header
    ctx.fillStyle = si === 0 ? C_HEADER_BG : C_ACCENT;
    const hdrH = 28;
    ctx.beginPath();
    if (si === 0) {
      // First section: rounded top
      ctx.moveTo(x + r, cy);
      ctx.lineTo(x + panelW - r, cy);
      ctx.arcTo(x + panelW, cy, x + panelW, cy + r, si === 0 ? r : 0);
      ctx.lineTo(x + panelW, cy + hdrH);
      ctx.lineTo(x, cy + hdrH);
      ctx.lineTo(x, cy + (si === 0 ? r : 0));
      if (si === 0) ctx.arcTo(x, cy, x + r, cy, r);
    } else {
      ctx.rect(x + 2, cy, panelW - 4, hdrH);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = si === 0 ? C_HEADER_FG : "#ffffff";
    ctx.font = si === 0 ? F_VALUE : F_LABEL;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(sec.title, x + padX, cy + hdrH / 2 + 1);
    cy += hdrH + 4;

    // Rows
    for (let ri = 0; ri < sec.rows.length; ri++) {
      const [label, val] = sec.rows[ri];
      ctx.fillStyle = "#555555";
      ctx.font = F_LABEL;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + padX, cy + lineH / 2);

      ctx.fillStyle = "#111111";
      ctx.font = F_VALUE;
      ctx.textAlign = "right";
      ctx.fillText(val, x + panelW - padX, cy + lineH / 2);

      // Subtle separator line (not after last row)
      if (ri < sec.rows.length - 1) {
        ctx.strokeStyle = "#e0e4e8";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x + padX, cy + lineH);
        ctx.lineTo(x + panelW - padX, cy + lineH);
        ctx.stroke();
      }

      cy += lineH;
    }
    cy += 8;
  }

  // View label at bottom
  ctx.fillStyle = C_ACCENT;
  ctx.font = F_SUBTITLE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(viewName, x + panelW / 2, y + totalH + 20);

  ctx.restore();
}

/* ══════════════════════════════════════════════════════════════════
   TITLE BLOCK — bottom right, professional CAD-style
   ══════════════════════════════════════════════════════════════════ */

function drawTitleBlock(
  ctx: CanvasRenderingContext2D,
  meta: RenderMeta,
  viewLabel: string,
) {
  const tw = 360;
  const th = 90;
  const tx = W - MARGIN - tw;
  const ty = H - MARGIN / 2 - th;

  // Background
  ctx.fillStyle = "#f8f9fa";
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.fillRect(tx, ty, tw, th);
  ctx.strokeRect(tx, ty, tw, th);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(tx, ty + 30);
  ctx.lineTo(tx + tw, ty + 30);
  ctx.stroke();

  // Top row — company + view
  ctx.fillStyle = C_HEADER_BG;
  ctx.fillRect(tx + 1, ty + 1, tw - 2, 29);
  ctx.fillStyle = C_HEADER_FG;
  ctx.font = "bold 15px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("AVL RENDER TECNICI", tx + 10, ty + 16);
  ctx.textAlign = "right";
  ctx.fillText(viewLabel, tx + tw - 10, ty + 16);

  // Info rows
  ctx.fillStyle = "#222";
  ctx.font = F_TB;
  ctx.textAlign = "left";
  const col1 = tx + 10;
  const col2 = tx + tw / 2 + 10;
  const row1 = ty + 46;
  const row2 = ty + 62;
  const row3 = ty + 78;

  ctx.fillText(`Progetto: ${meta.projectName}`, col1, row1);
  ctx.fillText(`Scala: ${meta.scale}`, col2, row1);
  ctx.fillText(`Data: ${meta.date}`, col1, row2);
  ctx.fillText(`Progettista: ${meta.designer}`, col2, row2);
  if (meta.revision) {
    ctx.fillText(`Rev: ${meta.revision}`, col1, row3);
  }
  if (meta.client) {
    ctx.fillText(`Cliente: ${meta.client}`, col2, row3);
  }
}

/* ══════════════════════════════════════════════════════════════════
   PAGE HEADER — top of each view
   ══════════════════════════════════════════════════════════════════ */

function drawPageHeader(
  ctx: CanvasRenderingContext2D,
  viewLabel: string,
  projectName: string,
) {
  // Title bar
  ctx.fillStyle = C_HEADER_BG;
  ctx.fillRect(0, 0, W, 56);

  ctx.fillStyle = C_HEADER_FG;
  ctx.font = F_TITLE;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(viewLabel, MARGIN, 30);

  ctx.font = F_SUBTITLE;
  ctx.textAlign = "right";
  ctx.fillStyle = "#88ccff";
  ctx.fillText(projectName, W - MARGIN, 30);

  // Thin accent line
  ctx.fillStyle = C_ACCENT;
  ctx.fillRect(0, 56, W, 3);
}

/* ══════════════════════════════════════════════════════════════════
   BORDER FRAME
   ══════════════════════════════════════════════════════════════════ */

function drawBorderFrame(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 65, W - 40, H - 85);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(16, 61, W - 32, H - 77);
}

/* ══════════════════════════════════════════════════════════════════
   UTILITY
   ══════════════════════════════════════════════════════════════════ */

function toMm(v: number): string {
  return Math.round(v * 1000).toLocaleString("it-IT") + " mm";
}

/** Rilascia geometrie e materiali della scena (senza renderer). */
export function disposeSceneGeometry(scene: THREE.Scene) {
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { if (m) m.dispose(); });
    }
    if (o instanceof THREE.LineSegments) {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { if (m) m.dispose(); });
    }
  });
}

function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  renderer.dispose();
  renderer.forceContextLoss();
  disposeSceneGeometry(scene);
}

/* ══════════════════════════════════════════════════════════════════
   SCENE BOUNDS — compute world-space bounding box for each view
   ══════════════════════════════════════════════════════════════════ */

function sceneBounds(P: SceneParams) {
  const qh = P.QH ?? P.QX / 2;
  const legXMin = P.LEG_X.length > 0 ? Math.min(...P.LEG_X) - qh : 0;
  const legXMax = P.LEG_X.length > 0 ? Math.max(...P.LEG_X) + qh : P.LED_W;
  // La base plate può estendersi oltre Z_TB + LEG_ARM
  const bpInset = P.BASE_PLATE_INSET ?? 0.07;
  const bpD = P.BASE_PLATE_D ?? 0.74;
  const bpBackEdge = P.LEG_X.length > 0 ? P.Z_TF - bpInset + bpD : 0;
  return {
    xMin: Math.min(0, legXMin),
    xMax: Math.max(P.LED_W, legXMax),
    yMin: 0,
    yMax: Math.max(P.BOT_BAR + P.LED_H, P.LEG_H),
    zMin: 0,
    zMax: Math.max(P.Z_TB + (P.LEG_ARM || 0), bpBackEdge),
  };
}

/* ══════════════════════════════════════════════════════════════════
   COMMON RENDER SETUP — canvas, renderer, drawing area
   ══════════════════════════════════════════════════════════════════ */

function setupRender(
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  cam: THREE.OrthographicCamera,
  sceneW: number,
  sceneH: number,
  keepScene = false,
) {
  canvas.width = W;
  canvas.height = H;

  const drawAreaW = W - 2 * MARGIN - 440;
  const drawAreaH = H - 280;

  const scaleX = drawAreaW / sceneW;
  const scaleY = drawAreaH / sceneH;
  const scale = Math.min(scaleX, scaleY) * 0.85;

  const renderW = Math.floor(sceneW * scale);
  const renderH = Math.floor(sceneH * scale);
  const ox = MARGIN + 80;
  const oy = 80 + Math.floor((drawAreaH - renderH) / 2) + 20;

  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: false, preserveDrawingBuffer: true,
  });
  renderer.setSize(renderW, renderH);
  renderer.setClearColor(0xf0f2f5);
  renderer.render(scene, cam);

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = C_BG;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.drawImage(renderer.domElement, ox, oy, renderW, renderH);
  ctx.restore();

  ctx.strokeStyle = C_BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, renderW, renderH);

  // Se keepScene, libera solo il renderer WebGL (la scena sarà riusata)
  if (keepScene) {
    renderer.dispose();
    renderer.forceContextLoss();
  } else {
    disposeScene(scene, renderer);
  }

  return { ctx, ox, oy, renderW, renderH, scale };
}

/* ══════════════════════════════════════════════════════════════════
   RENDER: VISTA FRONTALE VERA (dal pubblico, faccia LED)
   Camera da -Z verso +Z, vede solo la faccia anteriore
   ══════════════════════════════════════════════════════════════════ */

export function renderFrontale(
  canvas: HTMLCanvasElement,
  P: SceneParams,
  meta: RenderMeta,
  basePlate: boolean,
  prebuiltScene?: THREE.Scene,
): void {
  const shared = !!prebuiltScene;
  const scene = prebuiltScene ?? buildLedwallScene(P, basePlate).scene;
  const pad = 0.3;
  const sceneW = P.LED_W + 2 * pad;
  const sceneH = P.BOT_BAR + P.LED_H + 2 * pad;
  const cx = P.LED_W / 2;
  const cy = (P.BOT_BAR + P.LED_H) / 2;

  const cam = new THREE.OrthographicCamera(
    -sceneW / 2, sceneW / 2, sceneH / 2, -sceneH / 2, 0.1, 50,
  );
  cam.position.set(cx, cy, -5);
  cam.lookAt(cx, cy, 0);

  const { ctx, ox, oy, renderH, scale } = setupRender(canvas, scene, cam, sceneW, sceneH, shared);

  const toX = (wx: number) => ox + (wx + pad) * scale;
  const toY = (wy: number) => oy + (P.BOT_BAR + P.LED_H + pad - wy) * scale;
  const bottomY = oy + renderH;
  const hTot = P.BOT_BAR + P.LED_H;

  drawDimension(ctx, toX(0), bottomY, toX(P.LED_W), bottomY, toMm(P.LED_W), true, { offset: 40 });
  drawDimension(ctx, toX(0), toY(hTot), toX(0), toY(0), toMm(hTot), false, { offset: 50 });

  if (P.BOT_BAR > 0) {
    drawDimension(ctx, toX(0), toY(hTot), toX(0), toY(P.BOT_BAR), toMm(P.LED_H), false, {
      offset: 100, font: F_DIM_SM, color: C_ACCENT,
    });
    drawDimension(ctx, toX(0), toY(P.BOT_BAR), toX(0), toY(0), toMm(P.BOT_BAR), false, {
      offset: 100, font: F_DIM_SM, color: "#666",
    });
  }

  if (P.LEG_X.length >= 2) {
    const x1 = toX(P.LEG_X[0]);
    const x2 = toX(P.LEG_X[P.LEG_X.length - 1]);
    drawDimension(ctx, x1, bottomY + 30, x2, bottomY + 30,
      toMm(P.LEG_X[P.LEG_X.length - 1] - P.LEG_X[0]), true,
      { offset: 40, font: F_DIM_SM, color: C_ACCENT },
    );
    ctx.strokeStyle = "#cc4444";
    ctx.lineWidth = 1;
    P.LEG_X.forEach((lx) => {
      const px = toX(lx);
      ctx.beginPath();
      ctx.moveTo(px, bottomY + 2);
      ctx.lineTo(px, bottomY + 18);
      ctx.stroke();
    });
    // Spaziature singole gambe (se > 2 gambe)
    if (P.LEG_X.length > 2) {
      for (let i = 0; i < P.LEG_X.length - 1; i++) {
        const xa = toX(P.LEG_X[i]);
        const xb = toX(P.LEG_X[i + 1]);
        drawDimension(ctx, xa, bottomY + 80, xb, bottomY + 80,
          toMm(P.LEG_X[i + 1] - P.LEG_X[i]), true,
          { offset: 30, font: F_DIM_SM, color: "#999" },
        );
      }
    }
  }

  // Piastra base larghezza
  if (basePlate && P.LEG_X.length > 0) {
    const bpW = P.BASE_PLATE_W ?? 0.32;
    P.LEG_X.forEach((lx) => {
      const px1 = toX(lx - bpW / 2);
      const px2 = toX(lx + bpW / 2);
      drawDimension(ctx, px1, bottomY + 30, px2, bottomY + 30,
        toMm(bpW), true,
        { offset: 80, font: F_DIM_SM, color: "#888" },
      );
    });
  }

  drawPageHeader(ctx, "VISTA FRONTALE", meta.projectName || "Progetto");
  drawDataPanel(ctx, W - MARGIN - 400, 80, 400, meta, "VISTA FRONTALE");
  drawTitleBlock(ctx, meta, "VISTA FRONTALE");
  drawBorderFrame(ctx);
}

/* ══════════════════════════════════════════════════════════════════
   RENDER: VISTA POSTERIORE (da dietro, struttura/truss/gambe)
   Camera da +Z verso 0, vede il retro
   ══════════════════════════════════════════════════════════════════ */

export function renderPosteriore(
  canvas: HTMLCanvasElement,
  P: SceneParams,
  meta: RenderMeta,
  basePlate: boolean,
  prebuiltScene?: THREE.Scene,
): void {
  const shared = !!prebuiltScene;
  const scene = prebuiltScene ?? buildLedwallScene(P, basePlate).scene;
  const b = sceneBounds(P);
  const pad = 0.3;

  const sceneW = b.xMax - b.xMin + 2 * pad;
  const sceneH = b.yMax - b.yMin + 2 * pad;
  const cx = (b.xMin + b.xMax) / 2;
  const cy = (b.yMin + b.yMax) / 2;

  const cam = new THREE.OrthographicCamera(
    -sceneW / 2, sceneW / 2, sceneH / 2, -sceneH / 2, 0.1, 50,
  );
  cam.position.set(cx, cy, 20);
  cam.lookAt(cx, cy, 0);

  const { ctx, ox, oy, renderH, scale } = setupRender(canvas, scene, cam, sceneW, sceneH, shared);

  const toX = (wx: number) => ox + (wx - b.xMin + pad) * scale;
  const toY = (wy: number) => oy + (b.yMax + pad - wy) * scale;
  const bottomY = oy + renderH;
  const hTot = P.BOT_BAR + P.LED_H;

  drawDimension(ctx, toX(0), bottomY, toX(P.LED_W), bottomY, toMm(P.LED_W), true, { offset: 40 });
  drawDimension(ctx, toX(0), toY(hTot), toX(0), toY(0), toMm(hTot), false, { offset: 50 });

  if (P.BOT_BAR > 0) {
    drawDimension(ctx, toX(0), toY(hTot), toX(0), toY(P.BOT_BAR), toMm(P.LED_H), false, {
      offset: 100, font: F_DIM_SM, color: C_ACCENT,
    });
    drawDimension(ctx, toX(0), toY(P.BOT_BAR), toX(0), toY(0), toMm(P.BOT_BAR), false, {
      offset: 100, font: F_DIM_SM, color: "#666",
    });
  }

  if (P.LEG_X.length >= 2) {
    const x1 = toX(P.LEG_X[0]);
    const x2 = toX(P.LEG_X[P.LEG_X.length - 1]);
    drawDimension(ctx, x1, bottomY + 30, x2, bottomY + 30,
      toMm(P.LEG_X[P.LEG_X.length - 1] - P.LEG_X[0]), true,
      { offset: 40, font: F_DIM_SM, color: C_ACCENT },
    );
    ctx.strokeStyle = "#cc4444";
    ctx.lineWidth = 1;
    P.LEG_X.forEach((lx) => {
      const px = toX(lx);
      ctx.beginPath();
      ctx.moveTo(px, bottomY + 2);
      ctx.lineTo(px, bottomY + 18);
      ctx.stroke();
    });
    // Spaziature singole gambe (se > 2 gambe)
    if (P.LEG_X.length > 2) {
      for (let i = 0; i < P.LEG_X.length - 1; i++) {
        const xa = toX(P.LEG_X[i]);
        const xb = toX(P.LEG_X[i + 1]);
        drawDimension(ctx, xa, bottomY + 80, xb, bottomY + 80,
          toMm(P.LEG_X[i + 1] - P.LEG_X[i]), true,
          { offset: 30, font: F_DIM_SM, color: "#999" },
        );
      }
    }
  }

  // Piastra base larghezza
  if (basePlate && P.LEG_X.length > 0) {
    const bpW = P.BASE_PLATE_W ?? 0.32;
    P.LEG_X.forEach((lx) => {
      const px1 = toX(lx - bpW / 2);
      const px2 = toX(lx + bpW / 2);
      drawDimension(ctx, px1, bottomY + 30, px2, bottomY + 30,
        toMm(bpW), true,
        { offset: 80, font: F_DIM_SM, color: "#888" },
      );
    });
  }

  // Altezza gamba (lato destro)
  if (P.LEG_X.length > 0 && P.LEG_H > 0) {
    const rightX = toX(Math.max(...P.LEG_X));
    drawDimension(ctx, rightX, toY(P.LEG_H), rightX, toY(0), toMm(P.LEG_H), false, {
      offset: 40, side: "right", font: F_DIM_SM, color: "#888",
    });
  }

  // Sezione truss (lato destro)
  if (P.LEG_X.length > 0) {
    const rightX = toX(Math.max(...P.LEG_X));
    const trussSection = P.IS_FLAT ? P.QX : (P.QX_DEPTH ?? P.QX);
    drawDimension(ctx, rightX, toY(P.LEG_H), rightX, toY(P.LEG_H - trussSection), toMm(trussSection), false, {
      offset: 90, side: "right", font: F_DIM_SM, color: "#666",
    });
  }

  drawPageHeader(ctx, "VISTA POSTERIORE", meta.projectName || "Progetto");
  drawDataPanel(ctx, W - MARGIN - 400, 80, 400, meta, "VISTA POSTERIORE");
  drawTitleBlock(ctx, meta, "VISTA POSTERIORE");
  drawBorderFrame(ctx);
}

/* ══════════════════════════════════════════════════════════════════
   RENDER: VISTA LATERALE (looking from left side along +X)
   Camera X = world +Z, Camera Y = world +Y
   ══════════════════════════════════════════════════════════════════ */

export function renderLaterale(
  canvas: HTMLCanvasElement,
  P: SceneParams,
  meta: RenderMeta,
  basePlate: boolean,
  prebuiltScene?: THREE.Scene,
): void {
  const shared = !!prebuiltScene;
  const scene = prebuiltScene ?? buildLedwallScene(P, basePlate).scene;
  const b = sceneBounds(P);
  const pad = 0.3;

  const sceneW = b.zMax - b.zMin + 2 * pad;
  const sceneH = b.yMax - b.yMin + 2 * pad;
  const cz = (b.zMin + b.zMax) / 2;
  const cy = (b.yMin + b.yMax) / 2;

  const cam = new THREE.OrthographicCamera(
    -sceneW / 2, sceneW / 2, sceneH / 2, -sceneH / 2, 0.1, 100,
  );
  cam.position.set(-30, cy, cz);
  cam.lookAt(0, cy, cz);

  const { ctx, ox, oy, renderH, scale } = setupRender(canvas, scene, cam, sceneW, sceneH, shared);

  const toZ = (wz: number) => ox + (wz - b.zMin + pad) * scale;
  const toY = (wy: number) => oy + (b.yMax + pad - wy) * scale;
  const bottomY = oy + renderH;
  const hTot = P.BOT_BAR + P.LED_H;

  // ── Quote orizzontali (sotto) ──
  // Profondità totale
  drawDimension(ctx, toZ(0), bottomY, toZ(b.zMax), bottomY, toMm(b.zMax), true, { offset: 40 });

  // LED depth
  const ledDepthPx = (toZ(P.CAB_D) - toZ(0));
  if (ledDepthPx > 30) {
    drawDimension(ctx, toZ(0), bottomY + 30, toZ(P.CAB_D), bottomY + 30, toMm(P.CAB_D), true, {
      offset: 40, font: F_DIM_SM, color: C_ACCENT,
    });
  }

  // Gap LED→Truss
  const gapVal = P.Z_TF - P.CAB_D;
  if (gapVal > 0.03) {
    drawDimension(ctx, toZ(P.CAB_D), bottomY + 30, toZ(P.Z_TF), bottomY + 30,
      toMm(gapVal), true,
      { offset: 80, font: F_DIM_SM, color: "#cc6600" },
    );
  }

  // Sezione truss
  if (P.Z_TB - P.Z_TF > 0.05) {
    drawDimension(ctx, toZ(P.Z_TF), bottomY + 30, toZ(P.Z_TB), bottomY + 30,
      toMm(P.Z_TB - P.Z_TF), true,
      { offset: 120, font: F_DIM_SM, color: "#666" },
    );
  }

  // Braccio gamba (arm)
  if (P.LEG_ARM > 0) {
    drawDimension(ctx, toZ(P.Z_TB), bottomY + 30, toZ(P.Z_TB + P.LEG_ARM), bottomY + 30,
      toMm(P.LEG_ARM), true,
      { offset: 160, font: F_DIM_SM, color: "#888" },
    );
  }

  // Piastra base profondità + inset
  if (basePlate && P.LEG_X.length > 0) {
    const bpInset = P.BASE_PLATE_INSET ?? 0.07;
    const bpD = P.BASE_PLATE_D ?? 0.74;
    const bpFrontZ = P.Z_TF - bpInset;
    const bpBackZ = bpFrontZ + bpD;
    drawDimension(ctx, toZ(bpFrontZ), bottomY + 30, toZ(bpBackZ), bottomY + 30,
      toMm(bpD), true,
      { offset: 200, font: F_DIM_SM, color: "#888" },
    );
    // Inset
    if (bpInset > 0.01) {
      drawDimension(ctx, toZ(bpFrontZ), bottomY + 30, toZ(P.Z_TF), bottomY + 30,
        toMm(bpInset), true,
        { offset: 240, font: F_DIM_SM, color: "#aaa" },
      );
    }
  }

  // ── Quote verticali (sinistra) ──
  // Altezza totale LED+bar
  drawDimension(ctx, toZ(0), toY(hTot), toZ(0), toY(0), toMm(hTot), false, { offset: 50 });

  // LED height (se c'è bottom bar)
  if (P.BOT_BAR > 0) {
    drawDimension(ctx, toZ(0), toY(hTot), toZ(0), toY(P.BOT_BAR), toMm(P.LED_H), false, {
      offset: 100, font: F_DIM_SM, color: C_ACCENT,
    });
    drawDimension(ctx, toZ(0), toY(P.BOT_BAR), toZ(0), toY(0), toMm(P.BOT_BAR), false, {
      offset: 100, font: F_DIM_SM, color: "#666",
    });
  }

  // ── Quote verticali (destra) ──
  const rightZ = toZ(b.zMax);
  // Altezza gamba
  if (P.LEG_X.length > 0 && P.LEG_H > 0) {
    drawDimension(ctx, rightZ, toY(P.LEG_H), rightZ, toY(0), toMm(P.LEG_H), false, {
      offset: 40, side: "right", font: F_DIM_SM, color: "#888",
    });
  }

  drawPageHeader(ctx, "VISTA LATERALE", meta.projectName || "Progetto");
  drawDataPanel(ctx, W - MARGIN - 400, 80, 400, meta, "VISTA LATERALE");
  drawTitleBlock(ctx, meta, "VISTA LATERALE");
  drawBorderFrame(ctx);
}

/* ══════════════════════════════════════════════════════════════════
   RENDER: VISTA PIANTA (looking down along -Y)
   camera.up = (0,0,-1) → Camera X = world +X, Camera Y = world -Z
   ══════════════════════════════════════════════════════════════════ */

export function renderPianta(
  canvas: HTMLCanvasElement,
  P: SceneParams,
  meta: RenderMeta,
  basePlate: boolean,
  prebuiltScene?: THREE.Scene,
): void {
  const shared = !!prebuiltScene;
  const scene = prebuiltScene ?? buildLedwallScene(P, basePlate).scene;
  const b = sceneBounds(P);
  const pad = 0.3;

  const sceneW = b.xMax - b.xMin + 2 * pad;
  const sceneH = b.zMax - b.zMin + 2 * pad;
  const cx = (b.xMin + b.xMax) / 2;
  const cz = (b.zMin + b.zMax) / 2;

  const cam = new THREE.OrthographicCamera(
    -sceneW / 2, sceneW / 2, sceneH / 2, -sceneH / 2, 0.1, 100,
  );
  cam.up.set(0, 0, -1);
  cam.position.set(cx, 30, cz);
  cam.lookAt(cx, 0, cz);

  const { ctx, ox, oy, renderH, scale } = setupRender(canvas, scene, cam, sceneW, sceneH, shared);

  const toX = (wx: number) => ox + (wx - b.xMin + pad) * scale;
  const toZp = (wz: number) => oy + (wz - b.zMin + pad) * scale;
  const bottomY = oy + renderH;

  // ── Quote orizzontali (sotto) ──
  // Larghezza LED
  drawDimension(ctx, toX(0), bottomY, toX(P.LED_W), bottomY, toMm(P.LED_W), true, { offset: 40 });

  // Interasse gambe
  if (P.LEG_X.length >= 2) {
    const x1 = toX(P.LEG_X[0]);
    const x2 = toX(P.LEG_X[P.LEG_X.length - 1]);
    drawDimension(ctx, x1, bottomY + 30, x2, bottomY + 30,
      toMm(P.LEG_X[P.LEG_X.length - 1] - P.LEG_X[0]), true,
      { offset: 40, font: F_DIM_SM, color: C_ACCENT },
    );
    ctx.strokeStyle = "#cc4444";
    ctx.lineWidth = 1;
    P.LEG_X.forEach((lx) => {
      const px = toX(lx);
      ctx.beginPath();
      ctx.moveTo(px, bottomY + 2);
      ctx.lineTo(px, bottomY + 18);
      ctx.stroke();
    });
  }

  // Piastra base larghezza (sotto 1ᵃ gamba)
  if (basePlate && P.LEG_X.length > 0) {
    const bpW = P.BASE_PLATE_W ?? 0.32;
    const lx0 = P.LEG_X[0];
    drawDimension(ctx, toX(lx0 - bpW / 2), bottomY + 30, toX(lx0 + bpW / 2), bottomY + 30,
      toMm(bpW), true,
      { offset: 90, font: F_DIM_SM, color: "#888" },
    );
  }

  // ── Quote verticali (sinistra) — profondità totale ──
  drawDimension(ctx, toX(0), oy, toX(0), bottomY, toMm(b.zMax), false, { offset: 50 });

  // ── Quote verticali (destra) — breakdown profondità ──
  const rx = toX(P.LED_W);
  // LED depth
  drawDimension(ctx, rx, toZp(0), rx, toZp(P.CAB_D), toMm(P.CAB_D), false, {
    offset: 40, side: "right", font: F_DIM_SM, color: C_ACCENT,
  });

  // Gap LED→Truss
  const gapVal = P.Z_TF - P.CAB_D;
  if (gapVal > 0.03) {
    drawDimension(ctx, rx, toZp(P.CAB_D), rx, toZp(P.Z_TF), toMm(gapVal), false, {
      offset: 40, side: "right", font: F_DIM_SM, color: "#cc6600",
    });
  }

  // Sezione truss
  if (P.Z_TB - P.Z_TF > 0.05) {
    drawDimension(ctx, rx, toZp(P.Z_TF), rx, toZp(P.Z_TB), toMm(P.Z_TB - P.Z_TF), false, {
      offset: 40, side: "right", font: F_DIM_SM, color: "#666",
    });
  }

  // Piastra base profondità
  if (basePlate && P.LEG_X.length > 0) {
    const bpInset = P.BASE_PLATE_INSET ?? 0.07;
    const bpD = P.BASE_PLATE_D ?? 0.74;
    const bpFrontZ = P.Z_TF - bpInset;
    const bpBackZ = bpFrontZ + bpD;
    drawDimension(ctx, rx, toZp(bpFrontZ), rx, toZp(bpBackZ), toMm(bpD), false, {
      offset: 90, side: "right", font: F_DIM_SM, color: "#888",
    });
  }

  drawPageHeader(ctx, "VISTA PIANTA", meta.projectName || "Progetto");
  drawDataPanel(ctx, W - MARGIN - 400, 80, 400, meta, "VISTA PIANTA");
  drawTitleBlock(ctx, meta, "VISTA PIANTA");
  drawBorderFrame(ctx);
}
