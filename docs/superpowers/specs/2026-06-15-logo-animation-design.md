# Logo Annamori — Animazione SVG Design Spec

**Date:** 2026-06-15  
**Status:** Approved  
**Author:** Brainstorming session with designer

---

## Goal

Animare il logo sole (`logoannamori.svg`) per uso su sito web: rotazione continua antioraria sul centro, con raggi che pulsano in alternanza (corti ↔ lunghi), fill `#1a1a1a`, rispetto di `prefers-reduced-motion`.

---

## Requirements Summary

| Requirement | Decision |
|-------------|----------|
| Destinazione | Sito web |
| Feeling | Equilibrato — visibile ma non invadente |
| Rotazione | Antioraria sul centro, loop continuo |
| Pulse raggi | Alternato: corti si allungano, lunghi si accorciano (e viceversa) |
| Loop | Continuo, senza pausa on hover |
| Reduced motion | Logo statico quando `prefers-reduced-motion: reduce` |
| Fill | `#1a1a1a` (fisso) |
| Tecnologia | SVG restructured + CSS puro (zero JavaScript) |

---

## Source Asset

- **File originale:** `logoannamori.svg`
- **ViewBox:** `0 0 5519 5519`
- **Centro geometrico:** `(2759.1, 2759.1)`
- **Struttura attuale:** un singolo `<path>` con 24 raggi alternati lunghi/corti (export Affinity/Illustrator)
- **L'originale resta invariato** come backup/riferimento

---

## Architecture

### File Structure

```
animazionelogomori/
├── logoannamori.svg              ← originale (invariato)
├── logoannamori-animated.svg     ← SVG restructured con gruppi e classi
├── logo-annamori.css             ← keyframes e regole animazione
├── index.html                    ← preview locale
└── docs/superpowers/specs/
    └── 2026-06-15-logo-animation-design.md
```

### SVG Structure

Il path monolitico viene splittato in **24 path individuali** (uno per raggio), raggruppati per animazione:

```xml
<svg viewBox="0 0 5519 5519" xmlns="http://www.w3.org/2000/svg">
  <g id="sun" class="sun-rotate">
    <path class="ray ray-long"  d="..." fill="#1a1a1a"/>
    <path class="ray ray-short" d="..." fill="#1a1a1a"/>
    <!-- alternati: long, short × 12 coppie = 24 raggi -->
  </g>
</svg>
```

- **`#sun` / `.sun-rotate`:** wrapper per la rotazione
- **`.ray-long`:** 12 raggi lunghi (stato riposo: scale 100%)
- **`.ray-short`:** 12 raggi corti (stato riposo: scale 65%)
- **Fill:** `#1a1a1a` su ogni raggio

### Split Strategy

Ogni raggio è un triangolo/wedge radiale dal centro `(2759.1, 2759.1)` verso l'esterno. Lo split avviene analizzando i segmenti del path originale: ogni coppia di coordinate `(centro → punta → centro)` forma un raggio. I raggi vanno classificati come `long` o `short` in base alla lunghezza radiale originale.

---

## Animation Behavior

### Rotazione (`.sun-rotate`)

| Property | Value |
|----------|-------|
| Transform-origin | `2759.1px 2759.1px` (centro viewBox) |
| Direction | Antiorario (`rotate(0deg)` → `rotate(-360deg)`) |
| Duration | 10s |
| Timing | `linear` |
| Iteration | `infinite` |

### Pulse raggi (`.ray-long` / `.ray-short`)

| Property | `.ray-long` | `.ray-short` |
|----------|-------------|--------------|
| Transform-origin | `2759.1px 2759.1px` | `2759.1px 2759.1px` |
| Scale keyframes | 100% → 65% → 100% | 65% → 100% → 65% |
| Duration | 2s | 2s |
| Timing | `ease-in-out` | `ease-in-out` |
| Iteration | `infinite` | `infinite` |
| Phase | in fase | controfase (offset 0s vs 1s, oppure keyframes speculari) |

Rotazione (10s) e pulse (2s) sono **indipendenti** — il movimento risulta organico, non sincronizzato meccanicamente.

### Scale Mechanism

`transform: scale()` con `transform-origin` al centro del sole produce accorciamento/allungamento **radiale**: il raggio si comprime verso il centro senza spostamento laterale. Questo è il comportamento desiderato per l'effetto "respiro" alternato.

---

## CSS

### Keyframes (sketch)

```css
@keyframes sun-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}

@keyframes ray-pulse-long {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(0.65); }
}

@keyframes ray-pulse-short {
  0%, 100% { transform: scale(0.65); }
  50%      { transform: scale(1); }
}
```

### Application

```css
.sun-rotate {
  transform-origin: 2759.1px 2759.1px;
  animation: sun-spin 10s linear infinite;
}

.ray-long {
  transform-origin: 2759.1px 2759.1px;
  animation: ray-pulse-long 2s ease-in-out infinite;
}

.ray-short {
  transform-origin: 2759.1px 2759.1px;
  animation: ray-pulse-short 2s ease-in-out infinite;
}
```

---

## Embedding (Web)

L'SVG **deve essere inline** nel HTML (non `<img src="...">`) affinché le classi CSS esterne animino i gruppi interni.

```html
<link rel="stylesheet" href="logo-annamori.css">
<div class="logo-annamori">
  <!-- contenuto di logoannamori-animated.svg inline -->
</div>
```

Dimensioni responsive controllate dal container:

```css
.logo-annamori svg {
  width: 120px;   /* o qualsiasi dimensione desiderata */
  height: auto;
  display: block;
}
```

---

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  .sun-rotate,
  .ray-long,
  .ray-short {
    animation: none;
  }
}
```

Stato statico con reduced motion: raggi lunghi al 100%, corti al 65% (stato iniziale naturale, nessuna animazione).

---

## Preview & Verification

`index.html` — pagina bianca con logo centrato, per verificare:

1. Loop fluido senza scatto al restart
2. Simmetria del pulse alternato (corti e lunghi in controfase)
3. Nitidezza vettoriale a 48px, 120px, 240px
4. Reduced motion: animazioni disattivate (testabile via DevTools → Rendering → Emulate prefers-reduced-motion)

---

## Out of Scope

- JavaScript / GSAP
- Lottie / Canvas export
- Varianti colore / dark mode
- Pausa on hover
- Integrazione framework-specific (React component) — embed generico inline SVG + CSS

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Split path impreciso | Script Python per estrarre raggi dal path originale con coordinate esatte |
| Scale non perfettamente radiale su raggi obliqui | `transform-origin` al centro geometrico; verificare visivamente in preview |
| CSS esterno non applicato a SVG inline cross-browser | Test su Chrome, Firefox, Safari; fallback: embed CSS nel `<style>` dentro l'SVG |
