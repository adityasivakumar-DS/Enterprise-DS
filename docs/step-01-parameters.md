# Design System Parameters — Step 1 Output

Generated as Step 1 of the AI-Driven Design System Playbook.

**Assumptions to confirm with Lead before Step 2 is locked:**
- Audience: internal teams (no external brand isolation needed yet)
- Two demo brands: **Apex** (corporate, sharp, blue) and **Nova** (consumer, rounded, purple)
- Starting fresh — no existing token library or Figma library

---

## Three-Tier Parameter Model

### Tier 1 — Core Primitives
Raw values with no semantic meaning. These are the raw materials. Components never read from here directly.

| Knob | Allowed Values | Description |
|------|----------------|-------------|
| `color.blue.{step}` | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 | Blue palette, lightest to darkest |
| `color.purple.{step}` | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 | Purple palette, lightest to darkest |
| `color.neutral.{step}` | 0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000 | White-to-black grey ramp |
| `spacing.{n}` | 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px | 4-point spatial scale |
| `radius.{size}` | none=0px, sm=2px, md=6px, lg=12px, full=9999px | Corner-rounding options |
| `border.width.{size}` | none=0px, sm=1px, md=2px, lg=3px | Stroke thickness |
| `font.size.{size}` | sm=14px, md=16px, lg=18px | Type size scale |
| `font.weight.{name}` | regular=400, medium=500, semibold=600, bold=700 | Typographic weight |
| `shadow.{size}` | none, sm, md, lg | Box shadow recipes (composite values) |
| `motion.duration.{speed}` | fast=100ms, base=200ms, slow=300ms | How long transitions run |
| `motion.easing.{curve}` | linear, ease-out, ease-in-out | Cubic-bezier curve for transitions |

---

### Tier 2 — Semantic (Intent-Based)
No raw values here — only aliases. Every token name describes *purpose*, not appearance.
Components consume only these tokens.

| Knob | Intent | Resolves via |
|------|--------|--------------|
| `action.primary.bg` | Fill of the main CTA at rest | `brand.color.primary.base` |
| `action.primary.bg-hover` | Fill of the main CTA on hover | `brand.color.primary.dark` |
| `action.primary.fg` | Text/icon color on the main CTA | `brand.color.primary.fg` |
| `action.primary.border-color` | Stroke color on the main CTA | `brand.border.action-color` |
| `action.primary.border-width` | Stroke thickness on the main CTA | `brand.border.action-width` |
| `action.primary.radius` | Corner rounding of the main CTA | `brand.shape.action-radius` |
| `action.primary.shadow` | Elevation of the main CTA | `brand.shadow.action` |
| `action.primary.font-size` | Label text size (fixed across brands) | `font.size.md` |
| `action.primary.font-weight` | Label text weight | `brand.font.action-weight` |
| `action.primary.padding-x` | Horizontal internal spacing (fixed) | `spacing.5` |
| `action.primary.padding-y` | Vertical internal spacing (fixed) | `spacing.3` |
| `action.primary.transition-duration` | Speed of hover/focus animation | `brand.motion.action-duration` |
| `action.primary.transition-easing` | Curve of hover/focus animation | `brand.motion.action-easing` |

---

### Tier 3 — Brand Knobs (Component-Level Overrides)
One file per brand. These feed into the semantic layer. Adding a new brand = adding one file.

| Knob | Apex (blue, sharp) | Nova (purple, rounded) | Notes |
|------|-------------------|------------------------|-------|
| `brand.color.primary.light` | `color.blue.100` | `color.purple.100` | Tints, focus rings |
| `brand.color.primary.base` | `color.blue.700` | `color.purple.600` | Main CTA fill |
| `brand.color.primary.dark` | `color.blue.900` | `color.purple.800` | Hover fill |
| `brand.color.primary.fg` | `color.neutral.0` (white) | `color.neutral.0` (white) | Text on CTA |
| `brand.shape.action-radius` | `radius.none` (0px) | `radius.full` (9999px) | Sharp vs pill |
| `brand.shadow.action` | `shadow.none` | `shadow.md` | Flat vs elevated |
| `brand.border.action-width` | `border.width.none` | `border.width.none` | No stroke on either |
| `brand.border.action-color` | `color.blue.700` | `color.purple.600` | Used when border-width > 0 |
| `brand.font.action-weight` | `font.weight.semibold` | `font.weight.medium` | Strong vs soft label |
| `brand.motion.action-duration` | `motion.duration.fast` | `motion.duration.base` | Snappy vs fluid |
| `brand.motion.action-easing` | `motion.easing.ease-out` | `motion.easing.ease-in-out` | Decelerate vs symmetric |

---

## Done-When Verification

This list produces two visibly different buttons from the same component:

- **Apex**: `#1D4ED8` fill · 0px radius · no shadow · semibold · 100ms ease-out → sharp, corporate
- **Nova**: `#7C3AED` fill · 9999px radius · medium shadow · medium weight · 200ms ease-in-out → soft, consumer

Same markup. Different brand file. Clearly different appearance. ✓

---

## Open Questions for Lead to Resolve

1. Add an amber/warm palette for a third brand? (doesn't affect Step 2 scope)
2. Should `padding-x` / `padding-y` be brand-controlled or fixed? Currently fixed.
3. Any accessibility floor on primary color contrast? (WCAG AA requires 4.5:1 on white — both brands pass, confirm during Step 7.)
