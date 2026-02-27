# Struttura progetto AVL Render Tecnici

## Vista generale

```
render tecnici/
│
├── avl-render/                    # Applicazione principale
│   ├── src/
│   │   ├── components/            # React UI
│   │   ├── engine/                # Logica calcoli, export
│   │   ├── store/                 # Zustand state
│   │   ├── types/                 # TypeScript interfaces
│   │   └── main.tsx
│   │
│   ├── src-tauri/                 # Backend Tauri (Rust)
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   └── lib.rs
│   │   ├── icons/                 # Icone app (generate)
│   │   ├── target/
│   │   │   └── release/           # ← OUTPUT BUILD
│   │   │       ├── avl-render-tecnici.exe   ← ESEGUIBILE PORTABLE
│   │   │       └── bundle/        # Installer MSI/NSIS
│   │   ├── Cargo.toml
│   │   └── tauri.conf.json
│   │
│   ├── scripts/
│   │   └── gen-icons.mjs          # Generazione icone
│   │
│   ├── public/
│   │   └── viewer-template.html   # Template HTML export
│   ├── dist/                      # Build frontend (Vite)
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── ARCHITETTURA.md            # Data model, stack, flussi
│   ├── STRUTTURA_PROGETTO.md      # Questa guida
│   └── CHANGELOG.md               # Storico modifiche
│
├── .cursor/
│   └── rules/
│       └── avl-core.mdc
│
├── .gitignore
└── README.md
```

## Percorsi eseguibile portable

| Tipo | Percorso relativo |
|------|-------------------|
| **Exe standalone** | `avl-render/src-tauri/target/release/avl-render-tecnici.exe` |
| Installer MSI | `avl-render/src-tauri/target/release/bundle/msi/` |
| Installer NSIS | `avl-render/src-tauri/target/release/bundle/nsis/` |

L'exe è **portable**: nessuna installazione, eseguibile su Windows 10/11 con WebView2.

## Cartelle da ignorare (git)

- `node_modules/`
- `avl-render/dist/`
- `avl-render/src-tauri/target/`

## Workflow MCP e indici

- **MCP:** Usare i server MCP (GitHub, Firebase, ecc.) per operazioni remote.
- **Indici:** Consultare la doc indicizzata (@Tauri, @Firebase) prima di modifiche API.
- **Git:** Preferire MCP GitHub per commit/push; allineare locale con `git fetch` + `git reset --hard origin/master` dopo push via MCP.
