# Design System: DenseNet Website

**Project ID:** densenet-website-2026

This document specifies the complete design tokens, layout principles, typography definitions, color modes, and animations implemented in the DenseNet frontend website.

---

## 1. Visual Theme & Atmosphere

The DenseNet visual identity is **Tactical, Technical, and High-Stakes**. It evokes a "Mission Command" atmosphere through high-contrast interfaces, utilitarian typography, and energetic "glowing" accents. The aesthetic is engineered for precision and rapid information processing, combining a stark monochrome foundation with vibrant, functional highlights.

---

## 2. Typography System

### Google Fonts Integration

The website utilizes a four-tiered font configuration loaded via `next/font/google`:

* **Base Sans-Serif Font (`--font-base`):** `Inter` — Used for main UI controls, general body copy, and dense telemetry data readouts.
* **Heading Sans-Serif Font (`--font-heading`):** `Inter_Tight` — Used for titles, block subtitles, and interface controls requiring tight kerning.
* **Serif Font (`--font-serif`):** `Instrument_Serif` (Weight: `400`) — Used for editorial headers, feature sections, and prominent taglines.
* **Monospace Font (`--font-mono`):** `Geist_Mono` — Used for telemetry logs, code fragments, coordinate lists, and statistical markers.

### Global Styling Rules

Defined under the `@layer base` CSS layer:

