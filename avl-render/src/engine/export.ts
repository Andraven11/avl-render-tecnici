import type { Project } from "@/types/project";
import { projectToP } from "./project-to-p";
import { TRUSS_DB } from "./truss-db";
import { CONTROLLER_DB } from "./controller-db";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPanel(project: Project): string {
  const { event, led, structure, computed } = project;
  const legs = structure.legs;
  const botBar = structure.bottomBar ? structure.bottomBarHeight_mm : 0;
  const hTot = botBar + led.height_mm;
  const legStr = legs
    ? `${legs.count} × L (${legs.height_mm} + ${legs.armLength_mm} mm)`
    : "—";
  const tubeStr =
    structure.horizontalTubes.count > 0
      ? `${structure.horizontalTubes.count} × Ø${structure.horizontalTubes.diameter_mm} ${structure.horizontalTubes.clampType === "double" ? "+ doppio aliscaff" : ""}`
      : "—";

  return `
      <h2>▸ DATI TECNICI</h2>
      <span class="lbl">Progetto: </span><span class="val">${escapeHtml(event.projectName)}</span><br>
      <div class="sep"></div>
      <span class="lbl">Fisico: </span><span class="val">${led.width_mm.toLocaleString("it")} × ${led.height_mm.toLocaleString("it")} mm</span><br>
      <span class="lbl">Attivo: </span><span class="val">${led.activeWidth_mm.toLocaleString("it")} × ${led.activeHeight_mm.toLocaleString("it")} mm</span><br>
      <span class="lbl">Pitch: </span><span class="val">${led.tilePitch_mm} mm</span><br>
      <span class="lbl">Cabinet: </span><span class="val">${computed.cols} × ${computed.rows} (${led.tileWidth_mm}×${led.tileHeight_mm} mm)</span><br>
      <span class="lbl">Fila bassa: </span><span class="val">${led.deadRows > 0 ? "SPENTA (dead zone)" : "—"}</span><br>
      <span class="lbl">Risoluzione: </span><span class="val">${computed.resolutionX_px} × ${computed.resolutionY_px} px</span><br>
      <div class="sep"></div>
      <span class="lbl">Bottom bar: </span><span class="val">${structure.bottomBar ? `${structure.bottomBarHeight_mm} mm h` : "—"}</span><br>
      <span class="lbl">H totale: </span><span class="val">${hTot} mm</span><br>
      <span class="lbl">Truss: </span><span class="val">${TRUSS_DB[structure.trussModel]?.label ?? structure.trussModel} (${structure.trussSection_mm}×${structure.trussSectionDepth_mm} mm)${TRUSS_DB[structure.trussModel]?.isFlat ? ` + piastra ${TRUSS_DB[structure.trussModel].basePlateWidth_mm}×${TRUSS_DB[structure.trussModel].basePlateDepth_mm} mm` : ""}</span><br>
      <span class="lbl">Gambe: </span><span class="val">${legStr}</span><br>
      <span class="lbl">Interasse gambe: </span><span class="val">${legs && computed.legSpacing_mm > 0 ? Math.round(computed.legSpacing_mm) + " mm" : "—"}</span><br>
      <span class="lbl">Tubi: </span><span class="val">${tubeStr}</span><br>
      <div class="sep"></div>
      <span class="lbl">Centralina: </span><span class="val">${CONTROLLER_DB[project.led.controller ?? "vx1000"].label}</span><br>
      <span class="lbl">Corrente: </span><span class="val">${computed.powerSchema?.schema ?? computed.powerAmps_16A + " linee 16A"}</span><br>
      <span class="lbl">Rete: </span><span class="val">${computed.networkSchema?.schema ?? "—"}</span><br>
      <span class="lbl">Peso LED: </span><span class="val">~${Math.round(computed.ledWeight_kg)} kg</span><br>
      <span class="lbl">Carico totale: </span><span class="val">~${Math.round(computed.totalWeight_kg)} kg</span><br>
`;
}

function buildPScript(project: Project): string {
  const p = projectToP(project);
  const trussDepth = p.IS_FLAT ? p.QX : (p.QX_DEPTH ?? p.QX);
  const LEG_ARM = p.LEG_ARM || 0;

  return `
      const P = {
        LED_W: ${p.LED_W}, LED_H: ${p.LED_H}, LED_H_ACTIVE: ${p.LED_H_ACTIVE}, LED_W_ACTIVE: ${p.LED_W_ACTIVE ?? p.LED_W},
        CAB: ${p.CAB}, CAB_W: ${p.CAB_W}, CAB_H: ${p.CAB_H}, CAB_D: ${p.CAB_D}, CAB_ROWS: ${p.CAB_ROWS}, CAB_COLS: ${p.CAB_COLS},
        DEAD_ROWS: ${p.DEAD_ROWS ?? 0}, DEAD_COLS: ${p.DEAD_COLS ?? 0},
        BOT_BAR: ${p.BOT_BAR},
        LEG_X: [${p.LEG_X.join(", ")}],
        LEG_H: ${p.LEG_H}, LEG_ARM: ${LEG_ARM},
        QX: ${p.QX}, QX_DEPTH: ${p.QX_DEPTH ?? p.QX}, TRUSS_DEPTH: ${trussDepth}, IS_FLAT: ${p.IS_FLAT ?? false},
        BASE_PLATE_W: ${p.BASE_PLATE_W ?? 0.33}, BASE_PLATE_D: ${p.BASE_PLATE_D ?? 0.48},
        CHORD_R: ${p.CHORD_R}, DIAG_R: ${p.DIAG_R},
        Z_LED_BACK: ${p.Z_LED_BACK}, Z_GAP: ${p.Z_GAP},
        TUBE_R: ${p.TUBE_R},
      };
      P.Z_TF = P.Z_LED_BACK + P.Z_GAP;
      P.Z_TC = P.Z_TF + (P.TRUSS_DEPTH || P.QX_DEPTH) / 2;
      P.Z_TB = P.Z_TF + (P.TRUSS_DEPTH || P.QX_DEPTH);
      P.Z_ARM_C = P.Z_TB + P.LEG_ARM / 2;
      P.QH = P.IS_FLAT ? P.QX_DEPTH / 2 : P.QX / 2;
      P.Z_TUBE = P.Z_TF - 0.03;
      P.TUBE_Y = [${p.TUBE_Y.join(", ")}];
`;
}

