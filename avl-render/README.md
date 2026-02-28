# AVL Render Tecnici

Applicazione per generare disegni tecnici LEDwall (viewer HTML + export).

## Avvio

```bash
npm install
npm run dev
```

Apri http://localhost:1420

## Funzionalità

- **Tab Evento:** Nome progetto, cliente, luogo, date montaggio/smontaggio/evento
- **Tab LED:** Larghezza, altezza, mattonelle (500×500 o 500×1000), pitch, righe spente
- **Tab Struttura:** Montaggio (terra/flying), truss (QX30/FX30), bottom bar, gambe a L, tubi
- **Anteprima 3D:** Viewer interattivo in tempo reale
- **Export HTML:** Genera `viewer.html` standalone con 3D + 4 disegni 2D quotati
- **Salva/Carica:** Progetto in formato JSON

## Export

1. Clicca **EXPORT HTML + PNG** → scarica `AVL_[Progetto]_viewer.html`
2. Apri il file nel browser (desktop o mobile)
3. Usa i pulsanti ⬇ PNG sotto ogni disegno per scaricare i PNG

### Mobile
Il viewer HTML esportato è **responsive**: su smartphone il pannello dati è collassabile, il 3D supporta touch (1 dito = rotazione, 2 dita = zoom), i disegni supportano pinch-to-zoom.

## Build

```bash
npm run build
```

Output in `dist/`. Per eseguibile portable con Tauri v2, aggiungi il backend Rust (vedi `../docs/ARCHITETTURA.md`).
