# Principles — Why Parametric

A parametric design system answers one question: **how do we serve many brands from one codebase without copy-pasting components?**

---

## The core idea

Every visual property a brand controls — colour, corner radius, shadow, spacing — is a *parameter*. A component knows nothing about the brand; it only knows the *names* of the parameters it reads.

Change the parameter values → change the brand. Component code stays identical.

---

## Three tiers

| Tier | File(s) | Contains | Changes per brand? |
|------|---------|----------|--------------------|
| Core primitives | `tokens/core.json` | Raw values: hex, px numbers | Never |
| Semantic tokens | `tokens/semantic.json` | Intent aliases (`{color.blue.600}`) | No — but values differ via brand overrides |
| Brand overrides | `tokens/brands/brand-*.json` | Only the tokens that differ | Yes — this is the brand identity |

---

## Why separate core from semantic?

A designer should never say "the button background is `#2563EB`." They should say "the button background is the *primary action background*, which happens to be blue for Brand A."

If you hard-code `#2563EB` in the semantic layer, swapping the brand means search-replacing hex values. That's fragile and error-prone.

If you point `action.primary.bg → {color.blue.600}`, swapping the brand means creating one override file that says `action.primary.bg → {color.neutral.900}`. One file, five lines. That's it.

---

## What headless means for components

A headless component contains zero hardcoded values. Here's a simplified button:

```css
.btn {
  background-color: var(--action-primary-bg);
  color:            var(--action-primary-fg);
  border-radius:    var(--action-primary-radius);
  padding:          var(--action-primary-padding-y) var(--action-primary-padding-x);
}
```

The same markup, the same class name, the same file — but with `data-brand="blue"` vs `data-brand="dark"` on a parent element, the button looks completely different.

---

## Why this matters for AI-assisted workflows

When an AI generates UI, it reaches for the nearest plausible value. Without a design system, it invents hex codes that are "close enough." With semantic token names wired into the AI's context, it uses `var(--action-primary-bg)` instead — so generated components are on-brand by construction, pass CI, and need no manual correction.

This is the foundation Step 9 builds on.

---

## What we build once

- The token pipeline (Style Dictionary)
- The headless components
- The Figma Variables structure

## What changes per brand

- One JSON file with 5–15 token overrides
- Nothing else
