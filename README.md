# AVL Render Tecnici

Applicazione desktop per la generazione di disegni tecnici LEDwall: viste 3D, 2D quotate, export HTML e PNG.

## Struttura progetto

```
render tecnici/
├── avl-render/          ← App principale (React + Tauri)
├── docs/                ← Documentazione architettura
├── .cursor/rules/       ← Regole AI
└── README.md
```

## Quick start

```bash
cd avl-render
npm install
npm run dev          # Sviluppo web
npm run tauri build  # Build eseguibile portable
```

## Eseguibile portable

Dopo `npm run tauri build`:

| Output | Percorso |
|--------|----------|
| **Exe portable** | `avl-render/src-tauri/target/release/avl-render-tecnici.exe` |
| Installer MSI | `avl-render/src-tauri/target/release/bundle/msi/` |
| Installer NSIS | `avl-render/src-tauri/target/release/bundle/nsis/` |

## Documentazione

- [ARCHITETTURA.md](docs/ARCHITETTURA.md) — Data model, stack, flussi
- [STRUTTURA_PROGETTO.md](docs/STRUTTURA_PROGETTO.md) — Struttura cartelle
- [CHANGELOG.md](docs/CHANGELOG.md) — Storico modifiche
