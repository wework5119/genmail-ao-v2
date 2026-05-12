# Plan: Issue 1 — Boot scaffold

## Assessment
The scaffold is already fully implemented:
- `package.json` with all dependencies (Electron, React 18, Vite, Tailwind, Vitest, ESLint, Prettier)
- `electron.vite.config.ts` — main/preload/renderer build config
- `vite.config.ts` — vitest config with jsdom
- `tailwind.config.ts` — imports tokens from `src/renderer/src/styles/tokens.ts`
- `postcss.config.js` — Tailwind + autoprefixer
- `.eslintrc.cjs` + `.prettierrc` — linting configs
- `electron-builder.yml` — win/mac/linux packaging
- `src/main/index.ts` — Electron main process window creation
- `src/preload/index.ts` — contextBridge preload
- `src/renderer/index.html` — HTML entry point
- `src/renderer/src/main.tsx` — React root mount
- `src/renderer/src/App.tsx` — placeholder component using token-based classes
- `src/renderer/src/styles/tokens.ts` — full design tokens (colors, typography, spacing, elevation, radius, motion)
- `src/renderer/src/styles/globals.css` — Tailwind directives + CSS custom properties
- `tests/placeholder.test.ts` — passing Vitest placeholder
- `resources/icon.png` — placeholder icon

## Verification steps
1. `pnpm install` — ensure deps are installed
2. `pnpm test` — Vitest passes (1/1)
3. `pnpm lint` — ESLint zero warnings
4. `pnpm typecheck` — TypeScript both main + renderer
5. `pnpm exec electron-vite build` — produces `dist/` with main/preload/renderer
6. Check `dist/renderer/assets/` for token-resolved CSS

## After verification
1. Create branch `issue-1-scaffold`
2. Commit all work
3. Push and open PR against `main`
4. POST state_transition → built

## Token design decisions (from notes.md)
- Neutral palette: warm gray (stone-family #fafafa → #171717)
- Accent: Tailwind blue-50..900 (#eff6ff → #1e3a8a)
- Danger: Tailwind red-50..900 (#fef2f2 → #7f1d1d)
- Success: Tailwind green-50..900 (#f0fdf4 → #14532d)
- Type ramp: 11 steps, 10px–32px (designed for dense email display)
- Spacing: 4px base, 8-pt rhythm
- Elevation: 5-level scale (none/low/medium/high/modal)
- Motion: 3 durations (fast/standard/slow)
