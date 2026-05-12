# Token contrast WCAG AA validation

## Observation

Issue 3's verifier FAIL (02:25:00) identified `text-tertiary #9ca3af` on white background = 2.54:1 contrast ratio. WCAG AA requires 4.5:1 for normal text and 3:1 for large text (≥18px or ≥14px bold).

#9ca3af is a Tailwind gray-400 equivalent. For text usage at 12-14px (snippet preview, timestamp), it fails AA by a wide margin.

## Recommendation

Replace text-tertiary with a darker neutral that meets 4.5:1 on white:
- Current: `#9ca3af` (gray-400) — 2.54:1 on white
- Minimum needed: ~`#6b7280` (gray-500) — 4.63:1 on white ✅
- Recommended: `#6b7280` for tertiary text, keep `#9ca3af` for disabled/placeholder states only

This fix belongs in the tokens layer (issue 1's tokens.ts) and automatically resolves the design gate for all downstream UI issues.
