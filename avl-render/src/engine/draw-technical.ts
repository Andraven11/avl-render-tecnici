/**
 * Generazione disegni tecnici professionali per LEDwall.
 * Viste ortografiche con quote in mm, title block, scala.
 */

export interface DrawMeta {
  projectName: string;
  date: string;
  designer: string;
  scale: string;
}

export interface DrawParams {
  LED_W: number;
  LED_H: number;
  BOT_BAR: number;
  CAB_D: number;
  LEG_X: number[];
  LEG_H: number;
  LEG_ARM: number;
  Z_TF: number;
  Z_TB: number;
  Z_TUBE?: number;
  TUBE_Y: number[];
  TUBE_R: number;
  QX: number;
  QH: number;
  IS_FLAT?: boolean;
  QX_DEPTH?: number;
  BASE_PLATE_W?: number;
  BASE_PLATE_D?: number;
}

const MARGIN = 50;
const DIM_OFFSET = 25;
const ARROW_SIZE = 6;
const FONT = "12px 'Segoe UI', Arial, sans-serif";
const FONT_TITLE = "14px 'Segoe UI', Arial, sans-serif";

function drawDimension(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  value: string,
  isHorizontal: boolean
) {
  ctx.strokeStyle = "#333";
  ctx.fillStyle = "#333";
  ctx.lineWidth = 0.5;
  ctx.font = FONT;

  const gap = 8;
  let dimX1: number, dimY1: number, dimX2: number, dimY2: number;
  let textX: number, textY: number;

  if (isHorizontal) {
    const y = Math.max(y1, y2) + DIM_OFFSET;
    dimX1 = x1;
    dimY1 = y;
    dimX2 = x2;
    dimY2 = y;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1, y - gap);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2, y - gap);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    textX = (x1 + x2) / 2;
    textY = y - 10;
  } else {
    const x = Math.min(x1, x2) - DIM_OFFSET;
    dimX1 = x;
    dimY1 = y1;
    dimX2 = x;
    dimY2 = y2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x + gap, y1);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x + gap, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
    textX = x + 8;
    textY = (y1 + y2) / 2;
  }

  ctx.save();
  if (!isHorizontal) {
    ctx.translate(textX, textY);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(-textX, -textY);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, textX, textY);
  ctx.restore();

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ax = (dx / len) * ARROW_SIZE;
  const ay = (dy / len) * ARROW_SIZE;
  ctx.beginPath();
  ctx.moveTo(dimX1, dimY1);
  ctx.lineTo(dimX1 + ax - ay * 0.3, dimY1 + ay + ax * 0.3);
  ctx.lineTo(dimX1 + ax + ay * 0.3, dimY1 + ay - ax * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(dimX2, dimY2);
  ctx.lineTo(dimX2 - ax - ay * 0.3, dimY2 - ay + ax * 0.3);
  ctx.lineTo(dimX2 - ax + ay * 0.3, dimY2 - ay - ax * 0.3);
  ctx.closePath();
  ctx.fill();
}

function drawTitleBlock(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  meta: DrawMeta
) {
  const tw = 180;
  const th = 50;
  const tx = width - MARGIN - tw;
  const ty = height - MARGIN - th;

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(tx, ty, tw, th);

  ctx.fillStyle = "#000";
  ctx.font = "10px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Progetto: ${meta.projectName}`, tx + 6, ty + 6);
  ctx.fillText(`Scala: ${meta.scale}`, tx + 6, ty + 18);
  ctx.fillText(`Data: ${meta.date}`, tx + 6, ty + 30);
  ctx.fillText(`Progettista: ${meta.designer}`, tx + 6, ty + 42);
}

function toMm(v: number): string {
  return Math.round(v * 1000) + " mm";
}

/** Vista frontale: X (larghezza) × Y (altezza) */
export function drawFrontale(
  canvas: HTMLCanvasElement,
  P: DrawParams,
  meta: DrawMeta
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scale = 60;
  const ox = MARGIN;
  const oy = canvas.height - MARGIN;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const w = P.LED_W * scale;
  const hTot = (P.BOT_BAR + P.LED_H) * scale;

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#e8f4fc";
  ctx.fillRect(ox, oy - hTot, w, hTot);
  ctx.strokeRect(ox, oy - hTot, w, hTot);

  if (P.BOT_BAR > 0) {
    const bh = P.BOT_BAR * scale;
    ctx.fillStyle = "#b0bec5";
    ctx.fillRect(ox, oy - bh, w, bh);
    ctx.strokeRect(ox, oy - bh, w, bh);
  }

  ctx.fillStyle = "#1a6fce";
  const ledH = P.LED_H * scale;
  ctx.fillRect(ox, oy - hTot, w, ledH);
  ctx.strokeRect(ox, oy - hTot, w, ledH);

  if (P.LEG_X.length >= 2) {
    const legY = oy - P.LEG_H * scale;
    P.LEG_X.forEach((lx) => {
      const x = ox + lx * scale;
      ctx.strokeStyle = "#455a64";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, oy);
      ctx.lineTo(x, legY);
      ctx.stroke();
    });

    if (P.TUBE_Y.length > 0) {
      P.TUBE_Y.forEach((ty) => {
        const y = oy - ty * scale;
        const x1 = ox + P.LEG_X[0] * scale;
        const x2 = ox + P.LEG_X[P.LEG_X.length - 1] * scale;
        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      });
    }
  }

  drawDimension(ctx, ox, oy, ox + w, oy, toMm(P.LED_W * 1000), true);
  drawDimension(ctx, ox, oy - hTot, ox, oy, toMm((P.BOT_BAR + P.LED_H) * 1000), false);

  if (P.LEG_X.length >= 2) {
    const x1 = ox + P.LEG_X[0] * scale;
    const x2 = ox + P.LEG_X[P.LEG_X.length - 1] * scale;
    drawDimension(ctx, x1, oy + DIM_OFFSET, x2, oy + DIM_OFFSET, toMm((P.LEG_X[P.LEG_X.length - 1] - P.LEG_X[0]) * 1000), true);
  }

  ctx.fillStyle = "#000";
  ctx.font = FONT_TITLE;
  ctx.textAlign = "center";
  ctx.fillText("VISTA FRONTALE", canvas.width / 2, 25);

  drawTitleBlock(ctx, canvas.width, canvas.height, meta);
}

