# Changelog — AVL Render Tecnici

## Modifiche recenti

### Viewer export (4 viste, zoom, UI)
- **4 viste tecniche**: Frontale (faccia LED), Posteriore (struttura), Laterale, Pianta
- **Pulsante download**: spostato in alto a destra nell'header di ogni vista
- **Zoom**: pulsanti +/− per ogni vista (0.5×–3×)
- **Export cartella**: salva `viewer.html` + 4 PNG (FRONTALE, POSTERIORE, LATERALE, PIANTA)

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
