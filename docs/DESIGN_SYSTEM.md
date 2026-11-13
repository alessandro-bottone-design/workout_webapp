# Design System — Apple visionOS Guidelines

WorkoutApp adotta un'interfaccia dark monocromatica ispirata ad **Apple visionOS**, costruita su griglia `8px`, materiali traslucidi con sfocatura (`backdrop-blur`), contrasto elevato su schermi OLED e controlli progettati per l'uso ad una mano in palestra.

Tutti i token sono definiti in [`tailwind.config.js`](../tailwind.config.js) e in [`src/shared/styles/globals.css`](../src/shared/styles/globals.css).

---

## 1. Design Token Reali

### Palette Colori

| Token CSS / Tailwind | Valore Reale | Utilizzo |
|----------------------|--------------|----------|
| `--color-bg-app` / `bg-bg-app` | `#0A0A0C` | Sfondo principale dell'app |
| `--color-bg-surface` / `bg-bg-surface` | `#161618` | Superfici solide (sheet/modali) |
| `--color-bg-elevated` / `bg-bg-elevated` | `#202024` | Livelli elevati |
| `--color-bg-glass` / `bg-bg-glass` | `rgba(255, 255, 255, 0.05)` | Card base traslucide |
| `--color-bg-glass-elevated` | `rgba(255, 255, 255, 0.09)` | Card elevate traslucide |
| `--color-bg-glass-active` | `rgba(255, 255, 255, 0.14)` | Stato attivo/hover glass |
| `--color-text-primary` / `text-text-primary` | `#F5F5F7` | Testi principali e titoli |
| `--color-text-secondary` / `text-text-secondary` | `#98989D` | Testi secondari, sottotitoli |
| `--color-text-tertiary` / `text-text-tertiary` | `#636366` | Metadati e placeholder |
| `--color-border-default` | `#2C2C2E` | Bordi solidi |
| `--color-border-glass` | `rgba(255, 255, 255, 0.08)` | Bordi card/dock standard |
| `--color-border-glass-strong` | `rgba(255, 255, 255, 0.16)` | Bordi elementi in evidenza |
| `--color-accent-primary` | `#FFFFFF` | CTA primarie (testo `#0A0A0C` / `#000000`) |
| `--color-danger` / `text-danger` | `#FF453A` | Azioni distruttive ed errori |
| `--color-warning` / `text-warning` | `#FFD60A` | Avvisi e stati di attenzione |
| `--color-success` / `text-success` | `#30D158` | Conferme e trend positivi |
| Meta `theme-color` / PWA | `#09090A` | Colore barra browser e manifest PWA |

