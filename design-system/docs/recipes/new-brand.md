# Recipe — Theme a New Brand

**Time:** ~30 minutes
**Prerequisites:** token pipeline working (`npm run build-tokens` exits 0)

---

## Step 1 — Create the brand override file

Create `tokens/brands/brand-<name>.json`. Include **only** the tokens that differ from semantic defaults.

```json
{
  "$schema": "https://tr.designtokens.org/format/",
  "$description": "Brand C — Green Minimal.",

  "action": {
    "primary": {
      "bg":       { "$value": "{color.green.500}", "$type": "color" },
      "bg-hover": { "$value": "{color.green.700}", "$type": "color" },
      "fg":       { "$value": "{color.neutral.0}", "$type": "color" },
      "radius":   { "$value": "{radius.sm}",       "$type": "dimension" },
      "shadow":   { "$value": "{shadow.none}",      "$type": "shadow" }
    }
  },

  "surface": {
    "page": { "$value": "{color.green.100}", "$type": "color" }
  }
}
```

**Rules:**
- Only override tokens that change — omit everything else
- Use `{alias.path}` references — never raw hex or px values
- The filename `brand-<name>.json` determines the CSS scope `[data-brand="<name>"]`

---

## Step 2 — Build

```sh
cd design-system
npm run build-tokens
```

A new `build/css/<name>.css` appears automatically. No config changes needed anywhere.

---

## Step 3 — Check contrast

```sh
npm run check-contrast
```

Fix any WCAG AA failures before continuing.

**Common issue:** light background + light action colour → increase the colour step, e.g. `.500` → `.700`.

---

## Step 4 — Add Storybook brand entry

Open `.storybook/preview.js` and:

1. Import the new CSS: `import '../build/css/<name>.css';`
2. Add a toolbar entry in `globalTypes.brand.toolbar.items`:
   ```js
   { value: '<name>', title: 'Brand C — Green Minimal' }
   ```

---

## Step 5 — Open a PR

Follow the governance rules in `07-governance.md`. The CI pipeline runs `build-tokens`, `check-contrast`, `generate-docs`, and `build-storybook` automatically.

---

## Step 6 — Push to Figma (optional)

After merge, add the new mode to the Semantic collection in Figma:
1. Open the Semantic collection → click **+** next to the mode header
2. Name it (e.g. "Green")
3. For each Semantic variable set the new mode's alias to the appropriate Core variable

See `06-figma-variables.md` for the full Figma Variables reference.
