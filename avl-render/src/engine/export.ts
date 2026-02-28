import type { Project } from "@/types/project";
import { projectToP } from "./project-to-p";
import { TRUSS_DB } from "./truss-db";
import { CONTROLLER_DB } from "./controller-db";
import { buildLedwallScene, type SceneParams } from "./scene-builder";
import {
  renderFrontale,
  renderPosteriore,
  renderLaterale,
  renderPianta,
  disposeSceneGeometry,
  type RenderMeta,
} from "./render-orthographic";

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
        BASE_PLATE_W: ${p.BASE_PLATE_W ?? 0.32}, BASE_PLATE_D: ${p.BASE_PLATE_D ?? 0.74}, BASE_PLATE_INSET: ${p.BASE_PLATE_INSET ?? 0.07},
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

/** Genera l'HTML completo del viewer con i dati del progetto. Ritorna anche i PNG per l'export. */
export async function buildViewerHtml(
  project: Project
): Promise<{ html: string; pngs: { frontale: string; posteriore: string; laterale: string; pianta: string } }> {
  const templateUrl = `${window.location.origin}/viewer-template.html`;
  let res = await fetch(templateUrl);
  if (!res.ok) {
    res = await fetch("/viewer-template.html");
  }
  if (!res.ok) {
    throw new Error(`Template non trovato (${res.status}). Verifica che public/viewer-template.html esista.`);
  }
  let html = await res.text();

  const panelContent = formatPanel(project);
  const pScript = buildPScript(project);

  const dateStr = project.event.eventDate
    ? new Date(project.event.eventDate + "T12:00:00").toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : new Date().toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const projectTitle = `${escapeHtml(project.event.projectName)} ${project.led.width_mm / 1000}×${project.led.height_mm / 1000}m`;
  const { event, led, structure, computed } = project;
  const legs = structure.legs;
  const botBar = structure.bottomBar ? structure.bottomBarHeight_mm : 0;
  const hTot = botBar + led.height_mm;
  const spec = TRUSS_DB[structure.trussModel];

  const meta: RenderMeta = {
    projectName: event.projectName || "Progetto",
    date: dateStr,
    designer: event.designer || "—",
    scale: "1:50",
    client: event.client || undefined,
    location: event.location || undefined,
    revision: event.revision > 0 ? `Rev. ${event.revision}` : undefined,
    ledSize: `${led.width_mm.toLocaleString("it")} × ${led.height_mm.toLocaleString("it")} mm`,
    activeSize: `${led.activeWidth_mm.toLocaleString("it")} × ${led.activeHeight_mm.toLocaleString("it")} mm`,
    pitch: `${led.tilePitch_mm} mm`,
    cabinet: `${computed.cols}×${computed.rows} (${led.tileWidth_mm}×${led.tileHeight_mm})`,
    resolution: `${computed.resolutionX_px} × ${computed.resolutionY_px} px`,
    deadRow: led.deadRows > 0 ? `${led.deadRows} fila spenta` : undefined,
    totalHeight: `${hTot.toLocaleString("it")} mm`,
    totalDepth: `${computed.totalDepth_mm.toLocaleString("it")} mm`,
    bottomBar: structure.bottomBar ? `${structure.bottomBarHeight_mm} mm` : undefined,
    truss: `${spec?.label ?? structure.trussModel} ${structure.trussSection_mm}×${structure.trussSectionDepth_mm}`,
    legs: legs ? `${legs.count} × ${legs.height_mm} mm` : "—",
    legSpacing: legs && computed.legSpacing_mm > 0 ? `${Math.round(computed.legSpacing_mm)} mm` : undefined,
    tubes: structure.horizontalTubes.count > 0
      ? `${structure.horizontalTubes.count} × Ø${structure.horizontalTubes.diameter_mm}`
      : undefined,
    controller: CONTROLLER_DB[led.controller ?? "vx1000"].label,
    power: computed.powerSchema?.schema ?? `${computed.powerAmps_16A} linee 16A`,
    network: computed.networkSchema?.schema ?? "—",
    ledWeight: `~${Math.round(computed.ledWeight_kg)} kg`,
    totalWeight: `~${Math.round(computed.totalWeight_kg)} kg`,
  };
  const pngs = generateTechnicalPngs(project, meta);

  let threeJs = "";
  const cdnUrls = [
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js",
    "https://unpkg.com/three@0.128.0/build/three.min.js",
  ];
  for (const url of cdnUrls) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        threeJs = await r.text();
        break;
      }
    } catch {
      continue;
    }
  }
  if (threeJs) {
    const safe = threeJs.replace(/<\/script>/gi, "<\\/script>");
    html = html.replace(
      /<script src="three\.min\.js"><\/script>/,
      `<script>${safe}</script>`
    );
  }

  html = html.replace(/<title>.*?<\/title>/, `<title>LEDWALL ${projectTitle} — Stand Tecnico AVL</title>`);

  const panelRegex = /<div id="panel-left">[\s\S]*<\/div>\s*<div class="main">/;
  html = html.replace(panelRegex, `<div id="panel-left">${panelContent}\n    </div>\n\n    <div class="main">`);

  const pStart = html.indexOf("const P = {");
  const pEnd = html.indexOf("P.TUBE_Y = [");
  const tubeEnd = html.indexOf("];", pEnd) + 2;
  if (pStart >= 0 && pEnd >= 0 && tubeEnd > pEnd) {
    html = html.slice(0, pStart) + pScript.trim() + html.slice(tubeEnd);
  }

  html = html.replace(/STAND LEDWALL 5×2m/g, escapeHtml(projectTitle));
  html = html.replace(/02\/2026/g, dateStr);
  html = html.replace(/AVL_LEDWALL5x2_/g, `AVL_${escapeHtml(project.event.projectName).replace(/\s+/g, "_")}_`);

  html = html.replace("{{PNG_FRONTALE}}", pngs.frontale);
  html = html.replace("{{PNG_POSTERIORE}}", pngs.posteriore);
  html = html.replace("{{PNG_LATERALE}}", pngs.laterale);
  html = html.replace("{{PNG_PIANTA}}", pngs.pianta);

  return { html, pngs };
}

