# AVL Render Tecnici — Architettura Applicazione

## 1. Obiettivo

Applicazione desktop **portable** (singolo `.exe`, nessuna installazione) che permette di:

1. Inserire dati evento e specifiche tecniche di un LEDwall
2. Generare automaticamente un **viewer HTML interattivo** (3D + disegni 2D quotati)
3. Esportare **PNG professionali** delle 4 viste (Frontale, Posteriore, Laterale, Pianta) + sezione truss

---

## 2. Stack Tecnologico

| Componente | Tecnologia | Motivazione |
|---|---|---|
| Runtime desktop | **Tauri v2** (Rust + WebView) | Portable, ~5 MB, nativo Windows. Niente Electron (200+ MB) |
| Frontend (UI) | **React + TypeScript + Vite** | Componenti riutilizzabili, form complessi |
| Styling | **Tailwind CSS** | Veloce, design pulito |
| 3D Engine | **Three.js r128+** | Già validato nel viewer attuale |
| 2D Drawings | **Canvas 2D API** | Già validato, export PNG nativo |
| Export HTML | **Template engine** (Handlebars o string literals) | Genera viewer HTML standalone |
| Export PNG | **Canvas.toDataURL()** → Rust `fs::write` | Salvataggio diretto su disco |
| Build portable | **Tauri bundle** → `.exe` portable | Un solo file, nessun installer |

### Alternativa leggera (se Tauri è troppo complesso)

| Componente | Tecnologia |
|---|---|
| Runtime | **Python 3.11 + PyWebView** |
| UI | HTML/CSS/JS in webview embedded |
| Build | **PyInstaller** → `.exe` portable |
| Pro | Più semplice da sviluppare, stesso risultato visivo |
| Contro | Exe più pesante (~30 MB), startup più lento |

---

## 3. Flusso Utente

```
┌─────────────────────────────────────────────────────────┐
│                    AVL RENDER TECNICI                     │
│                                                           │
│  ┌──────────────────┐   ┌──────────────────────────────┐ │
│  │  SIDEBAR SINISTRA │   │       ANTEPRIMA LIVE         │ │
│  │                    │   │                              │ │
│  │  [Dati Evento]     │   │   ┌──────────────────────┐  │ │
│  │  [Config LED]      │   │   │   3D VIEWER           │  │ │
│  │  [Struttura]       │   │   │   (aggiorna in tempo  │  │ │
│  │  [Opzioni]         │   │   │    reale)             │  │ │
│  │                    │   │   └──────────────────────┘  │ │
│  │  ───────────────   │   │                              │ │
│  │  [EXPORT HTML]     │   │   ┌─────┐┌─────┐┌─────┐┌─────┐  │ │
│  │  [EXPORT PNG]      │   │   │FRONT││POST ││SIDE ││ TOP │  │ │
│  │  [SALVA PROGETTO]  │   │   └─────┘└─────┘└─────┘└─────┘  │ │
│  │  [CARICA PROGETTO] │   │                              │ │
│  └──────────────────┘   └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Flow operativo

```
UTENTE                          APP                         FILE SYSTEM
  │                              │                              │
  ├─ Inserisce dati evento ────► │                              │
  ├─ Configura LED + struttura ► │                              │
  │                              ├─ Calcola automatici ─────►   │
  │                              │  (gambe, interasse, peso,    │
  │                              │   risoluzione, tubi)         │
  │                              ├─ Aggiorna anteprima 3D ──►   │
  │                              │                              │
  ├─ Click EXPORT ─────────────► │                              │
  │                              ├─ Dialog: utente sceglie cartella
  │                              ├─ Crea sottocartella [NomeEvento]/
  │                              ├─ Genera viewer.html ────────►│ [cartella]/[NomeEvento]/viewer.html
  │                              ├─ Cattura canvas 2D ─────────►│ [NomeEvento]_FRONTALE.png
  │                              ├─ ────────────────────── ────►│ [NomeEvento]_POSTERIORE.png
  │                              ├─ ────────────────────── ────►│ [NomeEvento]_LATERALE.png
  │                              ├─ ────────────────────── ────►│ [NomeEvento]_PIANTA.png
  │                              │                              │
  ├─ Click SALVA ──────────────► │                              │
  │                              ├─ Salva JSON progetto ───────►│ download [nome]_progetto.json
