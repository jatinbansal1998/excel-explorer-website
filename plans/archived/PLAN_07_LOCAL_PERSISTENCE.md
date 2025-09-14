# Plan 07: Local Persistence & Session Restore

## Engineer Assignment

**Primary Engineer**: Full-Stack/Frontend Engineer
**Dependencies**: Plan 01 (Infrastructure), Plan 02 (Data Processing), Plan 06 (Utilities)
**Estimated Time**: 1-2 days

## Overview

Persist data locally in the browser so users can refresh or return later and continue where they left off. This plan introduces a storage abstraction that uses `localStorage` for lightweight metadata/preferences and `IndexedDB` for larger datasets, with compression and size-guardrails. It integrates with existing hooks (`useExcelData`, `useFilters`, `useCharts`) to automatically save and restore sessions.

## Goals

- Persist parsed dataset snapshots for reuse after refresh (size-aware)
- Persist filter state, chart configurations, and user preferences
- Automatic session restore banner on load with explicit opt-in
- Safe-by-default storage limits with LRU cleanup and clear-data controls
- Versioned schema with forward-compatible migrations

## Non-Goals

- Cloud sync/multi-device sync (future enhancement)
- Cryptographic at-rest encryption (out-of-scope for MVP)

## Deliverables

- Storage abstraction (`StorageService`) with adapters for `localStorage` and `IndexedDB`
- Size-aware dataset persistence with compression and thresholds
- Automatic session restore flow with UI banner and controls
- Integrated persistence in `useExcelData`, `useFilters`, `useCharts`
- Clear data/reset controls and LRU-based retention
- Versioned schema and basic migration scaffolding

## Dependencies to Install

```json
{
  "idb": "^7.1.1",
  "lz-string": "^1.5.0",
  "@types/lz-string": "^1.3.34"
}
```

## Storage Architecture

### Strategy

- Use `localStorage` for: active session id, small metadata, preferences, feature flags.
- Use `IndexedDB` for: dataset snapshots, large filter option caches, chart configs with large numeric ranges.
- Apply JSON compression (lz-string) before storing medium-sized payloads to reduce footprint.
- Guardrails: do not attempt to persist datasets exceeding configured limits; store metadata-only with a non-blocking warning.

### Data Limits & Policies

- Max sessions retained: 5 (LRU by lastUpdated)
- Max dataset snapshot size (compressed): 3 MB (tunable)
- Max rows persisted: 50,000 (tunable); above this, store metadata-only unless user explicitly opts-in
- Debounced writes: 300ms for frequent updates (filters/charts)
- Health checks: detect QuotaExceededError and degrade gracefully

## Data Schema (TypeScript)

```ts
export interface PersistedSession {
  id: string
  createdAt: string // ISO date
  updatedAt: string // ISO date
  appVersion: string // semantic version
  schemaVersion: number // persistence schema version
  datasetKey: string | null // IDB key for dataset snapshot
  filtersKey: string | null // IDB key for filters
  chartsKey: string | null // IDB key for charts
  preferencesKey: string | null // local prefs key (localStorage)
  summary: {
    fileName?: string
    sheetName?: string
    totalRows?: number
    totalColumns?: number
    columns?: string[]
  }
}

export interface ExcelDataSnapshot {
  version: number // aligns with schemaVersion
  createdAt: string
  excelData: ExcelData // from src/types/excel
}

export interface FiltersSnapshot {
  version: number
  createdAt: string
  filters: FilterConfig[] // from src/types/filter
}

export interface ChartsSnapshot {
  version: number
  createdAt: string
  charts: ChartConfig[] // from src/types/chart
}

export interface StorageKeys {
  activeSessionId: string // e.g., 'excel-explorer-active-session-id'
  sessionsIndex: string // e.g., 'excel-explorer-sessions-index'
}
```

## Services to Implement

### 1) Storage Adapters

