# Design System Governance

One page. If a rule doesn't fit here, it's too complex.

---

## Source of truth

**Code in Git is canonical.** Figma Variables, generated CSS, and Storybook all
derive from the token JSON files in `design-system/tokens/`. If Figma and code
disagree, code wins — always push code → Figma, never the reverse.

---

## Proposing a change

| Step | Action |
|------|--------|
| 1 | Branch from `main` (`feat/`, `fix/`, or `chore/` prefix) |
| 2 | Edit token JSON or component CSS |
| 3 | `npm run build-tokens` — must exit 0 |
| 4 | `npm run check-contrast` — no new AA failures |
| 5 | Open a PR; at least one reviewer must approve |
| 6 | CI runs automatically — all checks must be green |
| 7 | Merge to `main` |

**Never commit directly to `main`.** Never skip `check-contrast`.

---

## Versioning (semver)

| Change | Bump |
|--------|------|
| Rename or remove a semantic token | **MAJOR** |
| Add a new semantic token | MINOR |
| Change a primitive value (colour tweak, size nudge) | PATCH |
| Add a new brand file | MINOR |
| Add a new component | MINOR |
| Typo fix in a token name | **MAJOR** — renames are breaking |

---

## Automated CI checks (every PR touching `design-system/`)

| Check | Command | Fails if |
|-------|---------|---------|
| Token build | `npm run build-tokens` | Style Dictionary error or broken alias |
| WCAG contrast | `npm run check-contrast` | Any semantic bg/fg pair below 4.5:1 AA |
| Token docs | `npm run generate-docs` | Script error (docs must stay in sync with tokens) |
| Storybook build | `npm run build-storybook` | Stories fail to compile |

Run the full suite locally before pushing:

```sh
cd design-system
npm run build-tokens && npm run check-contrast && npm run generate-docs
```

---

## Adding a new brand

1. Create `tokens/brands/brand-<name>.json` with only the tokens that differ
2. `npm run build-tokens` → `build/css/<name>.css` appears automatically
3. `npm run check-contrast` → verify new brand passes WCAG AA
4. PR with brand file + Storybook global-types update
5. After merge, push Figma Variables via MCP (see `06-figma-variables.md`)

Full recipe: `docs/recipes/new-brand.md`

---

## Rules we never break

- No raw hex, px, or rgba values in `semantic.json` or brand files — aliases only
- No hardcoded values in component CSS — semantic `var()` tokens only
- Figma is never the source of truth — push direction is always code → Figma
- No `ALL_SCOPES` on Figma variables — use specific scopes per token intent
