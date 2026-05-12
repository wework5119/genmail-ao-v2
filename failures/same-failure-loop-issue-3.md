# Same-failure loop — Issue 3

## Pattern

Issue 3 was rejected 2x by verifier for identical failures:
1. R refresh bug: `refresh()` effect never re-fires because `selectedAccountId` is unchanged after REFRESH dispatch. The builder didn't introduce a refresh counter state variable.
2. WCAG AA contrast: `text-tertiary #9ca3af` on white = 2.54:1. Tokens-level issue, not a per-surface CSS override.

## Root cause

The builder addressed neither failure between first and second dispatch. This suggests either:
a) The builder's remediation loop doesn't reproduce the verifier's exact attack before re-submitting
b) The builder doesn't have clear guidance on token-layer vs surface-layer fixes

## Mitigation

If 3rd re-verification also fails, P2 routes builder to investigator. After that, consider tightening builder_template.md to add:
- "Before re-submitting after a FAIL, reproduce every attack named in the verifier's reasoning and confirm it is fixed."
- "Token-layer fixes (colors, spacing, type) belong in tokens.ts, not in per-component overrides."

## Status

Open — waiting on 3rd verifier dispatch outcome.
