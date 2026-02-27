/**
 * Render ortografico Three.js per PNG professionali.
 * Viste frontale, laterale, pianta con quote, frecce, pannello dati e title block.
 * Output ad alta risoluzione (2800×2000) per stampa/presentazione.
 */
import * as THREE from "three";
import { buildLedwallScene, type SceneParams } from "./scene-builder";
import type { DrawMeta } from "./draw-technical";

/* ── Canvas dimensions ─────────────────────────────────────────── */
const W = 2800;
const H = 2000;
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
  opts?: { font?: string; offset?: number; color?: string },
) {
  const font = opts?.font ?? F_DIM;
  const offset = opts?.offset ?? DIM_OFFSET;
  const color = opts?.color ?? C_DIM;

  ctx.strokeStyle = C_DIM_LINE;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.font = font;

  if (isHorizontal) {
    const y = Math.max(y1, y2) + offset;
    // Extension lines
    ctx.save();
    ctx.strokeStyle = C_EXT_LINE;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 4);
    ctx.lineTo(x1, y + 6);
    ctx.moveTo(x2, y2 + 4);
    ctx.lineTo(x2, y + 6);
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
    const ty = y - 8;
    ctx.fillStyle = C_BG;
    ctx.fillRect(tx - tw / 2 - 4, ty - 14, tw + 8, 20);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, tx, ty - 3);
  } else {
    const x = Math.min(x1, x2) - offset;
    // Extension lines
    ctx.save();
    ctx.strokeStyle = C_EXT_LINE;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1 - 4, y1);
    ctx.lineTo(x - 6, y1);
    ctx.moveTo(x2 - 4, y2);
    ctx.lineTo(x - 6, y2);
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
    ctx.translate(x - 10, midY);
    ctx.rotate(-Math.PI / 2);
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
    for (const [label, val] of sec.rows) {
      ctx.fillStyle = "#555555";
      ctx.font = F_LABEL;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + padX, cy + lineH / 2);

      ctx.fillStyle = "#111111";
      ctx.font = F_VALUE;
      ctx.textAlign = "right";
      ctx.fillText(val, x + panelW - padX, cy + lineH / 2);

      // Subtle separator line
      if (sec.rows.indexOf([label, val] as any) < sec.rows.length - 1) {
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

function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  renderer.dispose();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry?.dispose();
      if (Array.isArray(o.material)) {
        o.material.forEach((m) => m.dispose());
      } else if (o.material) {
        o.material.dispose();
      }
    }
    if (o instanceof THREE.LineSegments) {
      o.geometry?.dispose();
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   RENDER: VISTA FRONTALE
   ══════════════════════════════════════════════════════════════════ */

export function renderFrontale(
  canvas: HTMLCanvasElement,
  P: SceneParams,
  meta: RenderMeta,
  basePlate: boolean,
): void {
  canvas.width = W;
  canvas.height = H;

  const { scene } = buildLedwallScene(P, basePlate);
  const hTot = P.BOT_BAR + P.LED_H;

  // Layout: drawing area excluding header(60), margins, data panel(420)
  const drawAreaW = W - 2 * MARGIN - 440;
  const drawAreaH = H - 200;

  const scaleX = drawAreaW / P.LED_W;
  const scaleY = drawAreaH / hTot;
  const scale = Math.min(scaleX, scaleY) * 0.82;

  const renderW = Math.floor(P.LED_W * scale);
  const renderH = Math.floor(hTot * scale);
  const ox = MARGIN + 60;
  const oy = 80 + (drawAreaH - renderH) / 2 + 40;

  // Camera
  const pad = 0.2;
  const orthoCam = new THREE.OrthographicCamera(
    -pad, P.LED_W + pad,
    hTot + pad, -P.BOT_BAR - pad,
    0.1, 50,
  );
  orthoCam.position.set(P.LED_W / 2, hTot / 2, 20);
  orthoCam.lookAt(P.LED_W / 2, hTot / 2, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: false, preserveDrawingBuffer: true,
  });
  renderer.setSize(renderW, renderH);
  renderer.setClearColor(0xf0f2f5);
  renderer.render(scene, orthoCam);

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = C_BG;
  ctx.fillRect(0, 0, W, H);

  // Draw 3D render
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.drawImage(renderer.domElement, ox, oy, renderW, renderH);
  ctx.restore();

  // Border around render
  ctx.strokeStyle = C_BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, renderW, renderH);

  disposeScene(scene, renderer);

  // ── Dimensions ──
  const s = scale;
  const bottomY = oy + renderH;

  // Width (total)
  drawDimension(ctx, ox, bottomY, ox + renderW, bottomY, toMm(P.LED_W), true, { offset: 40 });

  // Height (total)
  drawDimension(ctx, ox, oy, ox, bottomY, toMm(hTot), false, { offset: 50 });

  // LED height only (if bottomBar exists)
  if (P.BOT_BAR > 0) {
    const ledTopY = oy;
    const ledBotY = oy + P.LED_H * s;
    drawDimension(ctx, ox, ledTopY, ox, ledBotY, toMm(P.LED_H), false, {
      offset: 100, font: F_DIM_SM, color: C_ACCENT,
    });

    // Bottom bar height
    drawDimension(ctx, ox, ledBotY, ox, bottomY, toMm(P.BOT_BAR), false, {
      offset: 100, font: F_DIM_SM, color: "#666",
    });
  }

  // Leg spacing
  if (P.LEG_X.length >= 2) {
    const x1 = ox + P.LEG_X[0] * s;
    const x2 = ox + P.LEG_X[P.LEG_X.length - 1] * s;
    drawDimension(ctx, x1, bottomY + 30, x2, bottomY + 30,
      toMm(P.LEG_X[P.LEG_X.length - 1] - P.LEG_X[0]), true,
      { offset: 40, font: F_DIM_SM, color: C_ACCENT },
    );
  }

  // Individual leg positions (tick marks)
  if (P.LEG_X.length >= 2) {
    ctx.strokeStyle = "#cc4444";
    ctx.lineWidth = 1;
    P.LEG_X.forEach((lx) => {
      const px = ox + lx * s;
      ctx.beginPath();
      ctx.moveTo(px, bottomY + 2);
      ctx.lineTo(px, bottomY + 18);
      ctx.stroke();
    });
  }

  // ── Page elements ──
  drawPageHeader(ctx, "VISTA FRONTALE", meta.projectName || "Progetto");
  drawDataPanel(ctx, W - MARGIN - 400, 80, 400, meta, "VISTA FRONTALE");
  drawTitleBlock(ctx, meta, "VISTA FRONTALE");
  drawBorderFrame(ctx);
}

