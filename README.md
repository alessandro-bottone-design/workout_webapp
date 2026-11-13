# WorkoutApp

> Progressive Web App (PWA) **Local-First** per il tracciamento degli allenamenti in palestra, progettata secondo il Design System **Apple visionOS**, sincronizzata con **Supabase (PostgreSQL + RLS)** e integrata con **Google Calendar**.

---

## Panoramica delle Funzionalità

- **Architettura Local-First a latenza zero**:
  - Persistenza immediata su **IndexedDB** tramite **Dexie.js** (`WorkoutAppDB`).
  - L'esecuzione del workout funziona completamente offline senza attese di rete: serie, ripetizioni, carichi, cardio e note vengono salvati istantaneamente sul dispositivo.
- **Design System Apple visionOS**:
  - Superfici traslucide in vetro smerigliato (`GlassCard`) su sfondo OLED `#0A0A0C`.
  - Griglia geometrica rigorosa a passo `8px`, due soli pesi tipografici (`400` e `600`), testi in *sentence case* e iconografia uniforme `lucide-react` (`strokeWidth={1.75}`).
  - Touch target accessibili (`>= 44px` / `>= 48px`) e supporto nativo a *safe-area* e splash screen iOS.
- **Account Utente & Sincronizzazione Cloud (Supabase)**:
  - Autenticazione con **Supabase Auth** (`email` + `password`).
  - Database cloud **PostgreSQL** protetto da **Row Level Security (RLS)** per singolo utente.
  - Motore bidirezionale `syncAll` (push locale -> pull cloud) con propagazione multi-tab (`BroadcastChannel`) e tolleranza offline.
- **Calendario & Google Calendar Permanente**:
  - Calendario mensile integrato con indicatori dei workout svolti e degli eventi personali.
  - Collegamento permanente a **Google Calendar** tramite proxy serverless iCal ([`api/google-calendar.ts`](api/google-calendar.ts)):
    - Modalità **`server-default`**: usa la variabile d'ambiente server-side `GOOGLE_CALENDAR_ICAL_URL` senza esporre il link segreto nel bundle client.
    - Modalità **`user-ical`**: consente all'utente di collegare o sovrascrivere un proprio feed `.ics` privato, salvato in locale (`localStorage` + `IndexedDB`) e sincronizzato sul cloud nella colonna `user_settings.google_ical_url`.
    - Parser iCal autonomo ([`src/features/calendar/ical.ts`](src/features/calendar/ical.ts)) con supporto a fusi orari `TZID`, ricorrenze `RRULE`, eccezioni `EXDATE`/`RECURRENCE-ID`, e cache persistente offline.
  - Pianificazione rapida di nuove sedute su Google Calendar tramite deep-link ([`src/features/calendar/PlanWorkoutSheet.tsx`](src/features/calendar/PlanWorkoutSheet.tsx)).
- **Timer di Recupero Anti-Drift**:
  - Calcolo temporale basato su timestamp assoluto (`endAt - Date.now()`), persistito in `appState` per resistere a refresh, cambio app e blocco schermo.
  - Segnale acustico (Web Audio API sbloccato al primo tap) e vibrazione configurabili.
- **Progressi, Rilevamento Stallo & Orari Palestra**:
  - Grafici di progressione per esercizio con **Recharts**, calcolo carichi rappresentativi, trend e rilevamento automatico di stallo (*plateau*).
  - Indicatore in tempo reale di apertura/chiusura della palestra ([`src/shared/lib/gymSchedule.ts`](src/shared/lib/gymSchedule.ts)).
- **Backup & Portabilità**:
  - Esportazione e importazione completa del database locale in formato **JSON**, con dataset di riferimento in [`data/workout-backup-progressi.json`](data/workout-backup-progressi.json).

---

## Stack Tecnologico

| Ambito | Tecnologia | Versione / Dettagli |
|--------|------------|---------------------|
| **UI & Linguaggio** | React + TypeScript | React `^18.3.1`, TypeScript `^5.5.3` (`strict: true`) |
| **Routing** | React Router DOM | `^6.24.0` (eager sul percorso workout, lazy sulle viste secondarie) |
| **Build & Dev Server** | Vite | `^5.3.4` + middleware dev locale per `/api/google-calendar` |
| **Styling & Animazioni** | Tailwind CSS, Framer Motion, Lenis | Tailwind `^3.4.6`, Framer Motion `^11.3.0`, Lenis `^1.3.27` |
| **Icone & Grafici** | Lucide React, Recharts | `lucide-react ^0.400.0`, `recharts ^2.12.7` |
| **Drag & Drop** | `@dnd-kit` | `@dnd-kit/core ^6.1.0`, `@dnd-kit/sortable ^8.0.0` |
| **State Management** | Zustand | `^4.5.4` (store per auth, workout, timer, Google Calendar) |
| **Database Locale** | Dexie.js (IndexedDB) | `^3.2.7` (`WorkoutAppDB`) |
| **Cloud & Auth** | Supabase JS | `@supabase/supabase-js ^2.118.0` (PostgreSQL + GoTrue + RLS) |
| **PWA** | `vite-plugin-pwa` + Workbox | `^0.20.0` (`autoUpdate`, `navigateFallbackDenylist: [/^\/api\//]`) |
| **Testing & QA** | Vitest, Testing Library, Puppeteer Core | Vitest `^2.0.4`, RTL `^16.0.0`, `fake-indexeddb ^6.2.5`, E2E headless |
| **Hosting & API** | Vercel | Serverless Function `/api/google-calendar` + Static Edge CDN |

