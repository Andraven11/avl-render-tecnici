import { useState, useEffect } from "react";
import { useProjectStore } from "@/store/project-store";
import { CONTROLLER_DB } from "@/engine/controller-db";
import type { ControllerModel } from "@/types/project";

function NumInput({
  value,
  onCommit,
  step,
  min,
  max,
  label,
  className = "",
}: {
  value: number;
  onCommit: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
  className?: string;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => {
    setLocal(String(value));
  }, [value]);
  const commit = () => {
    const n = +local;
    if (!Number.isNaN(n)) {
      let v = n;
      if (min != null) v = Math.max(min, v);
      if (max != null) v = Math.min(max, v);
      onCommit(v);
    }
  };
  return (
    <div>
      <label className="block text-avl-muted text-xs mb-1">{label}</label>
      <input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        step={step}
        min={min}
        max={max}
        className={className}
      />
    </div>
  );
}

export function LedTab() {
  const { project, setLed, setTileSize } = useProjectStore();
  const { led, computed } = project;

  return (
    <div className="space-y-4">
      <h3 className="text-avl-cyan text-xs font-bold tracking-wider uppercase border-b border-avl-border pb-2">
        LEDwall
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <NumInput
          label="Larghezza (mm)"
          value={led.width_mm}
          onCommit={(v) => setLed({ width_mm: v })}
          step={led.tileWidth_mm}
          min={led.tileWidth_mm}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
        />
        <NumInput
          label="Altezza (mm)"
          value={led.height_mm}
          onCommit={(v) => setLed({ height_mm: v })}
          step={led.tileHeight_mm}
          min={led.tileHeight_mm}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumInput
          label="Larghezza attiva (mm)"
          value={led.activeWidth_mm}
          onCommit={(v) => setLed({ activeWidth_mm: Math.min(led.width_mm, v) })}
          step={led.tileWidth_mm}
          min={0}
          max={led.width_mm}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
        />
        <NumInput
          label="Altezza attiva (mm)"
          value={led.activeHeight_mm}
          onCommit={(v) => setLed({ activeHeight_mm: Math.min(led.height_mm, v) })}
          step={led.tileHeight_mm}
          min={0}
          max={led.height_mm}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
        />
      </div>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Mattonella</label>
        <select
          value={led.tileSize}
          onChange={(ev) => setTileSize(ev.target.value as "500x500" | "500x1000")}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white"
        >
          <option value="500x500">500 × 500 mm</option>
          <option value="500x1000">500 × 1000 mm</option>
        </select>
      </div>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Pitch (mm)</label>
        <select
          value={led.tilePitch_mm}
          onChange={(ev) => setLed({ tilePitch_mm: +ev.target.value })}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white"
        >
          <option value={1.5}>1.5</option>
          <option value={1.9}>1.9</option>
          <option value={2.6}>2.6</option>
          <option value={2.9}>2.9</option>
          <option value={3.9}>3.9</option>
          <option value={4.8}>4.8</option>
        </select>
      </div>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Centralina</label>
        <select
          value={led.controller ?? "vx1000"}
          onChange={(ev) => setLed({ controller: ev.target.value as ControllerModel })}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white"
        >
          <option value="vx1000">{CONTROLLER_DB.vx1000.label} (6.5M px, 10 eth)</option>
          <option value="mctr4k">{CONTROLLER_DB.mctr4k.label} (8.8M px, 16 eth)</option>
          <option value="h2">{CONTROLLER_DB.h2.label} (26M px, 40 eth)</option>
        </select>
      </div>

      <NumInput
        label="Righe spente (basso)"
        value={led.deadRows}
        onCommit={(v) => setLed({ deadRows: Math.max(0, Math.min(computed.rows, v)) })}
        min={0}
        max={computed.rows}
        className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white"
      />

      <div className="border-t border-avl-border pt-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-avl-muted">Cabinet:</span>
          <span className="text-avl-gold font-bold">{computed.cols} × {computed.rows}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-avl-muted">Attivi:</span>
          <span className="text-avl-gold">{computed.activeTiles}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-avl-muted">Pixel map:</span>
          <span className="text-avl-gold">{computed.resolutionX_px} × {computed.resolutionY_px} px</span>
        </div>
        <div className="flex justify-between">
          <span className="text-avl-muted">Peso LED:</span>
          <span className="text-avl-gold">~{Math.round(computed.ledWeight_kg)} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-avl-muted">Consumo:</span>
          <span className="text-avl-gold">~{computed.powerConsumption_W} W</span>
        </div>
      </div>

      <div className="border-t border-avl-border pt-3 space-y-2">
        <h4 className="text-avl-cyan text-xs font-bold uppercase">Schema corrente</h4>
        <div className="text-xs text-avl-muted space-y-0.5">
          <div>{computed.powerSchema.schema}</div>
          <div className="text-avl-gold">~{computed.powerSchema.wattPerLinea} W max/linea</div>
        </div>
      </div>

      <div className="border-t border-avl-border pt-3 space-y-2">
        <h4 className="text-avl-cyan text-xs font-bold uppercase">Schema rete</h4>
        <div className={`text-xs space-y-0.5 ${computed.networkSchema.controllerCompatibile ? "text-avl-gold" : "text-red-400"}`}>
          <div>{computed.networkSchema.schema}</div>
          <div className="text-avl-muted">~{computed.networkSchema.pixelPerPorta.toLocaleString()} px/porta</div>
        </div>
      </div>
    </div>
  );
}