/** Genera l'HTML completo del viewer con i dati del progetto */
export async function buildViewerHtml(project: Project): Promise<string> {
  const res = await fetch("/viewer-template.html");
  if (!res.ok) {
    throw new Error("Template non trovato. Assicurati che public/viewer-template.html esista.");
  }
  let html = await res.text();

  const panelContent = formatPanel(project);
  const pScript = buildPScript(project);

  const dateStr = project.event.eventDate
    ? new Date(project.event.eventDate + "T12:00:00").toLocaleDateString("it-IT", {
      month: "2-digit",
      year: "numeric",
    })
    : new Date().toLocaleDateString("it-IT", { month: "2-digit", year: "numeric" });

  const projectTitle = `${escapeHtml(project.event.projectName)} ${project.led.width_mm / 1000}×${project.led.height_mm / 1000}m`;

  html = html.replace(/<title>.*?<\/title>/, `<title>LEDWALL ${projectTitle} — Stand Tecnico AVL</title>`);

  const panelRegex = /<div id="panel-left">[\s\S]*?<\/div>/;
  html = html.replace(panelRegex, `<div id="panel-left">${panelContent}\n    </div>`);

  const pStart = html.indexOf("const P = {");
  const pEnd = html.indexOf("P.TUBE_Y = [");
  const tubeEnd = html.indexOf("];", pEnd) + 2;
  if (pStart >= 0 && pEnd >= 0 && tubeEnd > pEnd) {
    html = html.slice(0, pStart) + pScript.trim() + html.slice(tubeEnd);
  }

  html = html.replace(/STAND LEDWALL 5×2m/g, escapeHtml(projectTitle));
  html = html.replace(/02\/2026/g, dateStr);
  html = html.replace(/AVL_LEDWALL5x2_/g, `AVL_${escapeHtml(project.event.projectName).replace(/\s+/g, "_")}_`);

  return html;
}

/** Cattura i canvas 2D dall'HTML renderizzato in un iframe */
function capturePngsFromHtml(html: string): Promise<{ frontale: string; laterale: string; pianta: string }> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:absolute;width:1px;height:1px;visibility:hidden;";
    document.body.appendChild(iframe);

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframe.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      iframe.remove();
    };

    iframe.onload = () => {
      // Aspetta che Three.js e i disegni 2D siano completati
      setTimeout(() => {
        try {
          const doc = iframe.contentDocument;
          if (!doc) {
            cleanup();
            reject(new Error("Impossibile accedere al contenuto dell'iframe"));
            return;
          }
          const cvFront = doc.getElementById("cvFront") as HTMLCanvasElement | null;
          const cvSide = doc.getElementById("cvSide") as HTMLCanvasElement | null;
          const cvTop = doc.getElementById("cvTop") as HTMLCanvasElement | null;

          const frontale = cvFront?.toDataURL("image/png") ?? "";
          const laterale = cvSide?.toDataURL("image/png") ?? "";
          const pianta = cvTop?.toDataURL("image/png") ?? "";

          cleanup();
          resolve({ frontale, laterale, pianta });
        } catch (e) {
          cleanup();
          reject(e);
        }
      }, 4000);
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error("Errore nel caricamento del viewer"));
    };
  });
}

export async function exportProject(project: Project): Promise<void> {
  if (project.structure.mountType === "flying") {
    alert("Export HTML supportato solo per montaggio a terra (MVP).");
    return;
  }

  const html = await buildViewerHtml(project);
  const projectName = project.event.projectName || "Progetto";

  // Prova export Tauri (cartella + PNG); fallback a download HTML in browser
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");

    const folderPath = await open({
      directory: true,
      multiple: false,
      title: "Seleziona cartella per l'export",
    });

    if (!folderPath || typeof folderPath !== "string") {
      return; // Utente ha annullato
    }

    // Cattura i PNG dall'HTML
    const pngs = await capturePngsFromHtml(html);

    const result = await invoke<string>("save_export", {
      folderPath,
      projectName,
      htmlContent: html,
      pngFrontale: pngs.frontale || null,
      pngLaterale: pngs.laterale || null,
      pngPianta: pngs.pianta || null,
    });

    alert(`Export completato in:\n${result}`);
  } catch {
    // Fallback: in browser o se Tauri non disponibile, download HTML
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "_")}_viewer.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