```ts
export interface StorageAdapter {
  getItem<T>(key: string): Promise<T | null>
  setItem<T>(key: string, value: T): Promise<boolean>
  removeItem(key: string): Promise<boolean>
}

// LocalStorageAdapter: small metadata only
// IndexedDbAdapter: large payloads (datasets, charts)
```

### 2) StorageService

```ts
export class StorageService {
  constructor(
    local: StorageAdapter, // wraps existing LocalStorageManager
    idb: StorageAdapter, // IndexedDB adapter via idb
  ) {}

  // Session lifecycle
  createOrUpdateSession(summary: PersistedSession['summary']): Promise<PersistedSession>
  getActiveSession(): Promise<PersistedSession | null>
  setActiveSession(sessionId: string | null): Promise<void>
  listSessions(): Promise<PersistedSession[]> // LRU ordered
  deleteSession(sessionId: string): Promise<void>

  // Snapshots
  saveDataset(sessionId: string, data: ExcelData): Promise<void> // size-aware + compression
  saveFilters(sessionId: string, filters: FilterConfig[]): Promise<void>
  saveCharts(sessionId: string, charts: ChartConfig[]): Promise<void>

  loadDataset(sessionId: string): Promise<ExcelData | null>
  loadFilters(sessionId: string): Promise<FilterConfig[] | null>
  loadCharts(sessionId: string): Promise<ChartConfig[] | null>
}
```

### 3) Compression Utility

- `serialize<T>(value: T): string` → `JSON.stringify` → optional `LZString.compressToUTF16`
- `deserialize<T>(raw: string): T` → reverse
- Compression is applied only for payloads > 50 KB

### 4) LRU & Cleanup

- Maintain a `sessionsIndex` (array of `{ id, updatedAt }`) in `localStorage`
- On create/update, move session to front; if > 5, evict the oldest: delete session record and its IDB keys

## Integration Points

### `useExcelData`

- On successful parse: create/update session with summary; call `saveDataset`
- On mount: check `activeSessionId`; if found, surface a restore banner with dataset summary
- Provide `restoreLastSession()` and `discardSession()` helpers

### `useFilters`

- Persist `filters` on change (debounced). On mount with active session, load saved filters and apply

### `useCharts`

- Persist `charts` on change (debounced). On mount with active session, load saved charts

### UI Components

- Restore banner in `src/app/page.tsx` (top of main content):
  - "Restore last session – filename (rows x cols)" [Restore] [Dismiss]
- Settings/Actions menu:
  - "Save snapshot now" (manual trigger)
  - "Clear local data" (with confirmation)
  - "Manage sessions" (optional future)

## UX & Edge Cases

- Large datasets: if size > threshold, store metadata-only and show non-blocking toast with "Save snapshot anyway (may fail)"
- Quota exceeded: show actionable error, auto-switch to metadata-only mode
- Schema mismatch: attempt migration; if not possible, discard with clear messaging

## Session Selection UI

### Experience

- Entry points:
  - In `src/app/page.tsx` header actions: a "Manage sessions" button opens the Session Manager
  - Restore banner: secondary action "Choose a different session" to open the manager
- Session Manager Modal provides a searchable, sortable list of previous sessions with details and actions
- Preview panel shows basic metadata (file name, rows, columns, updated time, columns list)
- Primary actions: Restore, Delete; Secondary: Rename (optional), Export Config (filters/charts)

### Components

```ts
// src/components/session/SessionManagerModal.tsx
interface SessionManagerModalProps {
  isOpen: boolean
  onClose: () => void
  sessions: PersistedSession[]
  onRestore: (sessionId: string) => void
  onDelete: (sessionId: string) => void
  onRename?: (sessionId: string, name: string) => void
}

// src/components/session/SessionListItem.tsx
interface SessionListItemProps {
  session: PersistedSession
  isActive: boolean
  onSelect: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

// src/hooks/useSessionPersistence.ts additions
interface UseSessionPersistence {
  isSessionManagerOpen: boolean
  openSessionManager: () => void
  closeSessionManager: () => void
  sessions: PersistedSession[]
  restoreSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
}
```