```

---

## 4. Data Model

### 4.1 Dati Evento

```typescript
interface EventInfo {
  projectName: string;           // "Corporate XYZ"
  client: string;                // "Agenzia ABC"
  location: string;              // "MiCo Milano"
  eventDate: string;             // "2026-03-15"
  eventDateFrom?: string;       // Data evento da (range)
  eventDateTo?: string;          // Data evento a (range)
  setupDate: string;             // "2026-03-14"
  setupDateFrom?: string;        // Montaggio da
  setupDateTo?: string;          // Montaggio a
  teardownDate: string;          // "2026-03-15"
  teardownDateFrom?: string;     // Smontaggio da
  teardownDateTo?: string;       // Smontaggio a
  notes: string;                 // note libere
  designer: string;              // "Andrea"
  revision: number;              // 1, 2, 3...
}
```

### 4.2 Configurazione LEDwall

```typescript
interface LedConfig {
  // --- Dimensioni ---
  width_mm: number;              // 5000 (larghezza totale ledwall)
  height_mm: number;             // 2000 (altezza fisica totale)
  activeWidth_mm: number;        // 5000 (larghezza attiva = visibile)
  activeHeight_mm: number;       // 1500 (altezza attiva = visibile)

  // --- Mattonelle ---
  tileSize: '500x500' | '500x1000';  // dimensione cabinet
  tileWidth_mm: number;          // 500 (derivato)
  tileHeight_mm: number;         // 500 o 1000 (derivato)
  tilePitch_mm: number;          // 2.6, 2.9, 3.9, ecc.
  tileDepth_mm: number;          // 80 (standard)
  tileWeight_kg: number;         // 7.5 per 500×500, ~14 per 500×1000

  // --- Layout griglia ---
  cols: number;                  // CALCOLATO: width / tileWidth
  rows: number;                  // CALCOLATO: height / tileHeight
  deadRows: number;              // righe spente dal basso (0, 1, 2...)
  deadCols: number;              // colonne spente (laterali, per curvi)
}
```

### 4.3 Struttura / Montaggio

```typescript
type MountType = 'ground' | 'flying' | 'ground_flying';
type WallShape = 'flat' | 'concave' | 'convex';
type TrussModel = 'QX30' | 'FX30' | 'custom';

interface StructureConfig {
  // --- Tipologia montaggio ---
  mountType: MountType;
  wallShape: WallShape;

  // --- Truss ---
  trussModel: TrussModel;
  trussSection_mm: number;       // 290 (QX30) o 220 (FX30)
  trussSectionDepth_mm: number;  // 290 (QX30) o 30 (FX30)
  trussChordDia_mm: number;      // 51 (QX30) o 50 (FX30)
  trussDiagDia_mm: number;       // 16 (QX30) o 20 (FX30)

  // --- GROUND: Gambe a terra ---
  legs: LegConfig | null;

  // --- FLYING: Appeso ---
  flying: FlyingConfig | null;

  // --- Bottom bar (staffa inferiore) ---
  bottomBar: boolean;
  bottomBarHeight_mm: number;    // 100 (standard)
  bottomBarDia_mm: number;       // 50

  // --- Flying bar (barra superiore per appendere) ---
  flyingBar: boolean;
  flyingBarHeight_mm: number;    // altezza dalla base LED al punto di aggancio

  // --- Tubi orizzontali collegamento ---
  horizontalTubes: TubeConfig;

  // --- Curvo ---
  curve: CurveConfig | null;
}

interface LegConfig {
  count: number;                 // 2..maxLegs (maxLegs = floor(width_mm/500), 1 gamba ogni 500mm)
  height_mm: number;             // 2000 (altezza verticale)
  armLength_mm: number;         // 420 (profondità braccio L)
  edgeOffset_mm: number;         // 500 (distanza dal bordo LED)
  positions_mm: number[];        // CALCOLATO: posizioni X di ogni gamba
  basePlate: boolean;            // piastra base sì/no
}

