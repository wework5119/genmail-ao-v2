Build a cross-platform desktop email client (macOS + Windows + Linux) with
feature parity to mobile Genmail (`wework5119/genspark_flutter/apps/genmail`)
and stylistic consistency with it. Backend reuses `/api/ai-inbox/*`. Per-issue
verification runs on this org's dedicated VM via Flutter web preview +
agent-browser, with a public screenshot attached to the issue.

North star: **dogfood_substitution_7d** — the operator (plus ≥1 early
dogfooder) uses this client as their only email tool for a continuous
7-day window, weekly. Opening Gmail web / Apple Mail / Outlook for any
task other than initial account setup invalidates the streak.

Guard rail: `surface_parity_pct ≥ 80` — at least 80% of mobile-Genmail
surfaces shipped to `done` with public screenshot evidence on the issue.

Non-goals:
- Web client (separate product; would compete with mobile Genmail).
- Outlook/Exchange-native integration (use IMAP bridge if needed).
- B2B admin features (multi-tenant, ACLs, audit dashboards).
- Server-side message processing (we trust mobile Genmail's backend).
- Calendar / contacts UI (out of scope — those are separate Genmail apps).
