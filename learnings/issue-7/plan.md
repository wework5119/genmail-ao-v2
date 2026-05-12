# Issue 7: Thread Detail View — Plan

## Approach

### Phase 1: Scaffold Inbox UI (dependency from issue #3)
1. Create Tailwind configuration + PostCSS setup + globals.css + tokens.ts
2. Add renderer types that bridge IPC schema with UI needs
3. Build InboxContext (useReducer + Context) managing both inbox and thread-detail views
4. Create IPC lib for renderer (`lib/ipc.ts`)
5. Build components: AccountPicker, ThreadRow, ThreadList
6. Wire up App.tsx with view switching

### Phase 2: Thread Detail View (issue #7 core)
7. Add pagination support to `getMessages` IPC channel (add pageParams)
8. Update preload, main ipc-handlers, ipc/channels.ts
9. Build ThreadDetailView (orchestrator with fetch logic, skeleton states)
10. Build MessageHeader (avatar, name, timestamp, to/cc)
11. Build MessageBody (sanitized HTML, plain-text mono, image toggle, quoted collapse)
12. Build ThreadMetadataBar (count, participants, date range)
13. Wire back-navigation and keyboard (Escape) support

### Phase 3: Polish & Test
14. Add loading/empty/error states for thread detail
15. Write component tests
16. `pnpm lint --max-warnings 0` pass
17. `pnpm test` pass
18. Capture screenshots for PR

## Files to Create/Modify

### New files:
- `app/src/renderer/src/styles/globals.css` — Tailwind base + custom scrollbar
- `app/src/renderer/src/styles/tokens.ts` — design tokens object
- `app/src/renderer/src/types/index.ts` — renderer types (bridging IPC schema)
- `app/src/renderer/src/lib/ipc.ts` — invoke wrapper
- `app/src/renderer/src/context/InboxContext.tsx` — state management
- `app/src/renderer/src/components/AccountPicker.tsx`
- `app/src/renderer/src/components/ThreadRow.tsx`
- `app/src/renderer/src/components/ThreadList.tsx`
- `app/src/renderer/src/components/ThreadDetailView.tsx`
- `app/src/renderer/src/components/MessageHeader.tsx`
- `app/src/renderer/src/components/MessageBody.tsx`
- `app/src/renderer/src/components/ThreadMetadataBar.tsx`
- `app/src/renderer/src/components/SkeletonLoader.tsx`
- `tailwind.config.js`
- `postcss.config.js`
- Tests: `app/test/thread-detail.test.tsx`

### Modified files:
- `electron.vite.config.ts` — add Tailwind PostCSS plugin
- `app/src/ipc/channels.ts` — add pageParams to getMessages
- `app/src/main/ipc-handlers.ts` — handle getMessages with pagination
- `app/src/renderer/src/App.tsx` — view switching
- `app/src/renderer/src/main.tsx` — wrap with InboxProvider, import globals.css
- `app/test/channels.test.ts` — update for pagination changes
- `app/test/invoke-wrapper.test.ts` — update for pagination changes

## Design Commitments
- Type sizes: 11/12/13/14px matching tokens
- Color: Neutral palette + accent blue (#3b82f6)
- Spacing: 8-pt rhythm
- Message layout: Superhuman-inspired (avatar + name + timestamp row, body below)
- Subject sticky header: Linear-inspired
- Skeleton: pulsing rectangles matching message layout
- HTML sanitization: DOMParser-based, no DOMPurify dependency
- Image toggle: pill button "Show images" above body