interface FlyingConfig {
  hangPoints: number;            // 2, 4, 6...
  hangPointPositions_mm: number[]; // posizioni X punti di aggancio
  chainLength_mm: number;        // lunghezza catene/funi
  motorType: string;             // "CM Lodestar 500kg", "Verlinde 1T", ecc.
  trimHeight_mm: number;         // altezza bordo inferiore LED da terra
  bridles: boolean;              // rinvii sì/no
}

interface TubeConfig {
  count: number;                 // 2, 3, 4...
  diameter_mm: number;           // 50
  positions_mm: number[];        // CALCOLATO: quote Y dei tubi
  clampType: 'single' | 'double'; // aliscaff singolo o doppio
}

interface CurveConfig {
  radius_mm: number;             // raggio curvatura
  angle_deg: number;             // angolo totale apertura
  direction: 'concave' | 'convex';
  segmentAngle_deg: number;      // angolo per singolo cabinet (calcolato)
}
```

### 4.4 Progetto completo (file salvato)

```typescript
interface Project {
  version: '1.0';
  createdAt: string;             // ISO date
  updatedAt: string;
  event: EventInfo;
  led: LedConfig;
  structure: StructureConfig;
  computed: ComputedValues;      // valori calcolati dall'engine
}
```

### 4.5 Valori calcolati automaticamente

```typescript
interface ComputedValues {
  // Dimensioni griglia
  cols: number;
  rows: number;
  totalTiles: number;
  activeTiles: number;

  // Pesi
  ledWeight_kg: number;          // totalTiles × tileWeight
  structureWeight_kg: number;    // stima truss + tubi + clamp
  totalWeight_kg: number;

  // Risoluzione video
  resolutionX_px: number;        // width / pitch (attivo)
  resolutionY_px: number;        // activeHeight / pitch
  totalPixels: number;

  // Gambe (se ground)
  legPositions_mm: number[];     // array posizioni X calcolate
  legSpacing_mm: number;         // interasse

  // Tubi
  tubePositions_mm: number[];    // quote Y calcolate

  // Altezza totale
  totalHeight_mm: number;        // bottomBar + ledHeight
  totalDepth_mm: number;         // tileDepth + gap + trussSection + arm

  // Potenza elettrica
  powerConsumption_W: number;    // totalTiles × 150W
  powerAmps_16A: number;         // linee da 16A necessarie

  // Trasporto
  flightCases: number;           // stima numero case
}
```

---

## 5. Logica di Calcolo Automatico

### 5.1 Posizionamento gambe

```
Se legs.count = N, edgeOffset = E, LED_W = W:
  span = W - 2 * E
  spacing = span / (N - 1)
  positions = [E, E + spacing, E + 2*spacing, ..., W - E]
```

### 5.2 Posizionamento tubi orizzontali

```
Se tubes.count = T, bottomBar = B, ledHeight = H:
  usableHeight = H
  spacing = usableHeight / (T + 1)
  positions = [B + spacing, B + 2*spacing, ..., B + T*spacing]
```

### 5.3 Risoluzione video

```
resX = floor(width_mm / pitch) → arrotondato al multiplo di (tileWidth/pitch)
resY = floor(activeHeight_mm / pitch)
```

### 5.4 Peso stimato

```
ledWeight = totalTiles × tileWeight
trussWeight = legs.count × (legHeight + armLength) × 5.3 kg/m  (QX30)
tubeWeight = tubes.count × (legPositions[last] - legPositions[0]) × 1.5 kg/m
clampWeight = legs.count × tubes.count × 2 × 0.5 kg
totalWeight = ledWeight + trussWeight + tubeWeight + clampWeight + 20kg (hardware)
```

### 5.5 Profondità totale

```
Z: 0 ────► fronte LED
   80 ───► retro cabinet
   230 ──► fronte truss  (80 + 150 gap)
   520 ──► retro truss   (230 + 290 QX30)
   940 ──► fine braccio L (520 + 420 braccio)
