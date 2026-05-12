# Issue 7: Thread Detail View — Design Notes

## Design References Studied

### Superhuman — Message Reading Pane
- Left sidebar: thread list (narrow, 320px)
- Right content area: message detail
- Sender avatar (24px circle, initials) + name in semibold
- Timestamp: right-aligned, 12px, muted
- HTML body: clean rendering, subtle border separating messages
- "Show images" button appears as a small pill above HTML content
- No line between messages — just spacing (16px) + subtle bottom border on header

### Linear — Issue Detail
- Sticky header with back arrow + title
- Back via Escape or clicking back arrow
- Skeleton loading (pulsing rectangles matching content layout)
- Clean metadata bar below header
- Content area scrolls independently

## Design Decisions

### Layout
- Thread detail fills the right content area (same as inbox list area — we're not doing split-pane for this surface)
- Header: sticky at top, contains back button + subject line
- Content area: scrollable list of messages
- Each message is separated by vertical rhythm (24px) with a thin border separator

### Typography
- Subject header: 14px, font-semibold
- Sender name: 13px, font-semibold, text-primary
- Timestamp: 11px, text-tertiary
- Body: 13px/1.5, text-primary for HTML, 13px/1.5 font-mono for plain text
- Metadata bar: 11px, text-tertiary
- To/CC: 11px, text-tertiary

### Spacing
- 8-pt rhythm (4, 8, 12, 16, 24, 32)
- Message padding: 24px horizontal, 16px vertical
- Between messages: 4px (just a hair of separation)
- Header padding: 12px 24px

### Colors
- Accent: #3b82f6 (for links, unread)
- Surface: white
- Text primary: #0a0e1a
- Text secondary: #4b5563
- Text tertiary: #9ca3af
- Border: #eef0f2

### Component Architecture
- `ThreadDetailView` — orchestrator, fetches messages, renders metadata + message list
- `MessageBubble` — individual message (header + body)
- `MessageHeader` — avatar, name, timestamp, to/cc
- `ThreadMetadataBar` — count, participants, date range
- `MessageBody` — handles HTML sanitization, plain text, image toggle
- `SkeletonLoader` — loading placeholder

### Data Flow
1. User clicks thread in inbox → InboxContext sets selectedThreadId + switches view to 'thread'
2. ThreadDetailView mounts → calls getMessages with threadId + pagination params
3. Messages returned sorted oldest-first
4. User scrolls to top → load older messages (pageTokens)
5. Back button / Escape → switch view back to 'inbox', preserving scroll position

### HTML Sanitization
- Use DOMParser to parse HTML
- Remove script tags, event handlers, iframes
- Block external images by default (replace src with data:placeholder)
- "Show images" toggle replaces placeholders with actual URLs
- Sanitize links to open in external browser (target=_blank, rel=noopener)

### Pagination
- Add pageParams to getMessages IPC channel
- Default pageSize: 20
- Infinite scroll at top (IntersectionObserver on a sentinel element)
