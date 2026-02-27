import { create } from "zustand";
import type {
  Project,
  EventInfo,
  LedConfig,
  StructureConfig,
  LegConfig,
  TubeConfig,
} from "@/types/project";
import { computeValues, getTileDimensions } from "@/engine/compute";
import { TRUSS_DB } from "@/engine/truss-db";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function defaultEvent(): EventInfo {
  return {
    projectName: "Nuovo Progetto",
    client: "",
    location: "",
    eventDate: todayISO(),
    setupDate: todayISO(),
    teardownDate: todayISO(),
    notes: "",
    designer: "Andrea",
    revision: 1,
  };
}

function defaultLed(): LedConfig {
  const tile = getTileDimensions("500x500");
  return {
    width_mm: 5000,
    height_mm: 2000,
    activeWidth_mm: 5000,
    activeHeight_mm: 1500,
    tileSize: "500x500",
    tileWidth_mm: tile.width,
    tileHeight_mm: tile.height,
    tilePitch_mm: 2.6,
    tileDepth_mm: 80,
    tileWeight_kg: tile.weight,
    deadRows: 1,
    deadCols: 0,
    controller: "vx1000",
  };
}

function defaultLegs(): LegConfig {
  return {
    count: 4,
    height_mm: 2000,
    armLength_mm: 420,
    edgeOffset_mm: 500,
    basePlate: true,
  };
}

function defaultStructure(): StructureConfig {
  const qx = TRUSS_DB.QX30;
  return {
    mountType: "ground",
    wallShape: "flat",
    trussModel: "QX30",
    trussSection_mm: qx.section_mm,
    trussSectionDepth_mm: qx.sectionDepth_mm,
    trussChordDia_mm: qx.chordDia_mm,
    trussDiagDia_mm: qx.diagDia_mm,
    legs: defaultLegs(),
    bottomBar: true,
    bottomBarHeight_mm: 100,
    bottomBarDia_mm: 50,
    flyingBar: false,
    horizontalTubes: {
      count: 3,
      diameter_mm: 50,
      clampType: "double",
    },
  };
}

export function createProject(): Project {
  const event = defaultEvent();
  const led = defaultLed();
  const structure = defaultStructure();
  const computed = computeValues(led, structure);
  return {
    version: "1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    event,
    led,
    structure,
    computed,
  };
}

/** Valida e normalizza un progetto caricato da JSON. Merge con default per campi mancanti. */
export function validateProject(p: unknown): Project | null {
  if (!p || typeof p !== "object") return null;
  const obj = p as Record<string, unknown>;

  if (!obj.event || typeof obj.event !== "object") return null;
  const ev = obj.event as Record<string, unknown>;
  if (!ev.projectName || typeof ev.projectName !== "string") return null;

  const ledObj = obj.led as Record<string, unknown> | undefined;
  if (!ledObj || typeof ledObj !== "object") return null;
  if (
    typeof ledObj.width_mm !== "number" ||
    typeof ledObj.height_mm !== "number"
  )
    return null;

  const structObj = obj.structure as Record<string, unknown> | undefined;
  if (!structObj || typeof structObj !== "object") return null;
  if (!structObj.mountType || typeof structObj.mountType !== "string")
    return null;

  const defaults = createProject();
  const merged: Project = {
    ...defaults,
    ...obj,
    event: { ...defaults.event, ...ev },
    led: { ...defaults.led, ...ledObj },
    structure: { ...defaults.structure, ...structObj },
  } as Project;
  merged.computed = computeValues(merged.led, merged.structure);
  return merged;
}

interface ProjectStore {
  project: Project;
  setEvent: (e: Partial<EventInfo>) => void;
  setLed: (l: Partial<LedConfig>) => void;
  setStructure: (s: Partial<StructureConfig>) => void;
  updateLegs: (l: Partial<LegConfig>) => void;
  updateTubes: (t: Partial<TubeConfig>) => void;
  setTrussModel: (model: "QX30" | "FX30") => void;
  setTileSize: (size: "500x500" | "500x1000") => void;
  recompute: () => void;
  loadProject: (p: Project) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createProject(),

  setEvent: (e) =>
    set((state) => ({
      project: {
        ...state.project,
        event: { ...state.project.event, ...e },
        updatedAt: new Date().toISOString(),
      },
    })),

  setLed: (l) => {
    set((state) => {
      const led = { ...state.project.led, ...l };
      if (l.tileSize) {
        const t = getTileDimensions(l.tileSize);
        led.tileWidth_mm = t.width;
        led.tileHeight_mm = t.height;
        led.tileWeight_kg = t.weight;
      }
      if (led.activeWidth_mm > led.width_mm) led.activeWidth_mm = led.width_mm;
      if (led.activeHeight_mm > led.height_mm) led.activeHeight_mm = led.height_mm;
      const computed = computeValues(led, state.project.structure);
      let structure = state.project.structure;
      if (structure.legs && structure.legs.count > computed.maxLegs) {
        structure = { ...structure, legs: { ...structure.legs, count: computed.maxLegs } };
      }
      return {
        project: {
          ...state.project,
          led,
          structure,
          computed,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setStructure: (s) => {
    set((state) => {
      let structure = { ...state.project.structure, ...s };
      if (s.trussModel) {
        const spec = TRUSS_DB[s.trussModel];
        structure.trussSection_mm = spec.section_mm;
        structure.trussSectionDepth_mm = spec.sectionDepth_mm;
        structure.trussChordDia_mm = spec.chordDia_mm;
        structure.trussDiagDia_mm = spec.diagDia_mm;
      }
      const computed = computeValues(state.project.led, structure);
      if (structure.legs && structure.legs.count > computed.maxLegs) {
        structure = { ...structure, legs: { ...structure.legs, count: computed.maxLegs } };
      }
      return {
        project: {
          ...state.project,
          structure,
          computed,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },

  updateLegs: (l) => {
    const { project } = get();
    if (!project.structure.legs) return;
    get().setStructure({
      legs: { ...project.structure.legs, ...l },
    });
  },

  updateTubes: (t) => {
    const { project } = get();
    get().setStructure({
      horizontalTubes: { ...project.structure.horizontalTubes, ...t },
    });
  },

  setTrussModel: (model) => get().setStructure({ trussModel: model }),

  setTileSize: (size) => get().setLed({ tileSize: size }),

  recompute: () =>
    set((state) => ({
      project: {
        ...state.project,
        computed: computeValues(state.project.led, state.project.structure),
      },
    })),

  loadProject: (p) => set({ project: p }),

  reset: () => set({ project: createProject() }),
}));