```

---

## 6. Configurazioni Supportate

### 6.1 LEDwall a terra — dritto (ATTUALE)

```
  ┌───────────────────┐ ← top LED
  │   LED ATTIVO       │
  ├───────────────────┤ ← dead zone
  │   LED SPENTO       │
  ├───────────────────┤ ← bottom bar
  │                     │
  ╟─┐               ╟─┐ ← gambe LITEC QX30SA a L
  ║ └───╜           ║ └───╜
  ═══════════════════════ FLOOR
```

Struttura: gambe LITEC QX30SA / FX30 a L, tubi Ø50, aliscaff, bottom bar opzionale.

### 6.2 LEDwall a terra — dritto — senza gambe (stacked)

```
  ┌───────────────────┐
  │   LED              │
  ├───────────────────┤ ← bottom bar
  ═══════════════════════ FLOOR
```

Nessuna struttura dietro. Cabinet impilati direttamente (max 2-3 righe).

### 6.3 LEDwall appeso (flying)

```
  ══╤═══════╤═══════╤══ ← americana orizzontale (bridge/truss)
    │       │       │    ← catene/motori
  ┌─┴───────┴───────┴─┐
  │   LED ATTIVO        │
  ├─────────────────────┤
  │   LED (eventuale)   │
  └─────────────────────┘ ← flying bar / omega bracket
```

Struttura: flying bar in alto, punti motore, catene. Nessuna gamba.

### 6.4 LEDwall a terra + flybar (ibrido)

```
  ══╤═══════╤══ ← sicurezza overhead
    │       │
  ┌─┴───────┴─┐
  │   LED      │  ← ancorato in alto E supportato dal basso
  ├────────────┤
  ╟─┐       ╟─┐
  ║ └──╜    ║ └──╜
  ════════════════ FLOOR
```

### 6.5 LEDwall curvo — concavo (a terra)

```
        ╱ LED ╲
       ╱       ╲
      ╱   area   ╲
     ╱  pubblico   ╲
    ╱               ╲

  (vista pianta — arco concavo verso il pubblico)
```

Parametri: raggio, angolo apertura. I cabinet vengono inclinati su giunti angolati.

### 6.6 LEDwall curvo — convesso (a terra)

```
    ╲               ╱
     ╲   LED wall  ╱
      ╲           ╱
       ╲         ╱
        ╲       ╱

  (vista pianta — arco convesso, LED verso esterno)
```

---

## 7. Database Truss

### LITEC QX30SA (Americana)

| Parametro | Valore |
|---|---|
| Sezione | 290 × 290 mm |
| Corde | Ø50 × 2 mm, EN AW 6082 T6 |
| Diagonali | Ø18 × 2 mm |
| Estremità | Piastra fusione EN AC 42200 T6 |
| Peso | ~5.3 kg/m |
| Connessione | QXFC quick-fit, QXSM10 bulloni |
| **Portata distribuita** | 3 m: 2473 kg · 5 m: 1750 kg · 10 m: 834 kg |
| Colore render 3D | `#607090` (corde), `#455a64` (diag) |
| Fonte | litectruss.com QX30SA |

### Prolyte FX30 (Piatta / Ladder)

| Parametro | Valore |
|---|---|
| Sezione | 220 × 30 mm (piatta) |
| Corde | Ø50 × 2 mm |
| Diagonali | Ø20 × 2 mm |
| Passo bracing | 500 mm |
| Peso | ~2.8 kg/m |
| Colore render 3D | `#708090` (corde), `#556070` (diag) |
| Note | Usata per bracci orizzontali leggeri |

### Database pixel LED (pitch-db)

Risoluzioni per mattonella — fonti Uniview UR/AS (ledwallcentral.com):

| Pitch | 500×500 px | 500×1000 px |
|-------|------------|-------------|
| 1.5 mm | 320×320 | 320×640 |
| 1.9 mm | 256×256 | 256×512 |
| 2.6 mm | 192×192 | 192×384 |
| 2.9 mm | 168×168 | 168×336 |
| 3.9 mm | 128×128 | 128×256 |
| 4.8 mm | 104×104 | 104×208 |

### Database centraline NovaStar (controller-db)

| Modello | Max pixel | Porte eth | Fonte |
|---------|-----------|------------|-------|
| VX1000 | 6.5M | 10 | NovaStar |
| MCTRL4K | 8.8M | 16 | NovaStar |
| H2 | 26M | 40 | ledwallcentral.com |