---

## Struttura del Progetto (Feature-Based)

```text
WorkoutApp/
├── .env.example                          # Template variabili d'ambiente client e server
├── .eslintrc.cjs                         # Regole ESLint (max-warnings 0, no-explicit-any)
├── .gitignore                            # Esclusioni git (build, env, macOS ._*, qa-output)
├── index.html                            # Entry HTML, CSP, meta iOS PWA e splash screen
├── package.json                          # Dipendenze e script npm
├── tailwind.config.js                    # Design token visionOS (colori, font, raggi, animazioni)
├── tsconfig.json                         # Configurazione TypeScript strict + path alias
├── vercel.json                           # Build config, rewrites SPA/API e security headers
├── vite.config.ts                        # Configurazione Vite, PWA Workbox, alias e dev API proxy
│
├── api/
│   └── google-calendar.ts                # Vercel Function proxy iCal (GET status, POST fetch)
│
├── data/
│   └── workout-backup-progressi.json     # File di backup JSON di riferimento
│
├── docs/                                 # Documentazione tecnica
│   ├── ARCHITECTURE.md                   # Architettura feature-based, offline, API proxy e PWA
│   ├── DATABASE_AND_SYNC.md              # Schema Dexie, PostgreSQL/RLS, migrazioni e sync engine
│   ├── DESIGN_SYSTEM.md                  # Token visivi reali, componenti UI, a11y e safe-area iOS
│   └── DEPLOYMENT.md                     # Guida deploy GitHub + Vercel + Supabase e note exFAT
│
├── public/                               # Asset statici PWA (favicon, icone, splash iOS, screenshot)
│
├── scripts/
│   ├── assets/
│   │   ├── generate-icons.mjs            # Generatore icone PWA e apple-touch-icon
│   │   └── generate-splash.mjs           # Generatore splash screen iOS con Chrome headless
│   └── qa/
│       ├── check-preview.mjs             # Smoke check headless su server di dev/preview
│       └── qa-e2e.mjs                    # Suite E2E completa (52 step su dist/ via vite preview)
│
├── supabase/
│   └── migrations/
│       ├── 20261103000000_create_workout_schema.sql
│       └── 20261113000000_add_google_calendar_to_settings.sql
│
└── src/
    ├── main.tsx                          # Bootstrap React + registrazione CSS globali
    ├── vite-env.d.ts                     # Tipi Vite
    ├── app/
    │   ├── App.tsx                       # ErrorBoundary, Lenis, AppInitializer (seed, auth, calendar, sync)
    │   └── router.tsx                    # Rotte React Router v6 (eager workout + lazy secondary)
    ├── features/
    │   ├── auth/                         # AuthModal, authStore e relativi test
    │   ├── calendar/                     # CalendarScreen, PlanWorkoutSheet, googleCalendarStore, helper, ical parser e test
    │   ├── home/                         # HomeScreen (cruscotto, prossimo allenamento, stato palestra)
    │   ├── program/                      # ProgramScreen, SessionDetailScreen e schermate di editing
    │   ├── progress/                     # ProgressScreen e ExerciseHistoryScreen
    │   ├── settings/                     # SettingsScreen (timer, Google Calendar, sync, backup, orari)
    │   ├── sync/                         # Client Supabase, engine syncAll e test
    │   ├── timer/                        # TimerComponents, timerStore e test preset
    │   └── workout/                      # Esecuzione workout, ExerciseFocusScreen, WeightEditorSheet, cronologia e test
    └── shared/
        ├── assets/brand/                 # Logo SVG Workout Lab
        ├── components/layout/            # ScreenHeader, BottomNavigation, AppShell
        ├── components/ui/                # Primitivi UI visionOS (GlassCard, Button, Toggle, ConfirmDialog, ecc.)
        ├── db/                           # Dexie database.ts, repositories.ts, seed.ts, progressData.ts
        ├── lib/                          # backup, formatters, gymSchedule, ids, selectors, strings, tabSync, useDialogA11y
        ├── styles/                       # globals.css (CSS variables + iOS helpers) e tailwind.css
        ├── test/                         # setup Vitest + test unitari/integrazione shared e UI
        └── types/                        # Modelli di dominio TypeScript (Program, Workout, AppSettings, ecc.)
```

