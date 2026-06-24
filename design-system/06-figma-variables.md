# Step 6 — Figma Variables

Figma file: https://www.figma.com/design/vchticmbET2paGoYJNN7Mz/Enterprise-DS

Variables were pushed directly from the DTCG token files using the Figma Plugin API
via the Figma MCP + desktop bridge — no Tokens Studio required.

---

## Collections

### Core (51 variables — 1 mode: Default)

The raw primitive palette. Values never change per brand. Everything here is a
raw hex or number that the Semantic layer references.

| Group | Count | Type | Scope |
|-------|-------|------|-------|
| `color/blue/*` | 7 | COLOR | FRAME_FILL, SHAPE_FILL, TEXT_FILL, STROKE_COLOR |
| `color/neutral/*` | 9 | COLOR | " |
| `color/red/*` | 3 | COLOR | " |
| `color/green/*` | 3 | COLOR | " |
| `radius/*` | 7 | FLOAT | CORNER_RADIUS |
| `space/*` | 9 | FLOAT | GAP, WIDTH_HEIGHT |
| `font-size/*` | 6 | FLOAT | FONT_SIZE |
| `font-weight/*` | 4 | FLOAT | FONT_WEIGHT |
| `border-width/*` | 3 | FLOAT | STROKE_FLOAT |

### Semantic (44 variables — 2 modes: Blue · Dark)

Intent layer. Every variable is an alias pointing to a Core variable.
Switching mode = switching brand. Designers never touch the Core values.

| Group | Variables | What differs per brand |
|-------|-----------|----------------------|
| `action/primary/*` | 8 | bg → blue/600 vs neutral/900; radius → md vs none |
| `input/*` | 6 | border-color-focus, radius |
| `card/*` | 4 | radius → xl vs sm; shadow → md vs none |
| `badge/*` | 7 | radius → full vs xs |
| `surface/*` | 4 | page → blue/50 vs neutral/100 |
| `status/*` | 4 | same in both brands |

---

## How to switch brands in Figma

1. Select a frame or component on the canvas
2. In the right panel → **Variables** section
3. Under **Semantic**, click the mode dropdown
4. Switch between **Blue** and **Dark** — all bound properties update instantly

---

## How to add a new brand

1. Open the Semantic collection in Figma (Variables panel → Semantic)
2. Click **+** next to the mode header to add a mode (e.g. "Green")
3. For each Semantic variable, set the new mode's value to the appropriate Core alias
4. Update `tokens/brands/brand-green.json` with the same overrides so code stays in sync
5. Run `npm run build-tokens` to regenerate CSS

---

## How to update variables from code (MCP)

If token values change in `tokens/core.json` or `tokens/semantic.json`, re-run
the variable push script via the Figma MCP:

```
# Reads the current DTCG token files and updates variable values in the Figma file
# (Script lives in design-system/scripts/push-variables.md — to be added in Step 9)
```

> Code is the source of truth. Figma reads from it — never the other way around.

---

## Variable proof (spot-checked)

| Semantic token | Blue mode → Core | Dark mode → Core |
|---------------|-----------------|-----------------|
| `action/primary/bg` | `color/blue/600` → #2563EB | `color/neutral/900` → #111827 |
| `card/radius` | `radius/xl` → 16px | `radius/sm` → 4px |
| `badge/radius` | `radius/full` → 9999px | `radius/xs` → 2px |
| `surface/page` | `color/blue/50` → #EFF6FF | `color/neutral/100` → #F3F4F6 |