### Schema corrente e rete (computed)

- **Corrente:** N linee 16A — max 16 cabinet 500×500/linea, max 8 cabinet 500×1000/linea
- **Rete:** 650k px/porta @8bit (A10s Plus-N), porte necessarie vs disponibili

---

## 8. Engine di Generazione (Export)

### 8.1 Generazione HTML Viewer

Il viewer HTML viene generato partendo dal template (`files/ledwall_viewer.html`) con:

1. **Iniezione costante P** — la costante `const P = {...}` viene riscritta con i valori del progetto
2. **Iniezione panel dati** — il panel sinistro HTML viene rigenerato con i dati evento
3. **Iniezione legenda** — la legenda colori viene aggiornata
4. **Iniezione title block** — nome progetto, scala, data evento
5. **Adattamento struttura 3D** — switch su `mountType` e `wallShape`:
   - `ground + flat` → codice gambe L attuale
   - `ground + curved` → gambe L + rotazione cabinet
   - `flying + flat` → flying bar + punti motore, no gambe
   - `flying + curved` → flying bar + rotazione cabinet

```
Template HTML (base)
       │
       ├── Sostituisci {{ P }} con valori calcolati
       ├── Sostituisci {{ EVENT_INFO }} con dati evento
       ├── Sostituisci {{ LEGEND }} con legenda
       ├── Sostituisci {{ 3D_STRUCTURE }} con codice Three.js specifico
       ├── Sostituisci {{ 2D_FRONT }} con disegno frontale
       ├── Sostituisci {{ 2D_SIDE }} con disegno laterale
       ├── Sostituisci {{ 2D_TOP }} con pianta
       └── Sostituisci {{ 2D_SECTION }} con sezione truss
              │
              ▼
       viewer.html (standalone, apribile offline)
```

### 8.2 Generazione PNG

1. Il frontend renderizza i 4 canvas 2D (frontale, laterale, pianta, sezione)
2. Per ogni canvas: `canvas.toDataURL('image/png')` → base64
3. Il base64 viene inviato al backend Rust tramite Tauri command
4. Rust decodifica e salva su disco come `.png`

### 8.3 Naming convention output

```
output/
  YYYYMMDD_NomeProgetto/
    viewer.html
    AVL_NomeProgetto_FRONTALE.png
    AVL_NomeProgetto_POSTERIORE.png
    AVL_NomeProgetto_LATERALE.png
    AVL_NomeProgetto_PIANTA.png
    AVL_NomeProgetto_SEZ_QX30.png
    progetto.json                    ← progetto salvato (reimportabile)
```

---

## 9. UI — Form Input (Dettaglio)

### Tab 1: Evento

| Campo | Tipo | Default | Note |
|---|---|---|---|
| Nome progetto | text | "" | Obbligatorio |
| Cliente | text | "" | |
| Luogo | text | "" | |
| Data evento | date | oggi | |
| Data montaggio | date | oggi-1 | |
| Data smontaggio | date | evento | |
| Progettista | text | "Andrea" | |
| Note | textarea | "" | |

### Tab 2: LEDwall

| Campo | Tipo | Default | Note |
|---|---|---|---|
| Larghezza (mm) | number / slider | 5000 | Step: tileWidth |
| Altezza fisica (mm) | number / slider | 2000 | Step: tileHeight |
| Altezza attiva (mm) | number / slider | 1500 | ≤ altezza fisica, step tileHeight |
| Mattonella | select | 500×500 | 500×500 / 500×1000 |
| Pitch (mm) | select | 2.6 | 1.5 / 1.9 / 2.6 / 2.9 / 3.9 / 4.8 |
| Righe spente (basso) | number | 1 | 0–rows |
| Marca/Modello | text | "Uniview" | per title block |

**Calcolati in tempo reale (readonly):**
- Colonne × Righe
- Numero mattonelle totali / attive
- Risoluzione (px × px)
- Peso LED stimato
- Consumo elettrico stimato

### Tab 3: Struttura