/* ══════════════════════════════════════════════════════════════════
   RENDER: VISTA LATERALE
   ══════════════════════════════════════════════════════════════════ */

export function renderLaterale(
  canvas: HTMLCanvasElement,
  P: SceneParams,
  meta: RenderMeta,
  basePlate: boolean,
): void {
  canvas.width = W;
  canvas.height = H;

  const { scene } = buildLedwallScene(P, basePlate);
  const depth = P.Z_TB + (P.LEG_ARM || 0);
  const hTot = P.BOT_BAR + P.LED_H;

  const drawAreaW = W - 2 * MARGIN - 440;
  const drawAreaH = H - 200;

  const scaleX = drawAreaW / depth;
  const scaleY = drawAreaH / hTot;
  const scale = Math.min(scaleX, scaleY) * 0.82;

  const renderW = Math.floor(depth * scale);
  const renderH = Math.floor(hTot * scale);
  const ox = MARGIN + 60;
  const oy = 80 + (drawAreaH - renderH) / 2 + 40;

  const pad = 0.2;
  const orthoCam = new THREE.OrthographicCamera(
    -pad, depth + pad,
    hTot + pad, -pad,
    0.1, 50,
  );
  orthoCam.position.set(P.LED_W / 2 + 30, hTot / 2, depth / 2);
  orthoCam.lookAt(P.LED_W / 2, hTot / 2, depth / 2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: false, preserveDrawingBuffer: true,
  });
  renderer.setSize(renderW, renderH);
  renderer.setClearColor(0xf0f2f5);
  renderer.render(scene, orthoCam);

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

  disposeScene(scene, renderer);

  const bottomY = oy + renderH;

  // Width dimension (depth)
  drawDimension(ctx, ox, bottomY, ox + renderW, bottomY, toMm(depth), true, { offset: 40 });

  // Height dimension
  drawDimension(ctx, ox, oy, ox, bottomY, toMm(hTot), false, { offset: 50 });

  // LED depth sub-dimension
  const ledDepthPx = P.CAB_D * scale;
  if (ledDepthPx > 30) {
    drawDimension(ctx, ox, bottomY + 30, ox + ledDepthPx, bottomY + 30, toMm(P.CAB_D), true, {
      offset: 40, font: F_DIM_SM, color: C_ACCENT,
    });
  }

  // Truss depth sub-dimension
  const zTfPx = P.Z_TF * scale;
  const zTbPx = P.Z_TB * scale;
  if (zTbPx - zTfPx > 20) {
    drawDimension(ctx, ox + zTfPx, bottomY + 30, ox + zTbPx, bottomY + 30,
      toMm(P.Z_TB - P.Z_TF), true,
      { offset: 80, font: F_DIM_SM, color: "#666" },
    );
  }

  // LED height + bottom bar
  if (P.BOT_BAR > 0) {
    const ledBotY = oy + P.LED_H * scale;
    drawDimension(ctx, ox, oy, ox, ledBotY, toMm(P.LED_H), false, {
      offset: 100, font: F_DIM_SM, color: C_ACCENT,
    });
  }

  drawPageHeader(ctx, "VISTA LATERALE", meta.projectName || "Progetto");
  drawDataPanel(ctx, W - MARGIN - 400, 80, 400, meta, "VISTA LATERALE");
  drawTitleBlock(ctx, meta, "VISTA LATERALE");
  drawBorderFrame(ctx);
}