### Path Alias Configurati

Definiti in [`tsconfig.json`](tsconfig.json) e [`vite.config.ts`](vite.config.ts):

| Alias | Percorso Reale |
|-------|----------------|
| `@/*` | `./src/*` |
| `@shared/*` | `./src/shared/*` |
| `@features/*` | `./src/features/*` |

---

## Variabili d'Ambiente

Copiare [`.env.example`](.env.example) in `.env.local` per lo sviluppo locale:

| Variabile | Ambito | Obbligatoria | Descrizione |
|-----------|--------|--------------|-------------|
| `VITE_SUPABASE_URL` | Client (`VITE_`) | Opzionale (richiesta per cloud sync) | URL del progetto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Client (`VITE_`) | Opzionale (richiesta per cloud sync) | Chiave pubblica anonima Supabase protetta da RLS |
| `GOOGLE_CALENDAR_ICAL_URL` | **Solo Server** | Opzionale | URL segreto `.ics` predefinito letto da `/api/google-calendar` (non usare il prefisso `VITE_`) |

Se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` non sono impostate, l'app funziona regolarmente in modalità **locale/offline**.

---

## Installazione e Avvio Locale

### Prerequisiti
- **Node.js** >= 18
- **npm** >= 9

### Procedura

```bash
# 1. Installa le dipendenze
npm install

# 2. Prepara le variabili d'ambiente locali
cp .env.example .env.local
# Compila .env.local con le chiavi Supabase (e opzionalmente GOOGLE_CALENDAR_ICAL_URL)

# 3. Avvia il server di sviluppo Vite
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`. In sviluppo, il plugin `devApiFunctions()` presente in [`vite.config.ts`](vite.config.ts) carica automaticamente `GOOGLE_CALENDAR_ICAL_URL` e inoltra `GET` e `POST` verso `/api/google-calendar` allo stesso handler usato in produzione su Vercel.

---

## Script npm Disponibili

Tutti gli script definiti in [`package.json`](package.json):

| Comando | Azione | Dettagli |
|---------|--------|----------|
| `npm run dev` | Avvio sviluppo | Server Vite HMR su `http://localhost:5173` con proxy `/api/google-calendar` |
| `npm run lint` | Controllo ESLint | Analisi `.ts`/`.tsx` con `--max-warnings 0` |
| `npm run typecheck` | Controllo tipi | `tsc --noEmit` in modalità strict |
| `npm run test` | Vitest watch | Esecuzione interattiva dei test in sviluppo |
| `npm run test:run` | Suite test completa | Esecuzione singola di **16 file di test / 161 test** |
| `npm run build` | Build produzione | `tsc && vite build` con generazione bundle e Service Worker Workbox in `dist/` |
| `npm run preview` | Anteprima build | Server `vite preview` sulla cartella `dist/` |
| `npm run check:preview` | Smoke check browser | Verifica headless rendering e zero errori console/rete ([`scripts/qa/check-preview.mjs`](scripts/qa/check-preview.mjs)) |
| `npm run test:e2e` | QA E2E completo | Esegue 52 verifiche end-to-end su `dist/` con Chrome headless ([`scripts/qa/qa-e2e.mjs`](scripts/qa/qa-e2e.mjs)) |
| `npm run icons:generate` | Rigenerazione icone | Genera `icon-192.png`, `icon-512.png` e `apple-touch-icon.png` in `public/` |

---

## Documentazione Tecnica

- [Architettura del Sistema](docs/ARCHITECTURE.md) — Struttura feature-based, flusso Local-First, proxy Google Calendar `/api/google-calendar`, resilienza offline e PWA Workbox.
- [Database e Sincronizzazione Cloud](docs/DATABASE_AND_SYNC.md) — Schema Dexie, tabelle PostgreSQL su Supabase, policy RLS, trigger `handle_new_user`, engine `syncAll` e backup JSON.
- [Design System Apple visionOS](docs/DESIGN_SYSTEM.md) — Token reali da `tailwind.config.js` e `globals.css`, componenti UI condivisi, accessibilità, touch target e layout iOS PWA.
- [Guida al Deployment](docs/DEPLOYMENT.md) — Configurazione GitHub + Vercel, segreti server-side, migrazioni Supabase, `vercel.json` e gestione file AppleDouble su SSD exFAT.

---

## Licenza

Progetto personale di proprietà di **Alessandro Bottone**. Tutti i diritti riservati.