/** Genera PNG professionali tramite render Three.js ortografico */
function generateTechnicalPngs(
  project: Project,
  meta: RenderMeta
): { frontale: string; posteriore: string; laterale: string; pianta: string } {
  const p = projectToP(project);
  const trussDepth = p.IS_FLAT ? p.QX : (p.QX_DEPTH ?? p.QX);
  const Z_TF = p.Z_LED_BACK + p.Z_GAP;
  const Z_TB = Z_TF + trussDepth;
  const P: SceneParams = {
    LED_W: p.LED_W,
    LED_H: p.LED_H,
    BOT_BAR: p.BOT_BAR,
    CAB_W: p.CAB_W ?? p.CAB,
    CAB_H: p.CAB_H ?? p.CAB,
    CAB_D: p.CAB_D,
    CAB_ROWS: p.CAB_ROWS,
    CAB_COLS: p.CAB_COLS,
    DEAD_ROWS: p.DEAD_ROWS ?? 0,
    DEAD_COLS: p.DEAD_COLS ?? 0,
    LEG_X: p.LEG_X,
    LEG_H: p.LEG_H,
    LEG_ARM: p.LEG_ARM ?? 0,
    Z_TF,
    Z_TB,
    Z_TUBE: Z_TF - 0.03,
    TUBE_Y: p.TUBE_Y,
    TUBE_R: p.TUBE_R,
    QX: p.QX,
    QH: p.QH ?? p.QX / 2,
    QX_DEPTH: p.QX_DEPTH ?? p.QX,
    IS_FLAT: p.IS_FLAT ?? false,
    CHORD_R: p.CHORD_R,
    Z_TC: Z_TF + trussDepth / 2,
    BASE_PLATE_W: p.BASE_PLATE_W,
    BASE_PLATE_D: p.BASE_PLATE_D,
    BASE_PLATE_INSET: p.BASE_PLATE_INSET,
  };

  const basePlate = project.structure.legs?.basePlate ?? true;

  // Costruisci la scena una volta sola e condividila tra le 4 viste
  const { scene } = buildLedwallScene(P, basePlate);

  const cvFront = document.createElement("canvas");
  const cvPost = document.createElement("canvas");
  const cvSide = document.createElement("canvas");
  const cvTop = document.createElement("canvas");

  try {
    renderFrontale(cvFront, P, meta, basePlate, scene);
    renderPosteriore(cvPost, P, meta, basePlate, scene);
    renderLaterale(cvSide, P, meta, basePlate, scene);
    renderPianta(cvTop, P, meta, basePlate, scene);
  } catch (e) {
    console.error("Errore generazione PNG:", e);
    throw new Error(`Render tecnico fallito: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    disposeSceneGeometry(scene);
  }

  return {
    frontale: cvFront.toDataURL("image/png"),
    posteriore: cvPost.toDataURL("image/png"),
    laterale: cvSide.toDataURL("image/png"),
    pianta: cvTop.toDataURL("image/png"),
  };
}

function downloadHtmlFallback(html: string, projectName: string): void {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const filename = `${projectName.replace(/\s+/g, "_")}_viewer.html`;

  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function exportProject(project: Project): Promise<void> {
  if (project.structure.mountType === "flying") {
    alert("Export HTML supportato solo per montaggio a terra (MVP).");
    return;
  }

  let html: string;
  let pngs: { frontale: string; posteriore: string; laterale: string; pianta: string };
  try {
    const result = await buildViewerHtml(project);
    html = result.html;
    pngs = result.pngs;
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "Impossibile generare il viewer HTML"
    );
  }

  const projectName = project.event.projectName || "Progetto";

  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");

    const folderPath = await open({
      directory: true,
      multiple: false,
      title: "Seleziona cartella per l'export",
    });

    if (!folderPath || typeof folderPath !== "string") {
      return;
    }

    const result = await invoke<string>("save_export", {
      folderPath,
      projectName,
      htmlContent: html,
      pngFrontale: pngs.frontale || null,
      pngPosteriore: pngs.posteriore || null,
      pngLaterale: pngs.laterale || null,
      pngPianta: pngs.pianta || null,
    });

    alert(`Export completato in:\n${result}`);
  } catch (e) {
    console.warn("Export Tauri non disponibile, fallback download:", e);
    try {
      downloadHtmlFallback(html, projectName);
      alert("Viewer HTML scaricato. Per export con PNG in cartella, avvia: npm run tauri dev");
    } catch (fallbackErr) {
      console.error("Fallback download fallito:", fallbackErr);
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        alert("Viewer aperto in nuova scheda. Usa Salva con nome (Ctrl+S) per salvarlo.");
      } else {
        alert("Impossibile scaricare. Abilita i popup o avvia l'app con: npm run tauri dev");
      }
    }
  }
}
