# Recipe — Consume a Component

How to drop a headless component into your app.

---

## What you need

1. The generated brand CSS (`build/css/<brand>.css`)
2. The component CSS (`components/<component>.css`)
3. A parent element with `data-brand="<brand>"`

---

## Minimal setup

```html
<!-- 1. Load brand CSS (one per brand you support) -->
<link rel="stylesheet" href="path/to/design-system/build/css/blue.css" />

<!-- 2. Load component CSS -->
<link rel="stylesheet" href="path/to/design-system/components/button.css" />

<!-- 3. Wrap your UI in a brand scope -->
<div data-brand="blue">
  <button class="btn">Get started</button>
</div>
```

---

## Switching brands at runtime

`data-brand` can be set on any ancestor. All components inside update instantly — no JavaScript required.

```js
// Switch the whole page
document.documentElement.dataset.brand = 'dark';

// Switch a single section (e.g. a checkout panel)
document.querySelector('.checkout').dataset.brand = 'dark';
```

---

## Available components

| Class(es) | File | Token group |
|-----------|------|------------|
| `.btn` | `components/button.css` | `action.primary.*` |
| `.input` | `components/input.css` | `input.*` |
| `.card` · `.card-title` · `.card-body` | `components/card.css` | `card.*` |
| `.badge` · `.badge--success` · `.badge--error` | `components/badge.css` | `badge.*` |

---

## Using semantic tokens directly in your own CSS

Any CSS property can read a semantic token via `var()`. Token names map directly from the JSON path: `surface.page` → `--surface-page`.

```css
.my-header {
  background-color: var(--surface-page);
  padding:          var(--space-6);
  font-size:        var(--font-size-xl);
}
```

---

## What NOT to do

```css
/* Never — hardcoded values break brand switching */
.hero { background: #2563EB; border-radius: 8px; }

/* Always — semantic token references */
.hero { background: var(--action-primary-bg); border-radius: var(--action-primary-radius); }
```
