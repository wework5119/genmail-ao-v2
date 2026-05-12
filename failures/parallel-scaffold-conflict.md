# Failure Pattern: Parallel Scaffold Conflict

**Date**: 2026-05-12  
**Scope**: Issues #1, #3, #9, #10 — 4 out of 5 non-IPC PRs permanently blocked  
**Root cause class**: concurrent-branch-isolation failure (no depends_on enforcement)

---

## What happened (twice)

### Wave 1 — Issues #1, #2, #3 dispatched concurrently

Orchestrator dispatched builders for #1 (scaffold), #2 (IPC bridge), and #3 (inbox) in parallel. All three builders scaffolded the full project independently:

- Each created `package.json`, `pnpm-lock.yaml`, `electron.vite.config.ts`, `tailwind.config.ts`, `src/` tree
- PR #6 (#2 IPC bridge) merged first — it restructured `src/` → `app/src/` and became the canonical layout
- PR #5 (#1 scaffold) and PR #4 (#3 inbox) were CONFLICTING from that point forward
- Both verifier-PASS'd but are permanently unmergeable without human rebase

**Shipped**: 1 of 3 (PR #6)  
**Wasted**: 2 full build-verify cycles (PR #5 scaffold, PR #4 inbox)

### Wave 2 — Issues #9, #10 dispatched while #7 was in-flight

Orchestrator dispatched builders for #9 (compose) and #10 (search) while PR #8 (#7 thread detail) was still in `built` state being verified.

- PR #8 merged (adds `ThreadDetailView`, extends `channels.ts`, `ipc-handlers.ts`, `App.tsx`)
- PR #12 (#9 compose) and PR #13 (#10 search) both branched from pre-#8 main
- Both conflict on `channels.ts`, `ipc-handlers.ts`, `App.tsx`, `package.json`, `pnpm-lock.yaml`
- #9 verifier PASS (VH=8 R=8 P=8 min=8); #10 verifier PASS (after builder retry fixing backdrop and contrast)
- Both permanently unmergeable without human rebase

**Shipped**: 1 of 3 (#7 thread detail)  
**Wasted**: 2 more full build-verify cycles (PR #12 compose, PR #13 search)

---

## The structural cause

The orchestrator's **dispatch policy has no serial gate**. It fires builders as soon as issues enter `proposed` state, with no awareness of in-flight PRs that touch overlapping files. In a monorepo with a single `App.tsx`, `channels.ts`, and `ipc-handlers.ts`, any two simultaneous UI-feature builders will conflict.

The `depends_on` field in issue bodies **exists** (issues #9 and #10 both declare `depends_on: [#1, #3, #7]`) but the orchestrator does not enforce it — it dispatches anyway.

---

## Total waste accounting (this project, day 1)

| PR | Issue | Verifier result | Mergeable | Status |
|----|-------|-----------------|-----------|--------|
| #4 | #3 inbox | PASS (VH=8 R=9 P=8) | CONFLICTING | blocked |
| #5 | #1 scaffold | PASS | CONFLICTING | blocked |
| #6 | #2 IPC bridge | (no design gate) | MERGED | done |
| #8 | #7 thread detail | PASS (VH=8 R=9 P=8) | MERGED | done |
| #12 | #9 compose | PASS (VH=8 R=8 P=8) | CONFLICTING | blocked |
| #13 | #10 search | PASS (VH=8 R=8 P=8) | CONFLICTING | blocked |

**2 of 6 PRs shipped. 4 wasted.** Each wasted PR consumed ~1 builder dispatch + ~1-2 verifier dispatches = ~6-10 total role-dispatches burned.

---

## Why "rebase before opening PR" doesn't fully solve it

If builder rebases before opening PR, and another builder's PR merges between builder's rebase and the verifier's merge attempt, the PR is still conflicted. The only guaranteed fix is **serial dispatch** for issues that share files.

---

## Recommended fixes (in priority order)

### Fix 1: Orchestrator enforces `depends_on` as serial gate (highest impact)
If issue body contains `depends_on: [#X]`, orchestrator MUST NOT dispatch builder for this issue until all `#X` issues are in `done` state. This is a pure orchestrator policy change — no builder/verifier changes needed.

### Fix 2: Builder rebase just before opening PR (defense in depth)
Even without serial gating, a late rebase reduces the conflict window from "entire build duration" to "time between rebase and verifier merge attempt." Builder template should include: "fetch origin/main; rebase on main; resolve conflicts; THEN open PR."

### Fix 3: Verifier rebase attempt before merge (last-mile defense)
If verifier detects `CONFLICTING` on `gh pr merge`, verifier should attempt `git rebase origin/main` on the branch, re-run tests, and re-merge. This handles the race between rebase and merge but requires verifier to have write access to the branch.

### Fix 4: Strategist holds next wave until all in-flight issues reach `done`
As a temporary protocol (until Fix 1 lands), strategist should NOT open new issues if any issue is in `built` or `verified` state with an in-flight PR. This reduces throughput but eliminates wasted cycles.

---

## Decision this heartbeat (2026-05-12 heartbeat 3)

**Fix 4 adopted now**: DO NOT open new feature issues this wave. The 4 blocked PRs (#4, #5, #12, #13) represent fully-designed, verifier-PASS'd work. They need operator rebase, not new parallel work.

**Fix 1 recommended**: Strategist will add `depends_on` enforcement as a meta-issue for orchestrator improvement.

New issues opened this heartbeat: see `/strategy/2026-05-12-heartbeat-3.md`.

---

## Pattern fingerprint for future strategist cycles

If you see:
- Multiple issues in `blocked` state with label "blocked"
- All blocked on "merge conflicts" not design failures
- Pattern coincides with a recently-merged PR that touched shared files

...then you are in this failure mode. **Do not open more issues** until the blocked ones are rebased and merged or explicitly closed by operator. Serial resolution is the only fix.
