/**
 * Database centraline NovaStar — fonti: novastar.tech, schede tecniche ufficiali
 *
 * Pixel/porta: 650k @8bit, 320k @10/12bit (A10s Plus-N, MCTRL4K spec)
 */
export type ControllerModel = "vx1000" | "mctr4k" | "h2";

export interface ControllerSpec {
  label: string;
  maxPixels: number;
  maxResolutionW: number;
  maxResolutionH: number;
  ethernetPorts: number;
  /** Pixel per porta @8bit (A10s Plus-N: 512×512) — @10/12bit: ~320k */
  pixelsPerPort: number;
  power_W: number;
  source: string;
}

export const CONTROLLER_DB: Record<ControllerModel, ControllerSpec> = {
  vx1000: {
    label: "NovaStar VX1000",
    maxPixels: 6_500_000,
    maxResolutionW: 10240,
    maxResolutionH: 8192,
    ethernetPorts: 10,
    pixelsPerPort: 650_000,
    power_W: 150,
    source: "VX1000 Spec V1.1.1 — 6.5M px, 10×1G",
  },
  mctr4k: {
    label: "NovaStar MCTRL4K",
    maxPixels: 8_847_360,
    maxResolutionW: 7680,
    maxResolutionH: 7680,
    ethernetPorts: 16,
    pixelsPerPort: 650_000,
    power_W: 180,
    source: "MCTRL4K Spec — 650k px/porta @8bit, 16×1G + 4×10G",
  },
  h2: {
    label: "NovaStar H2",
    maxPixels: 26_000_000,
    maxResolutionW: 10752,
    maxResolutionH: 10752,
    ethernetPorts: 40,
    pixelsPerPort: 650_000,
    power_W: 210,
    source: "H2 ledwallcentral.com — 26M px, 40×1G",
  },
};

export function getControllerSpec(model: ControllerModel): ControllerSpec {
  return CONTROLLER_DB[model];
}
