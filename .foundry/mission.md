Build a cross-platform desktop email client (macOS + Windows + Linux) on
**Electron**, where **design quality is a primary product surface — not a
nice-to-have decoration**. Feature parity with mobile Genmail
(`wework5119/genspark_flutter/apps/genmail`); backend reuses
`/api/ai-inbox/*`. Per-issue verification on this org's dedicated VM via
the Electron app's renderer process + Chromium DevTools Protocol +
public screenshot evidence attached to the issue.

## North star (two metrics, jointly tracked)

1. **`dogfood_substitution_7d`** — operator (plus ≥1 early dogfooder) uses
   this client as their only email tool for a continuous 7-day window,
   weekly. Opening Gmail web / Apple Mail / Outlook / Superhuman for any
   task other than initial account setup invalidates the streak.

2. **`design_score_v1`** — composite of three signals, each judged by an
   independent verifier instance per shipped surface:
   - **Visual hierarchy** (0–10): can the eye locate the next intended
     action within 300 ms; primary/secondary actions visually weighted
     correctly; text contrast ≥ WCAG AA on every state.
   - **Restraint** (0–10): zero gradient-soup; ≤2 accent colors per
     screen outside imagery; spacing follows an 8-pt rhythm; no
     decorative borders that don't serve hierarchy.
   - **Polish** (0–10): motion at 60 fps, easing curves tasteful (no
     `ease-in-out` linear blandness), focus rings deliberate, copy
     edited (no engineering placeholder strings), empty states designed.

   Each issue ships with verifier emitting these three scores. **Mission
   gate**: a shipped surface with `min(visual_hierarchy, restraint,
   polish) < 8` is not considered shipped — it goes back to `built →
   built` for design polish.

## Reference baseline (what "good" looks like)

We are building in the company of **Linear, Things 3, Superhuman,
Raycast, Arc**. The bar is not "looks fine" — the bar is "operators
brag about how it feels". When a builder is unsure whether a surface
clears the bar, the test is: would this UI choice survive a Twitter
post screenshot side-by-side with the same surface in Linear? If not,
iterate.

Mobile Genmail is the **feature** reference (what surfaces exist, what
data flows look like). It is NOT the **visual** reference — the desktop
has more screen real estate, keyboard-first interaction, and a
different aesthetic register (less dense than mobile, more deliberate
typography).

## Non-goals

- Web client (separate product; would compete with mobile Genmail).
- Outlook/Exchange-native integration (use IMAP bridge if needed).
- B2B admin features (multi-tenant, ACLs, audit dashboards).
- Server-side message processing (we trust mobile Genmail's backend).
- Calendar / contacts UI (out of scope — separate Genmail apps).
- **"Functional but ugly" iterations**. We do not ship a screen and
  "come back to polish it" — design quality gates merge.
- Tauri / Wails / native AppKit / WinUI / Qt. Stack is fixed: Electron.
