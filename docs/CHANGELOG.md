# Changelog — AVL Render Tecnici

## Modifiche recenti

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
