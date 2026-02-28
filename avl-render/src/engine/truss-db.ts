import type { TrussModel } from "@/types/project";

export interface TrussSpec {
  section_mm: number;
  sectionDepth_mm: number;
  chordDia_mm: number;
  diagDia_mm: number;
  weight_kg_m: number;
  label: string;
  isFlat: boolean;
  basePlateWidth_mm: number;
  basePlateDepth_mm: number;
  /** Offset dal bordo interno (lato LED) della piastra alla faccia frontale del truss (mm) */
  basePlateInset_mm: number;
  /** Portata distribuita (kg) — span 3m / 5m / 10m — fonte LITEC */
  loadCapacity_kg?: { span3m: number; span5m: number; span10m: number };
}

export const TRUSS_DB: Record<TrussModel, TrussSpec> = {
  QX30: {
    section_mm: 290,
    sectionDepth_mm: 290,
    chordDia_mm: 50,
    diagDia_mm: 18,
    weight_kg_m: 5.3,
    label: "LITEC QX30SA (Americana)",
    isFlat: false,
    basePlateWidth_mm: 320,
    basePlateDepth_mm: 740,
    basePlateInset_mm: 70,
    loadCapacity_kg: { span3m: 2473, span5m: 1750, span10m: 834 },
  },
  FX30: {
    section_mm: 220,
    sectionDepth_mm: 30,
    chordDia_mm: 50,
    diagDia_mm: 20,
    weight_kg_m: 2.8,
    label: "Prolyte FX30 (Piatta/Ladder)",
    isFlat: true,
    basePlateWidth_mm: 320,
    basePlateDepth_mm: 740,
    basePlateInset_mm: 70,
  },
};
