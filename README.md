# genmail-v2-ao

AO test bed for **Charter v5** schema. Direct comparison to the
existing `wework5119/genmail-ao` (V4 charter, running on shared
zero-001) — same north star, same product target, different charter
shape.

## What this is

A dedicated GitHub repo + dedicated VM running an autonomous org that
builds a cross-platform desktop email client (macOS + Windows + Linux)
mirroring mobile Genmail.

The `.foundry/` directory here contains the v5 charter spec — see the
design at
[backend/autonomous_org/CHARTER_V5/](https://github.com/wework5119/gen-spark/tree/main/backend/autonomous_org/CHARTER_V5).

## Status

Charter v5 runtime is **in development** — the loader feature flag,
AOStewardAgent pre_registration wiring, and image v0.7 with substrate
skills are all planned but not yet shipped. Until those land, this
repo's `.foundry/` directory is treated as **pre-bootstrap** by the
current V4 loader (which expects a `states.yaml` it won't find here),
so the org enters `pre_registration` lifecycle and waits for the
operator to author a V4-compatible bootstrap PR via the existing
architect chat — OR for v5 runtime to ship and recognize this charter
natively.

In other words: this repo is the **target shape**. The org provisions
its VM and registers in pre-bootstrap state today; it goes fully
operational when either (a) someone hand-merges a V4 bootstrap PR, or
(b) v5 runtime PRs land.

## Files

```
.foundry/
├── mission.md             dogfood_substitution_7d north star
├── strategist.md          singleton strategist prompt (P8 VM_STATUS handling)
├── builder_template.md    per-issue builder skeleton (per I6 session persistence)
├── verifier_template.md   per-issue verifier skeleton (I2 isolation enforced)
├── tools.yaml             tier + authorized_kinds (3-layer P6 authorization)
├── runtime.yaml           provisioning intent + concurrency_target=18
└── principles.md          inherit framework v5 + G1 privacy + G2 release human-gate
```

## Comparison with genmail-ao (V4)

See [COMPARISON.md in the gen-spark design](https://github.com/wework5119/gen-spark/blob/main/backend/autonomous_org/CHARTER_V5/examples/genmail-v2-ao/COMPARISON.md)
for full file-by-file diff with rationale.

Headline differences:

| | `genmail-ao` (V4) | `genmail-v2-ao` (V5) |
|---|---|---|
| `.foundry/` files | 8 | 7 |
| Role kinds | 4 (publisher present) | 3 (publisher collapsed into builder's final action) |
| `roles.yaml` | yes | none — strategist is singleton MD, builder/verifier are templates |
| `states.yaml` | transitions + FSM gate | none — state labels only |
| VM | shared zero-001 | dedicated VM (1:1 invariant) |
| Tool authz | implicit | explicit 3-layer (tier + authorized_kinds → per-issue allowlist → prompt visibility) |
| Per-issue session | new per dispatch | persisted (I6) |

## Comparison test

Once v5 runtime lands and this org goes operational, run alongside
genmail-ao for 4 weeks and compare on 4 axes:

1. **Throughput** — issues `done` / week
2. **Verifier reject rate** — `built → built` vs `built → verified`
3. **Operator load** — `human-gate` events / week
4. **Strategist context efficiency** — token cost per heartbeat as issue count grows

Decision criteria after 4 weeks:
- v5 wins majority axes → migrate genmail-ao to v5
- v5 loses on something concrete → patch v5 framework or revisit specific principle