### Behaviors

- Sorting toggles by: Last Updated (default desc), File Name, Rows, Columns
- Search filters across file name, sheet name, columns
- Keyboard navigation: up/down to move, Enter to restore, Delete to remove (with confirm)
- Confirm destructive actions with a modal; support undo via transient cache (optional)

### Accessibility

- Modal uses ARIA roles/dialog semantics with focus trapping
- List items are selectable with clear focus styles
- Buttons have accessible labels and tooltips; provide live region updates for actions

### Edge Cases

- No sessions: show empty state with guidance
- Corrupted/missing payload: disable restore with tooltip and deletion suggestion
- Incompatible schema version: show migration notice and allow discard

### Files to Create — UI Additions

- `src/components/session/SessionManagerModal.tsx`
- `src/components/session/SessionListItem.tsx`
- Update `src/hooks/useSessionPersistence.ts` to include modal state and actions
- Wire entry points in `src/app/page.tsx` (manage button) and restore banner

### Testing Additions

- Component tests: list rendering, sorting, search, keyboard navigation, a11y attributes
- Integration: open modal → pick session → restore flow hydrates `useExcelData`, `useFilters`, `useCharts`

### Validation Criteria Updates

- Users can open the Session Manager, browse previous sessions, and restore one successfully
- Deleting a session removes it from the list and underlying storage keys
- Keyboard-only users can operate the modal and restore sessions

## Security & Privacy

- Data stays entirely client-side; clearly communicate in UI
- Provide one-click "Clear all local data" control
- No PII inference or external transmission

## Performance Considerations

- Debounce writes (300ms) for filters/charts
- Offload compression to a Web Worker if payload > 1 MB (phase 2)
- Avoid persisting on every keystroke in search; persist after idle

## Testing Strategy

- Unit tests: adapters, compression utility, LRU, StorageService API
- Integration tests: end-to-end refresh restore (parse → refresh → restore)
- Edge tests: quota exceeded, large dataset gating, schema migration fallback

## Files to Create

- `src/utils/storage/adapter.ts` – `StorageAdapter` interface
- `src/utils/storage/localAdapter.ts` – wraps existing `LocalStorageManager`
- `src/utils/storage/indexedDbAdapter.ts` – `idb` based
- `src/utils/storage/serialization.ts` – JSON + compression helpers
- `src/utils/storage/service.ts` – `StorageService` orchestrator
- `src/hooks/useSessionPersistence.ts` – restore banner state and helpers
- Update integrations:
  - `src/hooks/useExcelData.ts` – create/update session, dataset save/load
  - `src/hooks/useFilters.ts` – save/load filters
  - `src/hooks/useCharts.ts` – save/load charts
  - `src/components/ui/Toast.tsx` – reuse for non-blocking notifications

## Validation Criteria

- Refreshing the page restores dataset, filters, and charts for typical files (<3 MB compressed)
- Exceeding thresholds degrades gracefully with clear messaging
- LRU cleanup maintains ≤ 5 sessions and no orphaned IDB entries
- No runtime errors in browsers: Chrome, Firefox, Safari, Edge (latest)

## Rollout Plan

1. Implement adapters and `StorageService`
2. Integrate with hooks behind a feature flag `persistence.enabled` (default on)
3. Ship restore banner and clear-data action
4. Monitor error logs (quota, failures) and adjust thresholds

## Migration & Versioning

- `schemaVersion` (start at 1). On load, if versions differ:
  - Try in-place migration script per version bump
  - If migration fails, discard incompatible payloads, keep session metadata

---

This plan enables robust local persistence with a clean abstraction, integrates with existing hooks, and respects browser storage limits while maintaining a smooth UX for session restore.
