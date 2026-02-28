import type {
  LedConfig,
  StructureConfig,
  ComputedValues,
  LegConfig,
  PowerSchema,
  NetworkSchema,
} from "@/types/project";
import { TRUSS_DB } from "./truss-db";
import { getPixelsPer500mm } from "./pitch-db";
import { CONTROLLER_DB } from "./controller-db";

export function computeValues(
  led: LedConfig,
  structure: StructureConfig
): ComputedValues {
  const safeTileW = Math.max(1, led.tileWidth_mm);
  const safeTileH = Math.max(1, led.tileHeight_mm);
  const cols = Math.round(Math.max(led.width_mm, safeTileW) / safeTileW);
  const rows = Math.round(Math.max(led.height_mm, safeTileH) / safeTileH);
  const totalTiles = cols * rows;
  const activeRows = Math.max(0, rows - led.deadRows);
  const activeTiles = cols * activeRows;

  const ledWeight_kg = totalTiles * led.tileWeight_kg;

  let legPositions_mm: number[] = [];
  let legSpacing_mm = 0;
  let structureWeight_kg = 0;

  if (structure.legs && structure.mountType === "ground") {
    const legs = structure.legs as LegConfig;
    const span = led.width_mm - 2 * legs.edgeOffset_mm;
    legSpacing_mm = legs.count > 1 ? span / (legs.count - 1) : 0;
    for (let i = 0; i < legs.count; i++) {
      legPositions_mm.push(legs.edgeOffset_mm + i * legSpacing_mm);
    }

    const trussSpec = TRUSS_DB[structure.trussModel];
    const legLength_m = (legs.height_mm + (trussSpec?.isFlat ? 0 : legs.armLength_mm)) / 1000;
    structureWeight_kg += legs.count * legLength_m * trussSpec.weight_kg_m;

    const tubeSpan_m = (legPositions_mm[legPositions_mm.length - 1] - legPositions_mm[0]) / 1000;
    structureWeight_kg += structure.horizontalTubes.count * tubeSpan_m * 1.5;
    structureWeight_kg += legs.count * structure.horizontalTubes.count * 2 * 0.5;
    structureWeight_kg += 20;
  }

  const bottomBarH = structure.bottomBar ? structure.bottomBarHeight_mm : 0;
  const tubePositions_mm: number[] = [];
  if (structure.horizontalTubes.count > 0) {
    const usableH = led.height_mm;
    const step = usableH / (structure.horizontalTubes.count + 1);
    for (let i = 1; i <= structure.horizontalTubes.count; i++) {
      tubePositions_mm.push(bottomBarH + step * i);
    }
  }

  const pixelsPer500 = getPixelsPer500mm(led.tilePitch_mm);
  const pixelsPerTileW = pixelsPer500;
  const pixelsPerTileH =
    led.tileHeight_mm === 1000 ? pixelsPer500 * 2 : pixelsPer500;
  const resolutionX_px = Math.round(
    (Math.max(0, led.activeWidth_mm) / safeTileW) * pixelsPerTileW
  );
  const resolutionY_px = Math.round(
    (Math.max(0, led.activeHeight_mm) / safeTileH) * pixelsPerTileH
  );
  const totalPixels = resolutionX_px * resolutionY_px;

  const totalHeight_mm = bottomBarH + led.height_mm;
  const spec = TRUSS_DB[structure.trussModel];
  const trussDepth = spec?.isFlat ? structure.trussSection_mm : (structure.trussSectionDepth_mm ?? structure.trussSection_mm);
  const armLen = spec?.isFlat ? 0 : (structure.legs?.armLength_mm ?? 0);
  // Senza tubi: montaggio diretto, gap 210mm; con tubi: gap 150mm
  const gapMm = structure.horizontalTubes.count === 0 ? 210 : 150;
  const totalDepth_mm = led.tileDepth_mm + gapMm + trussDepth + armLen;

  const powerConsumption_W = totalTiles * 150;
  const powerAmps_16A = Math.ceil(powerConsumption_W / (230 * 16 * 0.85));

  const maxCabinetPerLinea = led.tileHeight_mm === 1000 ? 8 : 16;
  const linee16A = Math.ceil(totalTiles / maxCabinetPerLinea);
  const wattPerLinea = 230 * 16 * 0.85;
  const tileLabel = led.tileHeight_mm === 1000 ? "500×1000" : "500×500";
  const powerSchema: PowerSchema = {
    linee16A: Math.max(powerAmps_16A, linee16A),
    maxCabinetPerLinea,
    wattPerLinea: Math.round(wattPerLinea),
    schema: `${Math.max(powerAmps_16A, linee16A)} linee 16A · max ${maxCabinetPerLinea} cabinet ${tileLabel}/linea`,
  };

  const ctrl = CONTROLLER_DB[led.controller ?? "vx1000"];
  const porteNecessarie = Math.ceil(totalPixels / ctrl.pixelsPerPort);
  const controllerCompatibile = totalPixels <= ctrl.maxPixels;
  const networkSchema: NetworkSchema = {
    porteEthernetUsate: Math.min(porteNecessarie, ctrl.ethernetPorts),
    porteEthernetTotali: ctrl.ethernetPorts,
    controllerCompatibile,
    pixelPerPorta: ctrl.pixelsPerPort,
    schema: controllerCompatibile
      ? `${porteNecessarie} porte ethernet su ${ctrl.ethernetPorts} (${ctrl.label})`
      : `⚠ ${totalPixels.toLocaleString()} px > ${ctrl.maxPixels.toLocaleString()} px max (${ctrl.label})`,
  };

  const maxLegs = Math.max(2, Math.floor(led.width_mm / 500));

  return {
    maxLegs,
    cols,
    rows,
    totalTiles,
    activeTiles,
    ledWeight_kg,
    structureWeight_kg,
    totalWeight_kg: ledWeight_kg + structureWeight_kg,
    resolutionX_px,
    resolutionY_px,
    totalPixels,
    legPositions_mm,
    legSpacing_mm,
    tubePositions_mm,
    totalHeight_mm,
    totalDepth_mm,
    powerConsumption_W,
    powerAmps_16A,
    powerSchema,
    networkSchema,
  };
}

export function getTileDimensions(tileSize: "500x500" | "500x1000") {
  if (tileSize === "500x500") {
    return { width: 500, height: 500, weight: 7.5 };
  }
  return { width: 500, height: 1000, weight: 14 };
}
