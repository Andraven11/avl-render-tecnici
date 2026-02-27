import { useProjectStore, validateProject } from "@/store/project-store";
import { exportProject } from "@/engine/export";

export function ExportPanel() {
  const { project } = useProjectStore();

  function handleExport() {
    exportProject(project).catch((e) => {
      console.error("Export error:", e);
      alert(`Errore export: ${e instanceof Error ? e.message : String(e)}`);
    });
  }

  function handleSave() {
    try {
      const data = JSON.stringify(project, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.event.projectName.replace(/\s+/g, "_")}_progetto.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Salva progetto error:", e);
      alert(`Errore salvataggio: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function handleLoad() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        const p = validateProject(parsed);
        if (!p) {
          alert("File non valido: campi obbligatori mancanti");
          return;
        }
        useProjectStore.getState().loadProject(p);
      } catch (e) {
        alert("File non valido");
      }
    };
    input.click();
  }

  return (
    <div className="border-t border-avl-border pt-4 space-y-2">
      <button
        onClick={handleExport}
        className="w-full bg-avl-cyan text-black font-bold py-2.5 px-4 rounded hover:bg-cyan-300 transition-colors text-sm"
      >
        EXPORT HTML + PNG
      </button>
      <button
        onClick={handleSave}
        className="w-full bg-avl-bg2 border border-avl-border text-avl-cyan py-2 px-4 rounded hover:border-avl-cyan transition-colors text-sm"
      >
        Salva progetto
      </button>
      <button
        onClick={handleLoad}
        className="w-full bg-avl-bg2 border border-avl-border text-avl-muted py-2 px-4 rounded hover:border-avl-cyan hover:text-avl-cyan transition-colors text-sm"
      >
        Carica progetto
      </button>
    </div>
  );
}
