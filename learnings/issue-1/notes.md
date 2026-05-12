# Issue 1 — Boot scaffold

## Decisions

### Project structure
- Followed `electron-vite` conventions: `src/main/`, `src/preload/`, `src/renderer/`.
- Renderer source code lives in `src/renderer/src/` with `@/` alias pointing there.
- Design tokens at `src/renderer/src/styles/tokens.ts` per issue body spec.
- Tailwind config at root, imports tokens via relative path.

### Design tokens
- Neutral palette matches Tailwind's `stone` family (warm gray), not `slate` (cool gray) or `gray` (pure gray). This aligns with Linear's aesthetic.
- Accent is blue (#3b82f6), danger is red, success is green — all via Tailwind's stock 50-900 scales.
- Type ramp: 11 steps from 10px to 32px, following the "smaller than typical desktop" convention (desktop email benefits from denser information display).
- Spacing follows 4px base unit with 8-pt rhythm for the major steps.
- Elevation: 5-level scale (none/low/medium/high/modal) matching Material-style elevation.
- Motion: 3 durations (fast/standard/slow) with spring easing for interactive elements.

### Tailwind integration
- `tailwind.config.ts` imports from `tokens.ts` directly.
- All utility classes in JSX resolve through tokens — no hardcoded hex values.
- Extended `theme` with our token values, overriding Tailwind defaults where they overlap.

### Build pipeline
- `electron-vite` handles dev (with HMR) and production builds.
- Single `vite.config.ts` for Vitest tests; `electron.vite.config.ts` for the app.
- `electron-builder.yml` configured for win/mac/linux targets.

## Files created
- `package.json` — dependencies and scripts
- `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json` — TypeScript configs
- `electron.vite.config.ts` — electron-vite build config
- `vite.config.ts` — vitest config
- `tailwind.config.ts` — Tailwind referencing tokens
- `postcss.config.js` — PostCSS with Tailwind + autoprefixer
- `.eslintrc.cjs`, `.prettierrc` — linting/formatting
- `electron-builder.yml` — production packaging
- `src/main/index.ts` — Electron main process
- `src/preload/index.ts` — preload script
- `src/renderer/index.html` — HTML entry
- `src/renderer/src/main.tsx` — React entry
- `src/renderer/src/App.tsx` — placeholder component
- `src/renderer/src/styles/tokens.ts` — design tokens
- `src/renderer/src/styles/globals.css` — Tailwind directives + CSS vars
- `src/renderer/src/env.d.ts` — type declarations
- `tests/placeholder.test.ts` — placeholder test
- `resources/icon.png` — placeholder icon
- `.gitignore`

## Verification
- `pnpm test` — 1/1 passing
- `pnpm lint` — 0 warnings
- `pnpm typecheck` — both main and renderer pass
- `pnpm exec electron-vite build` — produces dist/ with main, preload, renderer
- Design tokens verified in built CSS: `text-4xl: 24px`, `text-md: 14px`,
  `shadow-elevation-low` resolves to token values, etc.
