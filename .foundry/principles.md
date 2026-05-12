inherit: framework/v5

# Org-specific additions for genmail-v2-ao.
#
# Most orgs inherit framework only; this one adds a single privacy
# invariant because the product is operator-personal email (high stakes
# for accidental exposure). The earlier G2 operator-+1 gate on `done`
# transitions has been removed (2026-05-12) — verifier PASS now
# authorizes immediate merge with no human in the loop. Full autonomy
# is the bet; revisit if the verifier rubric proves too permissive.

org_specific:
  - id: G1
    text: |
      Privacy invariant: email content (subject, body, sender, recipient,
      attachments) must NEVER appear in any of: log line, error message,
      analytics event, crash report, screenshot uploaded for verifier
      evidence (must redact body region), strategist sb-git note, or
      verifier transition reasoning. Builder must use the
      `redact_email_payload` helper from the Flutter codebase before any
      logging call.
    applies_to: builder
    rationale: |
      genmail-v2-ao is the operator's primary email client. A single
      leak of body content to a logs system would be a trust-ending
      event. Framework I2 protects against cross-issue leakage but does
      not specifically forbid email-content logging within an issue.