/** Vista laterale: Z (profondità) × Y (altezza) */
export function drawLaterale(
  canvas: HTMLCanvasElement,
  P: DrawParams,
  meta: DrawMeta
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scale = 80;
  const ox = MARGIN;
  const oy = canvas.height - MARGIN;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const depth = (P.Z_TB + (P.LEG_ARM || 0)) * scale;
  const hTot = (P.BOT_BAR + P.LED_H) * scale;

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#e8f4fc";
  ctx.fillRect(ox, oy - hTot, depth, hTot);
  ctx.strokeRect(ox, oy - hTot, depth, hTot);

  if (P.BOT_BAR > 0) {
    const bh = P.BOT_BAR * scale;
    ctx.fillStyle = "#b0bec5";
    ctx.fillRect(ox, oy - bh, depth, bh);
    ctx.strokeRect(ox, oy - bh, depth, bh);
  }

  ctx.fillStyle = "#1a6fce";
  const ledH = P.LED_H * scale;
  const ledD = P.CAB_D * scale;
  ctx.fillRect(ox, oy - hTot, ledD, ledH);
  ctx.strokeRect(ox, oy - hTot, ledD, ledH);

  const zTf = P.Z_TF * scale;
  const zTb = P.Z_TB * scale;
  const legH = P.LEG_H * scale;

  ctx.strokeStyle = "#455a64";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ox + zTf, oy);
  ctx.lineTo(ox + zTf, oy - legH);
  ctx.lineTo(ox + zTb, oy - legH);
  ctx.lineTo(ox + zTb, oy);
  ctx.stroke();

  if (P.LEG_ARM > 0) {
    const zArm = (P.Z_TB + P.LEG_ARM) * scale;
    ctx.beginPath();
    ctx.moveTo(ox + zTb, oy - legH);
    ctx.lineTo(ox + zArm, oy - legH);
    ctx.lineTo(ox + zArm, oy);
    ctx.stroke();
  }

  drawDimension(ctx, ox, oy, ox + depth, oy, toMm((P.Z_TB + (P.LEG_ARM || 0)) * 1000), true);
  drawDimension(ctx, ox, oy - hTot, ox, oy, toMm((P.BOT_BAR + P.LED_H) * 1000), false);

  ctx.fillStyle = "#000";
  ctx.font = FONT_TITLE;
  ctx.textAlign = "center";
  ctx.fillText("VISTA LATERALE", canvas.width / 2, 25);

  drawTitleBlock(ctx, canvas.width, canvas.height, meta);
}

/** Vista pianta: X (larghezza) × Z (profondità) */
export function drawPianta(
  canvas: HTMLCanvasElement,
  P: DrawParams,
  meta: DrawMeta
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scale = 60;
  const ox = MARGIN;
  const oy = canvas.height - MARGIN;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const w = P.LED_W * scale;
  const depth = (P.Z_TB + (P.LEG_ARM || 0)) * scale;

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#e8f4fc";
  ctx.fillRect(ox, oy - depth, w, depth);
  ctx.strokeRect(ox, oy - depth, w, depth);

  ctx.fillStyle = "#1a6fce";
  const ledD = P.CAB_D * scale;
  ctx.fillRect(ox, oy - ledD, w, ledD);
  ctx.strokeRect(ox, oy - ledD, w, ledD);

  if (P.LEG_X.length > 0) {
    const zLeg = P.Z_TB * scale;
    P.LEG_X.forEach((lx) => {
      const x = ox + lx * scale;
      ctx.fillStyle = "#455a64";
      ctx.fillRect(x - 4, oy - zLeg - 4, 8, 8);
      ctx.strokeRect(x - 4, oy - zLeg - 4, 8, 8);
    });
  }

  drawDimension(ctx, ox, oy, ox + w, oy, toMm(P.LED_W * 1000), true);
  drawDimension(ctx, ox, oy - depth, ox, oy, toMm((P.Z_TB + (P.LEG_ARM || 0)) * 1000), false);

  ctx.fillStyle = "#000";
  ctx.font = FONT_TITLE;
  ctx.textAlign = "center";
  ctx.fillText("VISTA PIANTA", canvas.width / 2, 25);

  drawTitleBlock(ctx, canvas.width, canvas.height, meta);
}
