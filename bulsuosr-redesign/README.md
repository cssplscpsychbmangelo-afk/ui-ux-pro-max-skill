# BulSU OSR — institutional redesign (working copy)

This folder is the durable mirror of the Bulacan State University **Office of the
Student Regent** website redesign. The real deliverable lands in the
`cssplscpsychbmangelo-afk/bulsuosr` repository at `OSR/osr-website/index.html`;
this copy exists so the work survives a sandbox reset, because that repository
rejects pushes from this session's credentials (`HTTP 403`, while the API still
reports admin rights).

## What changed, in one paragraph

The single-page app is the same architecture as before — hash routes, one inline
`<script>` engine, one `js/cms-integration.js` for live CMS data — but the visual
and semantic layer was rebuilt: a real token system (`--color-*`, `--space-*`,
`--text-*`, `--radius-*`) instead of scattered hex values, an editorial
institutional layout instead of a dashboard grid, one component vocabulary
(buttons, badges, cards, feeds, chips, filters) instead of per-page variants,
44×44 minimum hit targets, visible focus rings, `prefers-reduced-motion`
support, a keyboard-trapped dialog set (drawer / command palette / record
dialog), and a "More" disclosure that keeps the primary nav at five routes.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The assembled, shipping page — byte-for-byte what was tested (448 KB, CSS and JS inline except `js/cms-integration.js`). |
| `design-system.html` | The design system reference page served at `/design-system.html`: live colour swatches, measured contrast ratios, type and space scales, component specimens and the enforced rules. It reads the same stylesheet, so it cannot drift. |
| `rebuild/osr.css` | The design system source (1115 lines, 19 numbered sections). Inlined into `index.html` by `rebuild/assemble.py`. |
| `rebuild/head.html` | `<head>`: meta, Open Graph, tab-identity link order, self-hosted Bricolage wordmark face, opening `<style>`. |
| `rebuild/body1.html` … `rebuild/body5.html` | Body markup split by page group: chrome + home · archive pages · about/help/track/calendar · Build Your Ideal BulSU · footer + overlays. |
| `rebuild/block1.js` … `rebuild/block4.js` | The patched inline scripts (engine, guides/CMS-guide layer, small helpers, build-CTA). |
| `rebuild/patch2.py`, `rebuild/dialog-module.js`, `rebuild/style-map.json` | The deterministic patch that turns the original upstream `block1.js` into the patched one: focus management, route normalisation, category chips, saved-only filtering, stepper semantics, and the inline-style → class mapping. |
| `rebuild/assemble.py` | Rebuilds `index.html` from the parts above. |
| `rebuild/smoke.mjs` | jsdom smoke test: renders the page, walks every route, asserts lists/rows/tabs render, reports console errors. Needs `jsdom` (installed at `OSR/` root in the source repo). |

## Rebuilding

`rebuild/` holds the parts (named so that this repository's `build/` ignore rule
does not swallow them). `rebuild/assemble.py` rebuilds `index.html`;
`rebuild/refresh-design-system.py` re-inlines the current `osr.css` into
`design-system.html`; `rebuild/smoke.mjs` and `rebuild/ds-check.mjs` render both
pages in jsdom, walk every route, and report console errors.

```bash
# 1. put the pieces back in a checkout of the real repository
cp index.html /path/to/bulsuosr/OSR/osr-website/index.html
cd /path/to/bulsuosr && node OSR/osr-website/netlify-build.mjs   # refreshes _redirects + osr-netlify.zip
# 2. the repository's own test suite (71 assertions, 14 files)
cd OSR/server && npm test
# 3. serve it
cd ../osr-website && python3 -m http.server 8080 --bind 0.0.0.0
```

`rebuild/assemble.py` regenerates `index.html` from `head.html` + `osr.css` +
`body1–5.html` + `block1–4.js`; it reports inline-style count, duplicate ids and
the heading sequence, and all three must come back clean (0 inline styles,
no duplicates).

## Rules that the tests pin (do not "tidy" these)

- Media queries are written unspaced: `@media(max-width:640px){`.
- `.toast-wrap` keeps `width:min(420px, calc(100vw - 24px))`; `.toast` keeps `max-width:100%`.
- `#calGrid` must **not** carry the `hidden` attribute — inline `style.display`
  from `renderCalendar()` drives it; `#calEmpty` does use `hidden`.
- The pulse builder keeps the literals `const PULSE_CATEGORIES = [` and
  `// prevent exceeding 10 already handled via disabled plus`, plus
  `#pulseShowResult{flex:1 1 auto; min-width:0}` / `#pulseReset{flex:0 0 auto}`.
- The About page keeps its exact badge/intro strings and the admin sign-in is
  never pre-filled.
- `favicon.svg` is the single source of truth for the tab icon; the ICO and PNGs
  are generated from it by `osr-website/tools/make-tab-icons.mjs --check`.
