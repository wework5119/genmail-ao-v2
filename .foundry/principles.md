inherit: framework/v5

# Org-specific additions for genmail-v2-ao.
#
# Most orgs inherit framework only; this one adds two principles
# because the product is operator-personal email (high stakes for
# accidental exposure) and ships as signed binaries (irreversible).

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

  - id: G2
    text: |
      All `external-mutation` calls in the `done` transition (PR merge,
      release publish, app signing) require an explicit operator
      `+1` reaction on the issue before builder executes them. The
      verifier PASS verdict authorizes the *intent* to ship; the
      operator `+1` authorizes the *execution*. This is an additional
      human-gate beyond framework's automatic `verified → done` flow.
    applies_to: builder
    rationale: |
      Released binaries are extremely hard to recall (signed updates
      propagate to users' machines). Wrong release = trust event +
      support burden. Operator stays in the loop until automation
      track record justifies removing this gate (planned: revisit
      after 50 issues shipped without operator-blocked execution).
