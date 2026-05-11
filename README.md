# genmail-ao-v2

AO test bed for **Charter v5** schema. Builds a cross-platform desktop
email client on **Electron** where **design quality is a primary north
star** alongside feature parity.

## What this is

A dedicated GitHub repo + dedicated VM running an autonomous org that
builds a cross-platform desktop email client (macOS + Windows + Linux)
on Electron, mirroring **mobile Genmail's features** but holding itself
to a desktop-class **visual bar** measured against Linear / Things 3 /
Superhuman / Raycast / Arc.

The `.foundry/` directory contains the v5 charter spec — see the design
at [backend/autonomous_org/CHARTER_V5/](https://github.com/wework5119/gen-spark/tree/main/backend/autonomous_org/CHARTER_V5).

## North star (two-headed)

1. **`dogfood_substitution_7d`** — operator uses the client as their only
   email tool for 7 continuous days.
2. **`design_score_v1`** — composite of Visual Hierarchy / Restraint /
   Polish, scored 0–10 by the verifier on every visible-UI shipment.
   **Mission gate**: `min(VH, R, P) ≥ 8` to count as `done`.

See `.foundry/mission.md` for the full rubric.

## Stack (fixed)

- **Electron** main + preload + renderer.
- **Renderer**: React 18 + TypeScript + Vite + Tailwind CSS, with a
  design-tokens layer (no hardcoded colors / font sizes / spacing).
- **Build/package**: `electron-vite` for dev, `electron-builder` for
  production binaries.
- **Tests**: Vitest (unit) + Playwright (e2e via Chromium DevTools
  Protocol on the substrate Chrome at :9222).

Alternative stacks (Tauri, Wails, native, Flutter desktop) are
explicit non-goals — see `.foundry/mission.md`.

## Status

Charter v5 runtime is in development. Until v5 loader feature flag
lands, this repo's `.foundry/` directory is treated as pre-bootstrap
by the current V4 loader (no `states.yaml`), so the org enters
`pre_registration` lifecycle and waits for either a V4 bootstrap PR
or v5 runtime to ship.

PR #27299 (merged) cleared the env-var auth migration that blocked
fresh-project registration. Next step: register this org via
`backend/autonomous_org/scripts/register_genmail_v2_ao.py` (will be
renamed to `register_genmail_ao_v2.py`) against dev backend.

## Files

```
.foundry/
├── mission.md             two-headed north star + design rubric
├── strategist.md          singleton strategist prompt (design-score tracking)
├── builder_template.md    Electron + design-first builder skeleton
├── verifier_template.md   per-issue verifier with DESIGN_AXES gate
├── tools.yaml             tier + authorized_kinds (incl. macos_notarize, etc.)
├── runtime.yaml           Electron-aware secrets + concurrency_target=18
└── principles.md          inherit framework v5 + G1 privacy + G2 release human-gate
```