| Campo | Tipo | Default | Note |
|---|---|---|---|
| Montaggio | radio | ground | ground / flying / ibrido |
| Forma | radio | flat | flat / concave / convex |
| Modello truss | select | QX30 | QX30 / FX30 |
| Bottom bar | toggle | sì | |
| Altezza bottom bar (mm) | number | 100 | solo se bottom bar ON |
| **Se GROUND:** | | | |
| Numero gambe | number | 4 | 2–8 |
| Altezza gamba (mm) | number | 2000 | |
| Profondità braccio L (mm) | number | 420 | |
| Offset dal bordo (mm) | number | 500 | |
| Piastra base | toggle | sì | |
| **Se FLYING:** | | | |
| Punti motore | number | 4 | 2–8 |
| Tipo motore | select | "CM 500kg" | preset o custom |
| Altezza trim (mm da terra) | number | 3000 | |
| Flying bar | toggle | sì | |
| Bridles | toggle | no | |
| **Se CURVO:** | | | |
| Raggio (mm) | number | 8000 | |
| Angolo apertura (°) | number | 30 | |

### Tab 4: Tubi e Accessori

| Campo | Tipo | Default | Note |
|---|---|---|---|
| Numero tubi | number | 3 | 0–6 |
| Diametro tubo (mm) | number | 50 | |
| Tipo aliscaff | select | doppio | singolo / doppio |
| Posizioni tubi | auto/manual | auto | auto = equidistribuiti |
| Cavi sicurezza | toggle | sì | |
| Protezione base | toggle | no | pedana/rampa |

---

## 10. Struttura Progetto (Codebase)

