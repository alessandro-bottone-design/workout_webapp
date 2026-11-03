# Design System — Apple visionOS Guidelines

WorkoutApp segue meticolosamente il Design System ufficiale di Apple per **visionOS**, con una trasposizione fedele su interfaccia web mobile e desktop.

---

## 1. Principi Fondamentali (Anti-AI Slop)

1. **Materiali Reali in Vetro Smerigliato (*Frosted Glass*)**:
   Nessun gradiente arcobaleno o glow al neon. Tutte le superfici informative utilizzano il componente [GlassCard](file:///Volumes/SSD_ALE/LavoriPersonali/WorkoutApp/src/components/ui/GlassCard.tsx) (`bg-white/[0.04]` o `bg-white/[0.06]`, bordo sottile `border-white/10`, sfocatura avanzata `backdrop-blur-2xl`).

2. **Spaziature Rigorose a Passo 8**:
   Tutti i margini, padding, altezze e gap utilizzano esclusivamente multipli esatti di 8 pixel:
   - `p-2` / `gap-2` = 8px
   - `p-4` / `gap-4` / `space-y-4` = 16px
   - `p-6` / `mb-6` = 24px
   - `h-8` = 32px
   - `h-10` = 40px
   - `h-12` = 48px (standard per tutti i touch target)
   - `h-16` / `w-16` = 64px

3. **Palette Cromatica Neutra & Monocromatica**:
   - Sfondo: `#000000` (nero assoluto per display OLED)
   - Superfici: strati traslucidi `rgba(255, 255, 255, 0.04)` fino a `rgba(255, 255, 255, 0.12)`
   - Bordi: `rgba(255, 255, 255, 0.10)` per separatori normali e `rgba(255, 255, 255, 0.20)` per elementi focalizzati
   - Testo Primario: `#FFFFFF`
   - Testo Secondario: `rgba(255, 255, 255, 0.60)`
   - Testo Meta / Terziario: `rgba(255, 255, 255, 0.40)`
   - Colore di accento / Azione principale: bianco puro `#FFFFFF` su nero per pulsanti principali, o badge di pericolo soft per eliminazioni irreversibili.

4. **Regola dei Due Pesi Tipografici (400 e 600)**:
   Per garantire chiarezza visiva ed eleganza, il sistema utilizza al massimo due pesi per font:
   - **Regular (400)**: per il corpo del testo, note, descrizioni e numeri secondari.
   - **Semibold (600)**: per titoli di sezione, metriche principali e pulsanti di azione.
   - Nessun testo viene renderizzato in `uppercase` (tutto segue il sentence case standard).

5. **Iconografia Unificata**:
   Tutte le icone provengono esclusivamente da `lucide-react`, con spessore uniforme (`strokeWidth={1.75}`) e proporzioni geometriche proporzionali (16px, 20px, 24px).

---

## 2. Componenti Chiave del Design System

### `GlassCard`
Il componente base per contenere sezioni, riquadri metrica e form:
```tsx
<GlassCard className="p-4 space-y-4">
  <h3 className="text-body font-semibold text-text-primary">Titolo Sezione</h3>
  <p className="text-meta text-text-secondary">Descrizione leggibile.</p>
</GlassCard>
```

### `Button`
Disponibile in varianti coerenti:
- `primary`: sfondo bianco solido, testo nero, target tattile minimo di 48px.
- `secondary`: sfondo traslucido `bg-white/10`, testo bianco, bordo leggero.
- `ghost`: senza sfondo, solo feedback al tap / hover.
- `danger`: testo rosso desaturato per azioni di eliminazione.

### Segmented Control
I controlli a schede (es. "Accedi" / "Crea account", o "Ripetizioni" / "Pesi") utilizzano una pillola scura con fondo traslucido `bg-white/[0.04]` e cursore attivo in bianco solido con contrasto elevato.

---

## 3. Touch Target e Accessibilità
Ogni pulsante interattivo rispetta il criterio minimo di accessibilità Apple di **48×48 pt**, garantendo facilità d'uso con una mano sola durante gli allenamenti in palestra con carichi pesanti.