### Tipografia
- **Font Family**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif` (nessun font web pesante richiesto al runtime).
- **Regola dei 2 pesi**: solo `400` (*Regular*) e `600` (*Semibold*).
- **Sentence case**: nessun utilizzo di `uppercase` artificiale nei titoli o nelle etichette.
- **Scala tipografica (`tailwind.config.js`)**:
  - `display`: `32px` (`600`, `line-height: 1.2`)
  - `title-lg`: `28px` (`600`, `line-height: 1.2`)
  - `title`: `24px` (`600`, `line-height: 1.25`)
  - `title-sm`: `20px` (`600`, `line-height: 1.3`)
  - `heading`: `18px` (`600`, `line-height: 1.35`)
  - `body`: `16px` (`400`, `line-height: 1.5`)
  - `meta`: `14px` (`400`, `line-height: 1.4`)
  - `label-sm`: `12px` (`600`, `line-height: 1.3`)
  - `numeric-lg`: `56px` (`600`, `line-height: 1`, con `font-variant-numeric: tabular-nums`)

### Border Radius, Griglia 8px e Animazioni
- **Raggi (`rounded-*`)**: `sm` (`8px`), `btn` (`16px`), `card` (`24px`), `modal` (`32px`), `pill` (`9999px`).
- **Spaziature**: multipli di `8px` (`--space-1: 8px`, `--space-2: 16px`, `--space-3: 24px`, `--space-4: 32px`, `--space-screen-x: 16px`).
- **Materiali CSS (`globals.css`)**: `.card` (`backdrop-filter: blur(24px)`), `.card-elevated`, `.glass-panel`, `.glass-dock` (`rgba(22, 22, 24, 0.85)`, `backdrop-filter: blur(32px)`).
- **Iconografia**: esclusivamente `lucide-react` con spessore `strokeWidth={1.75}` (`2` sulle icone attive della bottom dock).
- **Motion**: animazioni Tailwind (`scale-in`, `slide-up`, `fade-in`), `framer-motion` avvolto in `<MotionConfig reducedMotion="user">`, smooth scroll `Lenis` disabilitato automaticamente se `@media (prefers-reduced-motion: reduce)` è attivo.

---

## 2. Componenti Condivisi

### Layout (`src/shared/components/layout/index.tsx`)
- `AppShell`: contenitore full-height `min-h-[100dvh] max-w-[480px] mx-auto bg-bg-app`, ospita `<main>`, la `BottomNavigation` e il `RestTimerLayer`.
- `ScreenHeader`: intestazione sticky con `pt-[env(safe-area-inset-top)]` e variante `'centered'` (`h-16`) o `'display'`.
- `BottomNavigation`: dock flottante (`glass-dock rounded-full h-16`) posizionata con `.bottom-nav` per le 4 sezioni principali: `Home` (`/`), `Scheda` (`/program`), `Progressi` (`/progress`), `Calendario` (`/calendar`).

### Primitivi UI (`src/shared/components/ui/`)
Esportati tramite barrel [`src/shared/components/ui/index.tsx`](../src/shared/components/ui/index.tsx):

| Componente | Scopo |
|------------|-------|
| `GlassCard` | Contenitore base (`bg-white/[0.05] backdrop-blur-xl`) o `elevated` (`bg-white/[0.09] backdrop-blur-2xl`) con `rounded-card` |
| `Button` | Varianti `primary`, `secondary`, `danger`, `ghost`; dimensioni `sm`, `default`, `lg`; supporto `isLoading` e `fullWidth` |
| `IconButton` | Pulsante icona quadrato `48×48px` (`w-12 h-12`) con `aria-label` obbligatoria e toni `default`, `accent`, `danger` |
| `ConfirmDialog` | Bottom sheet modale visionOS con grab handle, animazione spring e accessibilità gestita da `useDialogA11y` |
| `NumericStepper` | Controllo numerico accessibile (`role="spinbutton"`, frecce tastiera) con pulsanti circolari `56×56px` (`w-14 h-14`) |
| `Toggle` | Switch iOS (`role="switch"`, `aria-checked`) con animazione spring ed area tap estesa |
| `Badge` | Pillola compatta (`12px` semibold) nelle varianti `default`, `accent`, `danger`, `warning` |
| `MetricCard` | Card compatta per KPI con valore `tabular-nums` |
| `ProgressBar` | Barra di avanzamento lineare animata |
| `SectionHeader` | Intestazione di sezione con azione opzionale |
| `ScreenTitle` | Titolo di schermata nelle scale `sm` / `md` / `lg` / `xl` |
| `EmptyState` | Stato vuoto centrato con descrizione e CTA |
| `Divider` | Separatore sottile `border-white/[0.08]` |
| `LoadingSpinner` | Indicatore di caricamento circolare |
| `AppLogo` | Rendering del brand logo [`workout-lab-logo.svg`](../src/shared/assets/brand/workout-lab-logo.svg) |

---

## 3. Accessibilità e Touch Target (`>= 44px / 48px`)

Tutti i controlli interattivi rispettano la soglia minima Apple HIG (`>= 44px`, con standard primario a `48px`):

- **`Button`**:
  - `size="sm"`: `min-h-[44px] h-11` (`>= 44px`, verificato anche dalla suite E2E su `ProgramScreen` e controlli pill).
  - `size="default"`: `h-12` (`48px`).
  - `size="lg"`: `h-16` (`64px`).
- **`IconButton`**: `w-12 h-12` (`48×48px`).
- **`BottomNavigation`**: ogni link del dock ha `min-h-[48px]`.
- **`NumericStepper`**: bottoni `-` e `+` da `w-14 h-14` (`56×56px`) + supporto tastiera `ArrowUp`/`ArrowRight` e `ArrowDown`/`ArrowLeft`.
- **`Toggle`**: visivamente `w-12 h-7`, ma con pseudo-elemento di hit-area esteso (`after:-inset-y-2 after:-inset-x-1`) che porta l'area toccabile verticale oltre `44px`.
- **Modali e Sheet (`useDialogA11y` in [`src/shared/lib/useDialogA11y.ts`](../src/shared/lib/useDialogA11y.ts))**:
  - Chiusura con tasto `Escape`.
  - Focus trap completo su `Tab` / `Shift+Tab`.
  - Spostamento automatico del focus iniziale dentro il dialogo e ripristino sul controllo che lo ha aperto alla chiusura.
- **Focus Ring & Input iOS**:
  - `:focus-visible` globale con `outline: 2px solid var(--color-text-primary)`.
  - `input, select, textarea` a `font-size: 16px` per evitare lo zoom automatico di Safari iOS al focus.
  - `touch-action: manipulation` su `html` per eliminare il ritardo da doppio tap.

---

## 4. PWA iPhone: Safe-Area, Viewport e Splash Screen

Per l'esecuzione in modalità standalone su iOS (`apple-mobile-web-app-capable="yes"` e `black-translucent`):

- **Viewport**: [`index.html`](../index.html) imposta `viewport-fit=cover` e `min-height: 100dvh` in CSS per adattarsi dinamicamente alla barra indirizzi di Safari.
- **Variabili Safe-Area (`globals.css`)**:
  - `--safe-top: env(safe-area-inset-top, 0px)` (Dynamic Island / notch, usata da `.pt-safe` e `ScreenHeader`).
  - `--safe-bottom: env(safe-area-inset-bottom, 0px)` (Home Indicator).
  - `--nav-height: 64px` e `--nav-offset: max(16px, var(--safe-bottom))`.
  - `--nav-clearance: calc(var(--nav-offset) + var(--nav-height) + 24px)` applicato automaticamente a `.screen-content` / `.pb-nav`, mentre `.bottom-above-nav` posiziona toast e overlay sopra il dock.
- **Splash Screen iOS (`apple-touch-startup-image`)**:
  Per prevenire il flash bianco all'apertura dalla Home Screen di iPhone, [`index.html`](../index.html) referenzia 4 immagini PNG con sfondo `#0A0A0C` generate da [`scripts/assets/generate-splash.mjs`](../scripts/assets/generate-splash.mjs) in `public/splash/`:
  - `splash-1125x2436.png` (375×812 @3x)
  - `splash-1170x2532.png` (390×844 @3x)
  - `splash-1179x2556.png` (393×852 @3x)
  - `splash-1290x2796.png` (430×932 @3x)