```
avl-render/
├── src/                           ← Frontend React
│   ├── main.tsx
│   ├── App.tsx                    ← Layout principale
│   ├── components/
│   │   ├── Sidebar/
│   │   │   ├── EventTab.tsx       ← Form dati evento (date da-a per setup/evento/smontaggio)
│   │   │   ├── LedTab.tsx         ← Form configurazione LED (input onBlur)
│   │   │   ├── StructureTab.tsx   ← Form struttura (gambe max=giunzioni, tubi)
│   │   │   └── ExportPanel.tsx    ← Export HTML+PNG, Salva/Carica progetto
│   │   ├── ErrorBoundary.tsx      ← Error boundary per Viewer3D
│   │   └── Preview/
│   │       └── Viewer3D.tsx       ← Three.js viewport live
│   │
│   ├── engine/
│   │   ├── compute.ts             ← Calcoli (maxLegs, gambe, pesi, ris.)
│   │   ├── pitch-db.ts            ← Risoluzioni pixel per pitch (Uniview/NovaStar)
│   │   ├── export.ts               ← Export cartella (HTML + 4 PNG, dialog)
│   │   ├── project-to-p.ts         ← Conversione Project → parametri viewer
│   │   └── truss-db.ts             ← Database specifiche truss (QX30, FX30)
│   │
│   ├── hooks/
│   │   └── useDebouncedCallback.ts ← Hook debounce (disponibile)
│   ├── store/
│   │   └── project-store.ts       ← Zustand, createProject, validateProject
│   │
│   ├── types/
│   │   └── project.ts             ← Tutte le interfacce TypeScript
│   │
│   └── assets/
│       └── logo.svg
│
├── public/
│   └── viewer-template.html       ← Template HTML per export
│
├── src-tauri/                     # Tauri (Rust)
│   ├── src/main.rs, lib.rs
│   ├── icons/                     # Icone app
│   └── target/release/
│       └── avl-render-tecnici.exe  # ← ESEGUIBILE PORTABLE
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 10.1 Comandi Build e Test

```bash
npm run dev         # Avvia dev server (porta 1420)
npm run build       # Build produzione (tsc + vite build)
npm run preview     # Anteprima build
npm run tauri build # Build eseguibile portable
npm run lint        # Verifica TypeScript (tsc --noEmit)
npm run smoke       # Smoke test (build completo)
```

---

## 10.2 Workflow sviluppo — MCP e indici

| Strumento | Uso | Note |
|-----------|-----|------|
| **Server MCP** | Operazioni remote (GitHub, Firebase, Supabase) | Preferire MCP invece di comandi shell |
| **Indici salvati** | Doc esterna (@Tauri, @Firebase, ecc.) | Consultare prima di modifiche API |
| **Git via MCP** | `create_or_update_file`, `push_files` | Se `git push` da terminale non restituisce output |
| **Sync locale/remoto** | `git fetch origin` + `git reset --hard origin/master` | Dopo push via MCP, allineare repo locale |

---

## 11. Comandi Tauri (Rust ↔ JS)

- **Dialog** (`tauri-plugin-dialog`): `open({ directory: true })` per scegliere cartella export
- **save_export** (implementato): riceve `folderPath`, `projectName`, `htmlContent`, PNG base64 (frontale, posteriore, laterale, pianta); crea sottocartella e scrive `viewer.html` + 4 PNG

---

## 12. Fasi di Sviluppo

### Fase 1 — MVP (2 settimane)

- [x] Setup React + Vite + Tailwind
- [x] Data model TypeScript completo
- [x] Form input (tabs 1-3) con validazione
- [x] Engine calcoli automatici
- [x] Anteprima 3D live (ground + flat, QX30 e FX30)
- [x] Export HTML standalone (template injection)
- [x] Export PNG (via download dal viewer HTML)
- [x] Salva/carica progetto JSON
- [x] Tauri v2 per eseguibile portable — **exe in** `avl-render/src-tauri/target/release/avl-render-tecnici.exe`

### Fase 2 — Flying + Curvo (1 settimana)

- [ ] Struttura flying (bar, punti motore, catene in 3D)
- [ ] Struttura curva (calcolo angoli cabinet, render curvo)
- [ ] Disegni 2D adattati per flying e curvo
- [ ] Vista pianta con arco per curvi

### Fase 3 — Polish (1 settimana)

- [ ] Temi chiaro/scuro
- [ ] Preset rapidi (es. "LEDwall 4×2 standard", "Schermo 6×3 flying")
- [ ] History undo/redo
- [ ] Drag-resize anteprima
- [ ] Validazione errori (larghezza non multiplo di cabinet, ecc.)
- [ ] PDF export (opzionale, via canvas → jsPDF)
- [x] Build `.exe` portable — vedi `avl-render/BUILD.md` e `docs/STRUTTURA_PROGETTO.md`

---

## 13. Migliorie implementate (stabilita e performance)

- **ErrorBoundary:** Viewer3D wrappato in ErrorBoundary per evitare crash totale su errori Three.js/WebGL
- **Validazione loadProject:** `validateProject()` in project-store valida JSON caricato e fa merge con default
- **XSS export:** `escapeHtml()` su nome progetto e campi utente nell'export HTML
- **Memory leak fix:** Event listener window (mouseup, mousemove) rimossi nel cleanup; dispose di geometrie/materiali
- **Render on-demand:** Animation loop renderizza solo quando necessario (camera, resize, progetto)
- **Input onBlur:** Campi numerici LedTab/StructureTab usano commit su blur/Enter per ridurre re-render
- **Viewer3D:** Cabinet CAB_W/CAB_H per 500x1000, dead rows/cols, piastra base toggle, flying mode (wall senza gambe), ombre (floor + shadow map), camera auto-fit, ResizeObserver throttle 100ms

---

## 14. Vincoli e Regole

1. **Tutti i calcoli derivati sono automatici** — l'utente inserisce solo i dati primari
2. **La larghezza LED DEVE essere multiplo della larghezza mattonella** — validazione bloccante
3. **L'altezza attiva DEVE essere ≤ altezza fisica** — validazione
4. **Gambe: min 2, max = floor(width_mm/500)** (1 ogni 500mm) — validazione
5. **Le posizioni gambe sono simmetriche** — offset uguale da entrambi i lati
6. **Il viewer HTML esportato è 100% standalone** — nessuna dipendenza locale, Three.js da CDN
7. **I PNG sono ad alta risoluzione** — canvas renderizzati a 2× per retina
8. **Il file progetto `.json` è reimportabile** — permette di riaprire e modificare
9. **Tutti i colori seguono la palette standard** — vedi rules `disegno-tecnico-workflow.mdc`
