/**
 * Database risoluzioni pixel per pitch LED — fonti Uniview, NovaStar
 *
 * 500×500mm: pixel per lato (W×H = stesso valore)
 * 500×1000mm: W = pixelsPer500mm, H = 2× (es. 2.6 → 192×384)
 *
 * Fonti: Uniview UR/AS (ledwallcentral.com), NovaStar
 */
export const PITCH_DB: Record<
  number,
  { pixelsPer500mm: number; pitchActual_mm: number; source: string }
> = {
  1.5: {
    pixelsPer500mm: 320,
    pitchActual_mm: 1.562,
    source: "Uniview AS 1.5 — 500×500: 320×320 px | 500×1000: 320×640 px",
  },
  1.9: {
    pixelsPer500mm: 256,
    pitchActual_mm: 1.953,
    source: "Uniview AS 1.9 — 500×500: 256×256 px | 500×1000: 256×512 px",
  },
  2.6: {
    pixelsPer500mm: 192,
    pitchActual_mm: 2.604,
    source: "Uniview UR 2.6 2H — 500×500: 192×192 px | 500×1000: 192×384 px",
  },
  2.9: {
    pixelsPer500mm: 168,
    pitchActual_mm: 2.976,
    source: "Uniview UR 2.9 2H — 500×500: 168×168 px | 500×1000: 168×336 px",
  },
  3.9: {
    pixelsPer500mm: 128,
    pitchActual_mm: 3.906,
    source: "Uniview UR 3.9 2H — 500×500: 128×128 px | 500×1000: 128×256 px",
  },
  4.8: {
    pixelsPer500mm: 104,
    pitchActual_mm: 4.807,
    source: "Uniview UR 4.8 2H — 500×500: 104×104 px | 500×1000: 104×208 px",
  },
};

/** Ritorna i pixel per 500mm per un dato pitch. Fallback: calcolo da pitch se non in DB. */
export function getPixelsPer500mm(pitch_mm: number): number {
  const entry = PITCH_DB[pitch_mm];
  if (entry) return entry.pixelsPer500mm;
  return Math.floor(500 / pitch_mm);
}
