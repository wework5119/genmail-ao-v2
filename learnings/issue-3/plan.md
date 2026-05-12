# Issue 3: Inbox View — Plan

## Approach

1. Scaffold the full Electron + React + Vite + Tailwind project
2. Create design tokens layer (Tailwind config + tokens.ts)
3. Build IPC bridge (main process handlers for getAccounts, listThreads) with mock data
4. Build state management (useReducer + Context for inbox state)
5. Build components:
   - AccountPicker (Linear-style dropdown)
   - ThreadList (infinite scroll, keyboard nav)
   - ThreadRow (Superhuman-style layout)
6. Add empty/error/loading states
7. Test and lint

## Design Choices

- **Type ramp**: 11/12/13/14/15 px matching design tokens
- **Spacing**: 8-pt rhythm (4, 8, 12, 16, 24, 32)
- **Colors**: Neutral grayscale palette, accent blue (#3b82f6)
- **Thread row**: Sender (semibold) → Subject (medium) → Preview (muted)
- **Unread indicator**: Filled 8px dot in accent color
- **Timestamp**: Relative ("2h ago", "Tue")
- **Account picker**: Minimal dropdown with avatar initials + checkmark
- **Keyboard**: ArrowUp/Down, Enter, R for refresh
- **Pagination**: Cursor-based with IntersectionObserver infinite scroll
