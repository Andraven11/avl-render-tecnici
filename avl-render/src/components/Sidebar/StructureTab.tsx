import { useState, useEffect } from "react";
import { useProjectStore } from "@/store/project-store";

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

export function StructureTab() {
  const { project, setStructure, updateLegs, updateTubes } = useProjectStore();
  const { structure, computed } = project;
  const legs = structure.legs;
  const tubes = structure.horizontalTubes;

  return (
    <div className="space-y-4">
      <h3 className="text-avl-cyan text-xs font-bold tracking-wider uppercase border-b border-avl-border pb-2">
        Struttura
      </h3>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Montaggio</label>
        <select
          value={structure.mountType}
          onChange={(ev) => {
            const v = ev.target.value as "ground" | "flying";
            setStructure({
              mountType: v,
              legs: v === "ground" ? (structure.legs ?? { count: 4, height_mm: 2000, armLength_mm: 420, edgeOffset_mm: 500, basePlate: true }) : null,
            });
          }}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white"
        >
          <option value="ground">A terra</option>
          <option value="flying">Appeso (flying)</option>
        </select>
      </div>

      <div>
        <label className="block text-avl-muted text-xs mb-1">Truss</label>
        <select
          value={structure.trussModel}
          onChange={(ev) => setStructure({ trussModel: ev.target.value as "QX30" | "FX30" })}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white"
        >
          <option value="QX30">LITEC QX30SA (Americana 290×290)</option>
          <option value="FX30">Piatta FX30 (220×30, piastra 500×700)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="bottomBar"
          checked={structure.bottomBar}
          onChange={(ev) => setStructure({ bottomBar: ev.target.checked })}
          className="rounded border-avl-border"
        />
        <label htmlFor="bottomBar" className="text-sm">Bottom bar</label>
      </div>

      {structure.bottomBar && (
        <NumInput
          label="Altezza bottom bar (mm)"
          value={structure.bottomBarHeight_mm}
          onCommit={(v) => setStructure({ bottomBarHeight_mm: v })}
          className="w-full bg-avl-bg2 border border-avl-border rounded px-3 py-2 text-sm text-white"
        />
      )}

      {structure.mountType === "ground" && legs && (
        <>
          <div className="border-t border-avl-border pt-3">
            <h4 className="text-avl-muted text-xs mb-2">Gambe a L</h4>
            <div className="space-y-2">
              <NumInput
                label="Numero gambe"
                value={legs.count}
                onCommit={(v) => updateLegs({ count: Math.max(2, Math.min(computed.maxLegs ?? 8, v)) })}
                min={2}
                max={computed.maxLegs ?? 8}
                className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <NumInput
                  label="Altezza (mm)"
                  value={legs.height_mm}
                  onCommit={(v) => updateLegs({ height_mm: v })}
                  className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
                />
                <NumInput
                  label="Braccio (mm)"
                  value={legs.armLength_mm}
                  onCommit={(v) => updateLegs({ armLength_mm: v })}
                  className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
                />
              </div>
              <NumInput
                label="Offset bordo (mm)"
                value={legs.edgeOffset_mm}
                onCommit={(v) => updateLegs({ edgeOffset_mm: v })}
                className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="basePlate"
                  checked={legs.basePlate}
                  onChange={(ev) => updateLegs({ basePlate: ev.target.checked })}
                  className="rounded border-avl-border"
                />
                <label htmlFor="basePlate" className="text-sm">Piastra base</label>
              </div>
            </div>
          </div>
          <div className="text-xs text-avl-muted">
            Interasse: {Math.round(computed.legSpacing_mm)} mm
          </div>
        </>
      )}

      <div className="border-t border-avl-border pt-3">
        <h4 className="text-avl-muted text-xs mb-2">Tubi orizzontali</h4>
        <div className="space-y-2">
          <NumInput
            label="Numero tubi"
            value={tubes.count}
            onCommit={(v) => updateTubes({ count: Math.max(0, Math.min(6, v)) })}
            min={0}
            max={6}
            className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
          />
          <NumInput
            label="Diametro (mm)"
            value={tubes.diameter_mm}
            onCommit={(v) => updateTubes({ diameter_mm: v })}
            className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
          />
          <div>
            <label className="block text-avl-muted text-xs mb-1">Aliscaff</label>
            <select
              value={tubes.clampType}
              onChange={(ev) => updateTubes({ clampType: ev.target.value as "single" | "double" })}
              className="w-full bg-avl-bg2 border border-avl-border rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="single">Singolo</option>
              <option value="double">Doppio</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-avl-border pt-3 text-xs">
        <div className="flex justify-between">
          <span className="text-avl-muted">Peso totale:</span>
          <span className="text-avl-gold font-bold">~{Math.round(computed.totalWeight_kg)} kg</span>
        </div>
      </div>
    </div>
  );
}