/* ══════════════════════════════════════════════════════════════════
   RENDER: VISTA PIANTA (top view)
   ══════════════════════════════════════════════════════════════════ */

export function renderPianta(
  canvas: HTMLCanvasElement,
  P: SceneParams,
  meta: RenderMeta,
  basePlate: boolean,
): void {
  canvas.width = W;
  canvas.height = H;

  const { scene } = buildLedwallScene(P, basePlate);
  const depth = P.Z_TB + (P.LEG_ARM || 0);

  const drawAreaW = W - 2 * MARGIN - 440;
  const drawAreaH = H - 200;

  const scaleX = drawAreaW / P.LED_W;
  const scaleY = drawAreaH / depth;
  const scale = Math.min(scaleX, scaleY) * 0.82;

  const renderW = Math.floor(P.LED_W * scale);
  const renderH = Math.floor(depth * scale);
  const ox = MARGIN + 60;
  const oy = 80 + (drawAreaH - renderH) / 2 + 40;

  const pad = 0.2;
  const orthoCam = new THREE.OrthographicCamera(
    -pad, P.LED_W + pad,
    depth + pad, -pad,
    0.1, 50,
  );
  orthoCam.position.set(P.LED_W / 2, 30, depth / 2);
  orthoCam.lookAt(P.LED_W / 2, 0, depth / 2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: false, preserveDrawingBuffer: true,
  });
  renderer.setSize(renderW, renderH);
  renderer.setClearColor(0xf0f2f5);
  renderer.render(scene, orthoCam);

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

  disposeScene(scene, renderer);

  const s = scale;
  const bottomY = oy + renderH;

  // Width
  drawDimension(ctx, ox, bottomY, ox + renderW, bottomY, toMm(P.LED_W), true, { offset: 40 });

  // Depth
  drawDimension(ctx, ox, oy, ox, bottomY, toMm(depth), false, { offset: 50 });

  // Leg positions
  if (P.LEG_X.length >= 2) {
    const x1 = ox + P.LEG_X[0] * s;
    const x2 = ox + P.LEG_X[P.LEG_X.length - 1] * s;
    drawDimension(ctx, x1, bottomY + 30, x2, bottomY + 30,
      toMm(P.LEG_X[P.LEG_X.length - 1] - P.LEG_X[0]), true,
      { offset: 40, font: F_DIM_SM, color: C_ACCENT },
    );

    // Tick marks for individual legs
    ctx.strokeStyle = "#cc4444";
    ctx.lineWidth = 1;
    P.LEG_X.forEach((lx) => {
      const px = ox + lx * s;
      ctx.beginPath();
      ctx.moveTo(px, bottomY + 2);
      ctx.lineTo(px, bottomY + 18);
      ctx.stroke();
    });
  }

  drawPageHeader(ctx, "VISTA PIANTA", meta.projectName || "Progetto");
  drawDataPanel(ctx, W - MARGIN - 400, 80, 400, meta, "VISTA PIANTA");
  drawTitleBlock(ctx, meta, "VISTA PIANTA");
  drawBorderFrame(ctx);
}