* **Body defaults:** `@apply bg-canvas text-ink font-base antialiased`
* **Headings (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`):** `@apply font-serif font-normal tracking-tight`
* **Selection styling:** Selected text receives a subtle highlight `@apply bg-stone/50 text-ink`.
* **Borders:** Elements default to `@apply border-hairline outline-ink/10` for clean layouts.

### Custom Typography Classes

* **`.text-display-xxl`:** Heavyweight hero display.

  * **Font Size:** `clamp(44px, 8vw, 96px)` (fluid responsive sizing)
  * **Line Height:** `1.0`
  * **Letter Spacing:** `-0.01em`
  * **OpenType Features:** `"ss01", "ss04", "ss11"` (stylistic alternates)
* **`.text-display-xl`:** Secondary header display.

  * **Font Size:** `clamp(36px, 6vw, 76.8px)`
  * **Line Height:** `1.0`
  * **Letter Spacing:** `-0.01em`
* **`.text-display-lg`:** Card/feature headline.

  * **Font Size:** `clamp(32px, 5vw, 56px)`
  * **Line Height:** `1.2`
  * **Letter Spacing:** `-0.05em`

---

## 3. Color Palette System

### Mode-Independent Accents

These accent colors remain uniform in both Light and Dark themes to ensure critical status alerts remain instantly recognizable:

* **Accent Orange:** `#ff801f` | Glow: `rgba(255, 89, 0, 0.22)`
* **Accent Yellow:** `#ffc53d` | Glow: `rgba(255, 197, 61, 0.15)`
* **Accent Blue:** `#3b9eff` | Glow: `rgba(0, 117, 255, 0.34)`
* **Accent Green:** `#11ff99` | Glow: `rgba(34, 255, 153, 0.18)`
* **Accent Red:** `#ff2047` | Glow: `rgba(255, 32, 71, 0.34)`
* **Accent Link:** `#3b9eff`

### Theme Variables

| CSS Token            | Tailwind Alias           | Light Mode (`:root`) | Dark Mode (`.dark`)      | Core Purpose / Role                           |
| :------------------- | :----------------------- | :------------------- | :----------------------- | :-------------------------------------------- |
| `--background`       | `bg-background`          | `#ffffff`            | `#000000`                | Global page root background                   |
| `--foreground`       | `text-foreground`        | `#000000`            | `#fcfdff`                | Main text color                               |
| `--canvas`           | `bg-canvas`              | `#ffffff`            | `#000000`                | Structural backdrop canvas                    |
| `--ink`              | `text-ink`               | `#000000`            | `#fcfdff`                | Ultra-high contrast text & graphics           |
| `--body`             | `text-body`              | `rgba(0,0,0,0.86)`   | `rgba(252,253,255,0.86)` | Default readability body text                 |
| `--charcoal`         | `text-charcoal`          | `rgba(0,0,0,0.7)`    | `rgba(252,253,255,0.7)`  | Secondary de-emphasized typography            |
| `--mute`             | `text-mute`              | `#636669`            | `#a1a4a5`                | Metadata, disabled indicators                 |
| `--ash`              | `text-ash`               | `#888e90`            | `#888e90`                | Midtone tertiary elements                     |
| `--stone`            | `bg-stone`               | `#e5e7eb`            | `#464a4d`                | Structural blocks, borders, active selections |
| `--surface-card`     | `bg-surface-card`        | `#f9f9fb`            | `#0a0a0c`                | Feature cards, containers, grid blocks        |
| `--surface-elevated` | `bg-surface-elevated`    | `#f2f2f7`            | `#101012`                | Popovers, active hovers, tooltips             |
| `--surface-deep`     | `bg-surface-deep`        | `#f9f9fb`            | `#06060a`                | Deep secondary containers                     |
| `--hairline`         | `border-hairline`        | `rgba(0,0,0,0.06)`   | `rgba(255,255,255,0.06)` | Extremely thin divider lines                  |
| `--hairline-strong`  | `border-hairline-strong` | `rgba(0,0,0,0.12)`   | `rgba(255,255,255,0.14)` | Heavy structural borders                      |
| `--divider-soft`     | `divider-soft`           | `rgba(0,0,0,0.04)`   | `rgba(255,255,255,0.04)` | Subtle inner-module separation lines          |
| `--primary-color`    | `bg-primary`             | `#000000`            | `#fcfdff`                | Primary CTA block color                       |
| `--primary-on`       | `text-primary-on`        | `#ffffff`            | `#000000`                | Text/icon colors placed on primary CTAs       |

---

## 4. Spacing & Structure

### Border Radii

* `--radius-sm`: `6px`
* `--radius-md`: `8px`
* `--radius-lg`: `12px`
* `--radius-xl`: `16px`
* `--radius-full`: `9999px`

### Layout Containers

* **Wrapper Component:** Standardizes grid width boundaries.

  * **Classes:** `h-full mx-auto w-full lg:max-w-screen-xl px-4 lg:px-10`
* **Scrollbar Discipline:** Minimalist, mode-aware track and thumb styling:

  * **Width:** `0.25rem` (`4px`)
  * **Thumb:** `@apply bg-stone rounded-full`
  * **Track:** `@apply bg-canvas`

---

## 5. Animation & Atmospheric Utilities

### Dynamic Glow Layers

Utilizes radial gradients positioned behind key UI elements to emphasize data sections and add digital atmosphere without adding physics weight:

* **`.glow-orange`:** `radial-gradient(circle at top, var(--color-accent-orange-glow), transparent 600px)`
* **`.glow-blue`:** `radial-gradient(circle at top, var(--color-accent-blue-glow), transparent 600px)`
* **`.glow-green`:** `radial-gradient(circle at top, var(--color-accent-green-glow), transparent 600px)`
* **`.glow-red`:** `radial-gradient(circle at top, var(--color-accent-red-glow), transparent 600px)`
* **`.glow-yellow`:** `radial-gradient(circle at top, rgba(255, 197, 61, 0.15), transparent 600px)`

### Keyframe Animations

* **`marquee`:** Horizontally scrolls items continuously.

  * **Speed:** Configured via `var(--duration)` variable (linear iteration).
  * **Keyframes:** `from { transform: translateX(0); } to { transform: translateX(calc(-100% - var(--gap))); }`
* **`marquee-vertical`:** Vertically scrolls columns continuously.

  * **Keyframes:** `from { transform: translateY(0); } to { transform: translateY(calc(-100% - var(--gap))); }`

### Interface Transitions

* **Container Component:** Standardized entrance animations powered by `framer-motion`:

  * **`fadeUp`:** Slide from `y: 20` to `y: 0` with `opacity: 1`
  * **`fadeDown`:** Slide from `y: -20` to `y: 0` with `opacity: 1`
  * **`fadeLeft`:** Slide from `x: -20` to `x: 0` with `opacity: 1`
  * **`fadeRight`:** Slide from `x: 20` to `x: 0` with `opacity: 1`
  * **`scaleUp`:** Scale from `0.95` to `1.0` with `opacity: 1`
  * **Timing:** Entrance transitions use a duration of `0.2` seconds with `easeOut` easing. Delays are scaled sequentially using a multiplier of `0.2` seconds per element depth.
