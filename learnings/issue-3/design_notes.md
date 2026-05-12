# Design Notes — Issue 3

## References

### Superhuman Inbox
- Sender name: bold, 14px
- Subject: regular weight, 14px
- Preview: muted, 13px
- Unread dot: filled blue circle, 8px, left-aligned
- Timestamp: right-aligned, muted, relative
- Selected row: light blue highlight

### Linear Account Picker
- Minimal dropdown with avatar circle + name + email
- Chevron icon rotates on open
- Smooth dropdown shadow
- Checkmark on selected account

## Token Application
- fontFamily.sans for all text
- fontSize.sm (13px) for sender, base (14px) for subject
- fontSize.xs (12px) for preview
- fontSize.2xs (11px) for timestamp
- spacing.4 (16px) for horizontal padding in rows
- spacing.3 (12px) for vertical padding in rows
- accent.500 for unread dot and primary interactions
- neutral.100 for hover states
- accent.50 for selected row
- border.border for row separators

## Score Self-Assessment (pre-flight)
- Visual Hierarchy: 8 — clear sender → subject → preview hierarchy
- Restraint: 9 — no decorative elements, minimal color usage
- Polish: 8 — smooth transitions, thoughtful spacing, empty state
