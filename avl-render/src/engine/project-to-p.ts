import type { Project } from "@/types/project";
import { TRUSS_DB } from "./truss-db";

export function projectToP(project: Project) {
  const { led, structure, computed } = project;
  const legs = structure.legs;
  const botBar = structure.bottomBar ? structure.bottomBarHeight_mm / 1000 : 0;

  const LEG_X = (legs ? computed.legPositions_mm : []).map((x) => x / 1000);
  const TUBE_Y = computed.tubePositions_mm.map((y) => y / 1000);

  const spec = TRUSS_DB[structure.trussModel];
  const QX = structure.trussSection_mm / 1000;
  const QX_DEPTH = (structure.trussSectionDepth_mm ?? structure.trussSection_mm) / 1000;
  const isFlat = spec?.isFlat ?? false;
  const trussDepth = isFlat ? QX : QX_DEPTH;
  const Z_LED_BACK = led.tileDepth_mm / 1000;
  // Senza tubi: montaggio diretto con aliscaf+distanziatore, retro LED a 21cm da americana
  const Z_GAP = structure.horizontalTubes.count === 0 ? 0.21 : 0.15;
  const Z_TF = Z_LED_BACK + Z_GAP;
  const Z_TC = Z_TF + trussDepth / 2;
  const Z_TB = Z_TF + trussDepth;
  const LEG_ARM = legs ? legs.armLength_mm / 1000 : 0;
  const QH = QX / 2;

  return {
    LED_W: led.width_mm / 1000,
    LED_H: led.height_mm / 1000,
    LED_H_ACTIVE: led.activeHeight_mm / 1000,
    LED_W_ACTIVE: led.activeWidth_mm / 1000,
    CAB_W: led.tileWidth_mm / 1000,
    CAB_H: led.tileHeight_mm / 1000,
    CAB: led.tileWidth_mm / 1000, // retrocompat
    CAB_D: led.tileDepth_mm / 1000,
    CAB_ROWS: computed.rows,
    CAB_COLS: computed.cols,
    DEAD_ROWS: led.deadRows ?? 0,
    DEAD_COLS: led.deadCols ?? 0,
    BOT_BAR: botBar,
    LEG_X,
    LEG_H: legs ? legs.height_mm / 1000 : 0,
    LEG_ARM,
    QX,
    QX_DEPTH,
    IS_FLAT: isFlat,
    BASE_PLATE_W: (spec?.basePlateWidth_mm ?? 320) / 1000,
    BASE_PLATE_D: (spec?.basePlateDepth_mm ?? 740) / 1000,
    BASE_PLATE_INSET: (spec?.basePlateInset_mm ?? 70) / 1000,
    CHORD_R: structure.trussChordDia_mm / 2000,
    DIAG_R: structure.trussDiagDia_mm / 2000,
    Z_LED_BACK,
    Z_GAP,
    Z_TF,
    Z_TC,
    Z_TB,
    QH,
    TUBE_R: structure.horizontalTubes.diameter_mm / 2000,
    TUBE_Y,
  };
}
