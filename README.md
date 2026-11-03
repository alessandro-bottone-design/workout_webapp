# WorkoutApp 🏋️‍♂️

> Web App & Progressive Web App (PWA) ad alte prestazioni per il tracciamento degli allenamenti con i pesi. Progettata secondo l'architettura **Local-First**, l'estetica **Apple visionOS** e sincronizzata in tempo reale con **Supabase (PostgreSQL + RLS)**.

---

## Caratteristiche Principali

- **Design System Apple visionOS (Zero AI Slop)**:
  - Materiali traslucidi in vetro smerigliato (`GlassCard`) con `backdrop-blur-2xl`.
  - Spaziature geometriche su griglia a passo 8 rigorosa (`8px`, `16px`, `24px`, `32px`, `48px`).
  - Massima eleganza tipografica con due soli pesi di font (400 e 600) e testi in sentence case (nessun testo maiuscolo artificiale).
  - Palette monocromatica e scura, ideale per schermi OLED e visibilità in palestra.
  - Iconografia sottile ed uniforme da `lucide-react` (tratto 1.75).

- **Architettura Local-First a Latenza Zero**:
  - Funzionamento completo offline su **IndexedDB (Dexie.js)**.
  - Nessuna attesa di rete o schermata di caricamento durante il workout: serie, ripetizioni e carichi vengono salvati istantaneamente sul dispositivo.

- **Account Utente & Sincronizzazione Cloud (Supabase)**:
  - Autenticazione sicura con **Supabase Auth**.
  - Database relazionale cloud **PostgreSQL 17** protetto da **Row Level Security (RLS)** su misura per ogni utente.
  - Sincronizzazione automatica bidirezionale al termine di ogni workout e all'avvio dell'app.
  - Migrazione automatica dei dati locali al primo accesso.

- **Timer di Recupero Anti-Drift**:
  - Calcolo temporale assoluto (`endAt - Date.now()`).
  - Resiste al blocco dello schermo di iOS/Android, al cambio di app e al ricaricamento della pagina.
  - Notifiche con vibrazione e suoni alla scadenza del timer.

- **Tracciamento Progressi & Rilevamento Stallo**:
  - Calcolo automatico dei carichi rappresentativi e trend visivi (frecce verdi in crescita, rosse in calo, stabili).
  - Algoritmo di rilevamento stallo (plateau) automatico basato su serie temporali.
  - Statistiche aggregate su streak, volume e durata media.

- **Backup & Portabilità dei Dati**:
  - Esportazione ed importazione completa in formato standard **JSON**.
  - Pulsante con 1-click in Impostazioni per ripristinare all'istante la scheda e lo storico completo dei 9 workout.

---

## Stack Tecnologico

| Componente | Tecnologia | Ruolo |
|------------|------------|-------|
| **Framework UI** | React 18 + TypeScript (Strict) | Rendering reattivo tipizzato |
| **Build & Tooling** | Vite 5 + SWC | Compilazione rapida e HMR |
| **Styling** | Tailwind CSS v3 | Design system basato su utility e token CSS |
| **Animazioni & Smooth Scroll** | Framer Motion + Lenis | Transizioni fluide e feedback aptico visivo |
| **Stato Applicativo** | Zustand | Gestione dello stato globale UI e timer |
| **Database Locale** | Dexie.js (IndexedDB) | Storage offline local-first |
| **Backend & Cloud** | Supabase (PostgreSQL 17 + GoTrue) | Autenticazione, RLS e cloud sync |
| **PWA & Offline** | vite-plugin-pwa + Workbox | Service Worker, precaching e installazione PWA |
| **Testing** | Vitest + React Testing Library | 14 suite con 141 test automatizzati |
| **Hosting & CI/CD** | Vercel Edge Network | Hosting ad altissima velocità e CDN globale |

---

## Struttura del Progetto

```
WorkoutApp/
├── .env.example               # Template variabili d'ambiente
├── .env.local                 # Credenziali locali Supabase (ignorato da git)
├── .gitignore                 # Regole git (esclude cache, build, .env)
├── README.md                  # Documentazione generale
├── index.html                 # Entry point HTML e configurazione viewport PWA
├── package.json               # Dipendenze e script npm
├── tailwind.config.js         # Token di design visionOS e palette monocromatica
├── tsconfig.json              # Configurazione TypeScript strict
├── vercel.json                # Configurazione routing e headers di sicurezza Vercel
├── vite.config.ts             # Configurazione Vite e plugin PWA Workbox
│
├── data/                      # Backup e dati di riferimento
│   └── workout-backup-progressi.json
│
├── docs/                      # Documentazione tecnica approfondita
│   ├── ARCHITECTURE.md        # Architettura del sistema e flusso dei dati
│   ├── DATABASE_AND_SYNC.md   # Schema PostgreSQL, policy RLS e motore di sync
│   ├── DESIGN_SYSTEM.md       # Specifiche grafiche visionOS (Anti-AI slop)
│   └── DEPLOYMENT.md          # Istruzioni di deploy per GitHub e Vercel
│
├── public/                    # Asset statici, icone PWA e manifest
├── scripts/                   # Script di supporto e utility di QA
│
├── src/                       # Codice sorgente dell'applicazione
│   ├── app/                   # App root, router e provider
│   ├── assets/                # Asset vettoriali e logo brand
│   ├── components/            # Componenti UI visionOS e layout
│   ├── db/                    # Schema Dexie, repository e seed
│   ├── features/              # Moduli di business (auth, workout, progress, settings)
│   ├── lib/                   # Utilità, selettori, formattatori e sync engine
│   ├── stores/                # Zustand stores (authStore, workoutStore)
│   ├── styles/                # CSS globale e token
│   ├── test/                  # Test suite Vitest e RTL
│   └── types/                 # Interfacce e tipi TypeScript
│
└── supabase/                  # Backend Supabase
    └── migrations/            # File SQL migrazioni e RLS
```

---

## Installazione e Avvio Locale

### Requisiti
- **Node.js** >= 18
- **npm** >= 9

### Procedura

```bash
# 1. Clona la repository
git clone https://github.com/alessandrobottone2005-crypto/workout_webapp.git
cd workout_webapp

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env.local
# Inserisci le tue chiavi Supabase in .env.local

# 4. Avvia il server di sviluppo
npm run dev
```

L'applicazione sarà attiva su `http://localhost:5173`.

---

## Script di Verifica e Qualità

```bash
# Controllo lint con ESLint (0 warning tollerati)
npm run lint

# Controllo dei tipi con TypeScript strict
npm run typecheck

# Esecuzione completa di tutti i test (14 suite, 141 test)
npm run test:run

# Build di produzione e generazione PWA Service Worker
npm run build
```

---

## Documentazione Dettagliata

Per approfondire ogni aspetto del progetto, consulta le guide dedicate:
- 📐 [Architettura del Sistema](docs/ARCHITECTURE.md)
- 🗄️ [Database, RLS e Sincronizzazione](docs/DATABASE_AND_SYNC.md)
- 👓 [Design System Apple visionOS](docs/DESIGN_SYSTEM.md)
- 🚀 [Deployment GitHub & Vercel](docs/DEPLOYMENT.md)

---

## Licenza

Progetto personale di proprietà di **Alessandro Bottone**. Tutti i diritti riservati.
