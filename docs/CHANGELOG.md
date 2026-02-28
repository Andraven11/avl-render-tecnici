# Changelog — AVL Render Tecnici

## Modifiche recenti

### Viste complete con quote + S-pattern corrente + performance (2026-02-28)

**Quote complete su tutte le 4 viste (render-orthographic.ts):**
- `drawDimension` esteso con opzione `side: "left"|"right"|"top"|"bottom"` per posizionare le quote su qualsiasi lato
- **FRONTALE**: larghezza LED, altezza totale, bottom bar, piastra base 320mm sotto ogni gamba, interassi individuali gambe
- **POSTERIORE**: stesse quote del frontale + altezza gamba (lato destro) + sezione truss (lato destro)
- **LATERALE**: profondità totale, LED depth, gap LED→truss (arancione), sezione truss, braccio L, piastra base depth 740mm, inset 70mm, altezza gambe, breakdown altezze bottom bar + LED
- **PIANTA**: larghezza LED, piastra base sotto 1ª gamba, breakdown profondità destra (LED, gap LED→truss, sezione truss, profondità base plate)

**Cablaggio S-pattern (compute.ts, types/project.ts):**
- Linee corrente calcolate con cablaggio serpentina orizzontale: riga pari L→R, riga dispari R→L
- `PowerSchema` esteso con campi `routing: "S" | "U"` e `cabinetPerLine: number[]`
- `NetworkSchema` aggiornato con "S/U libero" (ethernet può seguire qualsiasi percorso)
- Testo schema: `"X linee 16A · max Y cab/linea · cablaggio S"`

**Performance invisible (scene-builder.ts, render-orthographic.ts, export.ts, viewer-template.html):**
- **Scena condivisa**: `buildLedwallScene` chiamata 1 volta invece di 4 per i 4 PNG; scene passata come `prebuiltScene?` opzionale a ciascuna render function
- **Geometry cache**: `Map<string, BufferGeometry>` locale evita geometrie duplicate (cylinder/box/edges con stessi parametri riusano la stessa istanza)
- **Render-on-demand viewer HTML**: loop `rAF` renderizza solo quando `needsRender=true` (settato da interazione utente o resize), non ogni frame

**Bug fix:**
- `drawDataPanel` separator: `indexOf([label, val] as any)` usava reference equality → sostituito con loop indicizzato
- `disposeScene`: aggiunto `renderer.forceContextLoss()` e disposal esplicito materiali `LineSegments`
- Aggiunto `disposeSceneGeometry()` esportata da `render-orthographic.ts` per cleanup scena condivisa

---

### Mobile responsive export + misure base plate + montaggio diretto (2026-02-27)

**Mobile responsive (viewer-template.html):**
- Layout responsive con CSS media queries (768px, 400px breakpoint)
- Pannello dati tecnici collassabile su mobile con toggle button
- Touch support per 3D viewer: 1 dito = rotazione, 2 dita = pinch-to-zoom
- Pinch-to-zoom per disegni tecnici PNG
- Nessuna modifica al layout/funzioni desktop

**Base plate aggiornata (truss-db, scene-builder, viewer-template, export):**
- Dimensioni base plate: 740×320 mm (prima: 480×330 QX30, 700×500 FX30)
- Posizionamento con inset 70mm (americana a 7cm dal bordo interno base)
- Parametro `BASE_PLATE_INSET` aggiunto a SceneParams, export P, viewer inline 3D
- sceneBounds() aggiornato per includere la base plate nella bounding box

**Montaggio diretto senza tubi (tubi = 0):**
- Opzione tubi a 0 supportata (UI già lo consentiva)
- Z_GAP = 210mm quando tubi=0 (retro LED a 21cm da americana)
- Rendering 3D: distanziatore cilindrico + aliscaf (clamp) a 33% e 67% altezza LED
- Coerenza tra scene-builder.ts (app), viewer-template.html (export) e render-orthographic.ts (PNG)

**Vulnerabilità risolte:**
- Aggiornamento vite 5.4→7.x (fix esbuild CVE moderate severity)
- 0 vulnerabilità npm audit

### Viewer export (4 viste, zoom, UI)
- **4 viste tecniche**: Frontale (faccia LED), Posteriore (struttura), Laterale, Pianta
- **Pulsante download**: spostato in alto a destra nell'header di ogni vista
- **Zoom**: pulsanti +/− per ogni vista (0.5×–3×)
- **Export cartella**: salva `viewer.html` + 4 PNG (FRONTALE, POSTERIORE, LATERALE, PIANTA)

### Workflow MCP e indici
- **Rules:** Workflow con server MCP e indici salvati (avl-core.mdc)
- **Docs:** ARCHITETTURA 10.2, STRUTTURA_PROGETTO — MCP, indici, sync git
- **.gitignore:** Pattern per file debug/temp (git-status*.txt, mcps/, ecc.)

### Export e struttura
- **Gambe**: massimo = floor(width_mm/500), 1 gamba ogni 500mm (giunzioni)
- **Date evento**: campi Da–A per setup, evento e smontaggio

### Già implementato
- Salva/carica progetto JSON
- Error Boundary per Viewer3D
- Validazione loadProject
- Escape HTML (XSS) nell'export
- Memory leak fix (listener, dispose geometrie)
- Render on-demand invece di 60fps continui
- Input numerici con onBlur/Enter
- Cabinet 500×1000, dead rows/cols
- Ombre, illuminazione 3 punti
- Camera auto-fit
- Flying mode (wall senza gambe)
- Piastra base QX30 toggle
