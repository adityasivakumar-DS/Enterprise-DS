# Step 1 — Design System Parameter List

> Generated from the attribute matrix: shape · fill · border · corner · shadow · size · motion
> Two brands (blue-rounded vs. black-sharp) can be expressed entirely through different values here.

---

## Tier 1 — Core Primitives
Raw values only. No semantic meaning attached. These are the raw ingredients in the warehouse.

### Color

| Name | Allowed Values | Description |
|------|---------------|-------------|
| `color.blue.50–900` | `#EFF6FF` → `#1E3A8A` | 7-step blue scale |
| `color.neutral.0–950` | `#FFFFFF` → `#030712` | 9-step neutral / gray scale |
| `color.red.100–700` | `#FEE2E2` → `#B91C1C` | Error / danger scale |
| `color.green.100–700` | `#DCFCE7` → `#15803D` | Success scale |

### Corner Radius (shape)

| Name | Allowed Values | Description |
|------|---------------|-------------|
| `radius.none` | `0px` | Hard square — no rounding |
| `radius.xs` | `2px` | Barely there |
| `radius.sm` | `4px` | Subtle rounding |
| `radius.md` | `8px` | Default rounded |
| `radius.lg` | `12px` | Soft |
| `radius.xl` | `16px` | Very soft |
| `radius.full` | `9999px` | Pill / circle |

### Shadow / Elevation

| Name | Allowed Values | Description |
|------|---------------|-------------|
| `shadow.none` | `none` | Flat, no lift |
| `shadow.sm` | `0 1px 2px rgba(0,0,0,.05)` | Subtle lift |
| `shadow.md` | `0 4px 6px -1px rgba(0,0,0,.1)` | Card-level elevation |
| `shadow.lg` | `0 10px 15px -3px rgba(0,0,0,.1)` | Modal-level elevation |

### Spacing (size)

| Name | Allowed Values | Description |
|------|---------------|-------------|
| `space.1–12` | `4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px` | Base-4 spatial scale |

### Border

| Name | Allowed Values | Description |
|------|---------------|-------------|
| `border.width.0` | `0px` | No border |
| `border.width.1` | `1px` | Hair stroke |
| `border.width.2` | `2px` | Medium stroke |
| `border.style.solid` | `solid` | Default |
| `border.style.dashed` | `dashed` | Emphasis / outline |

### Typography (size)

| Name | Allowed Values | Description |
|------|---------------|-------------|
| `font-size.xs–2xl` | `12, 14, 16, 18, 20, 24px` | 6-step type scale |
| `font-weight.regular` | `400` | Normal |
| `font-weight.medium` | `500` | Slightly emphasised |
| `font-weight.semibold` | `600` | Labels, CTAs |
| `font-weight.bold` | `700` | Headings |
| `line-height.tight–relaxed` | `1.2, 1.4, 1.5, 1.75` | 4 line-height steps |

### Motion

| Name | Allowed Values | Description |
|------|---------------|-------------|
| `duration.instant` | `0ms` | No animation |
| `duration.fast` | `100ms` | Micro-interactions |
| `duration.normal` | `200ms` | Default transitions |
| `duration.slow` | `300ms` | Entry/exit animations |
| `easing.ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerate — exits |
| `easing.ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Decelerate — entrances |
| `easing.ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default — state changes |
| `easing.linear` | `linear` | Progress bars, loaders |

---

## Tier 2 — Semantic Tokens
Intent-based. Each aliases to one core primitive. Changing the alias changes the brand.

### Action (primary interactive element — button)

| Token | Intent | Default alias |
|-------|--------|---------------|
| `action.primary.bg` | Resting background fill | → `color.blue.600` |
| `action.primary.bg-hover` | Hover background fill | → `color.blue.700` |
| `action.primary.bg-active` | Pressed background fill | → `color.blue.800` (add to core if needed) |
| `action.primary.fg` | Label / icon colour | → `color.neutral.0` |
| `action.primary.radius` | Corner rounding | → `radius.md` |
| `action.primary.shadow` | Elevation at rest | → `shadow.sm` |
| `action.primary.border-width` | Stroke thickness | → `border.width.0` |
| `action.primary.padding-x` | Horizontal inset | → `space.4` |
| `action.primary.padding-y` | Vertical inset | → `space.2` |
| `action.primary.font-size` | Label size | → `font-size.sm` |
| `action.primary.font-weight` | Label weight | → `font-weight.semibold` |
| `action.primary.transition-duration` | Hover/focus animation speed | → `duration.fast` |
| `action.primary.transition-easing` | Hover/focus animation curve | → `easing.ease-out` |

### Surface

| Token | Intent | Default alias |
|-------|--------|---------------|
| `surface.page` | Page / canvas background | → `color.neutral.50` |
| `surface.card` | Card / panel background | → `color.neutral.0` |
| `surface.card-border` | Card stroke colour | → `color.neutral.200` |
| `surface.overlay` | Modal scrim | → `color.neutral.950` (+ opacity in component) |

### Status

| Token | Intent | Default alias |
|-------|--------|---------------|
| `status.success.bg` | Success fill | → `color.green.100` |
| `status.success.fg` | Success text/icon | → `color.green.700` |
| `status.error.bg` | Error fill | → `color.red.100` |
| `status.error.fg` | Error text/icon | → `color.red.700` |

---

## Tier 3 — Component-Level Tokens
Specific sizing or structural knobs scoped to one component that don't belong in Tier 2.

### Button sizes

| Token | Intent |
|-------|--------|
| `button.height.sm` | Small button total height (e.g. 32px) |
| `button.height.md` | Medium button total height (e.g. 40px) |
| `button.height.lg` | Large button total height (e.g. 48px) |
| `button.icon-gap` | Gap between icon and label text |
| `button.icon-size` | Icon square dimension |

---

## Brand proof

Two visually distinct brands from identical markup:

| Token | Brand A: Blue Rounded | Brand B: Black Sharp |
|-------|-----------------------|----------------------|
| `action.primary.bg` | `{color.blue.600}` → `#2563EB` | `{color.neutral.900}` → `#111827` |
| `action.primary.bg-hover` | `{color.blue.700}` | `{color.neutral.800}` |
| `action.primary.radius` | `{radius.md}` → `8px` | `{radius.none}` → `0px` |
| `action.primary.shadow` | `{shadow.sm}` | `{shadow.none}` |

---

## Assumptions to confirm before Step 2

1. **Color palette depth** — I used a 7-step blue and 9-step neutral. Do you have an existing palette to slot in instead?
2. **Brand count** — Step 2 generates one brand file. How many brands are you planning for? (Affects folder structure.)
3. **Font family** — not included as a core primitive here because it usually comes from a separate font CDN/variable. Should it be a token too?
4. **Component scope** — parameter list currently covers button only (Step 4 milestone). Should Tier 3 already sketch out input, card, badge tokens?
