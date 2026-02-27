export type MountType = "ground" | "flying" | "ground_flying";
export type WallShape = "flat" | "concave" | "convex";
export type TrussModel = "QX30" | "FX30";
export type TileSize = "500x500" | "500x1000";
export type ClampType = "single" | "double";
export type ControllerModel = "vx1000" | "mctr4k" | "h2";

export interface EventInfo {
  projectName: string;
  client: string;
  location: string;
  eventDate: string;
  eventDateFrom?: string;
  eventDateTo?: string;
  setupDate: string;
  setupDateFrom?: string;
  setupDateTo?: string;
  teardownDate: string;
  teardownDateFrom?: string;
  teardownDateTo?: string;
  notes: string;
  designer: string;
  revision: number;
}

export interface LedConfig {
  width_mm: number;
  height_mm: number;
  activeWidth_mm: number;
  activeHeight_mm: number;
  tileSize: TileSize;
  tileWidth_mm: number;
  tileHeight_mm: number;
  tilePitch_mm: number;
  tileDepth_mm: number;
  tileWeight_kg: number;
  deadRows: number;
  deadCols: number;
  controller: ControllerModel;
}

export interface LegConfig {
  count: number;
  height_mm: number;
  armLength_mm: number;
  edgeOffset_mm: number;
  basePlate: boolean;
}

export interface TubeConfig {
  count: number;
  diameter_mm: number;
  clampType: ClampType;
}

export interface StructureConfig {
  mountType: MountType;
  wallShape: WallShape;
  trussModel: TrussModel;
  trussSection_mm: number;
  trussSectionDepth_mm: number;
  trussChordDia_mm: number;
  trussDiagDia_mm: number;
  legs: LegConfig | null;
  bottomBar: boolean;
  bottomBarHeight_mm: number;
  bottomBarDia_mm: number;
  flyingBar: boolean;
  horizontalTubes: TubeConfig;
}

export interface PowerSchema {
  linee16A: number;
  maxCabinetPerLinea: number;
  wattPerLinea: number;
  schema: string;
}

export interface NetworkSchema {
  porteEthernetUsate: number;
  porteEthernetTotali: number;
  controllerCompatibile: boolean;
  pixelPerPorta: number;
  schema: string;
}

export interface ComputedValues {
  maxLegs: number;
  cols: number;
  rows: number;
  totalTiles: number;
  activeTiles: number;
  ledWeight_kg: number;
  structureWeight_kg: number;
  totalWeight_kg: number;
  resolutionX_px: number;
  resolutionY_px: number;
  totalPixels: number;
  legPositions_mm: number[];
  legSpacing_mm: number;
  tubePositions_mm: number[];
  totalHeight_mm: number;
  totalDepth_mm: number;
  powerConsumption_W: number;
  powerAmps_16A: number;
  powerSchema: PowerSchema;
  networkSchema: NetworkSchema;
}

export interface Project {
  version: string;
  createdAt: string;
  updatedAt: string;
  event: EventInfo;
  led: LedConfig;
  structure: StructureConfig;
  computed: ComputedValues;
}
