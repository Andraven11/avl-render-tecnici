import { useState } from "react";
import { EventTab } from "@/components/Sidebar/EventTab";
import { LedTab } from "@/components/Sidebar/LedTab";
import { StructureTab } from "@/components/Sidebar/StructureTab";
import { ExportPanel } from "@/components/Sidebar/ExportPanel";
import { Viewer3D } from "@/components/Preview/Viewer3D";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type Tab = "evento" | "led" | "struttura";

export default function App() {
  const [tab, setTab] = useState<Tab>("evento");

  return (
    <div className="h-screen flex flex-col bg-avl-bg text-avl-cyan">
      <header className="flex-shrink-0 px-4 py-3 border-b border-avl-border">
        <h1 className="text-lg font-bold tracking-wider">AVL RENDER TECNICI</h1>
        <p className="text-xs text-avl-muted">Disegni tecnici LEDwall — Stand a terra</p>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-80 flex-shrink-0 border-r border-avl-border overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex gap-1">
              {(["evento", "led", "struttura"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${tab === t
                    ? "bg-avl-cyan text-black"
                    : "bg-avl-bg2 text-avl-muted hover:text-avl-cyan"
                    }`}
                >
                  {t === "evento" ? "Evento" : t === "led" ? "LED" : "Struttura"}
                </button>
              ))}
            </div>

            {tab === "evento" && <EventTab />}
            {tab === "led" && <LedTab />}
            {tab === "struttura" && <StructureTab />}

            <ExportPanel />
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 p-4">
          <div className="flex-1 rounded overflow-hidden border border-avl-border bg-avl-bg2">
            <ErrorBoundary>
              <Viewer3D />
            </ErrorBoundary>
          </div>
          <p className="text-xs text-avl-muted mt-2">
            Trascina: ruota · Scroll: zoom · Tasto destro: pan
          </p>
        </main>
      </div>
    </div>
  );
}
