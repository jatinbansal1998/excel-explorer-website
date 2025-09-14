# Plan 10: Refactoring & Performance Hardening

## Engineer Assignment

- Primary Engineer: Frontend Platform/Perf
- Estimated Time: 2–3 days (spread across PRs)
- Dependencies: None blocking; can run in parallel with feature work

## Overview

Targeted refactors to reduce bundle size, improve large‑file performance, and simplify architecture for maintainability. The plan focuses on extracting the Excel parsing worker, deferring heavy libs, modularizing persistence, standardizing error flows, and tightening test/coverage gates.

## Objectives

- Extract and reuse a Web Worker for column analysis to avoid UI jank on large files.
- Ensure heavy libraries (xlsx, chart.js) are only loaded when needed.
- Reduce complexity in storage/persistence by splitting responsibilities.
- Replace global shims with explicit, typed boundaries.
- Raise test coverage thresholds toward the repository guideline.

## Deliverables

### 1) Excel Parsing Worker Extraction

- [ ] Create `src/workers/excelDetectColumns.worker.ts` that performs column type detection.
- [ ] Share parsing helpers from `@/utils/dataTypes` instead of duplicating inside the worker.
- [ ] Manage worker lifecycle (instantiate once per parse, terminate after use, `URL.revokeObjectURL`).
- [ ] Switch `ExcelParser.processInWorker` to import and spawn the dedicated worker file.
- [ ] Add unit tests that exercise both the worker and non‑worker paths.

Notes:

- Replace inline string worker in `src/services/excelParser.ts` with a proper module worker to improve readability and maintenance.

### 2) Defer XLSX Usage in Export Utilities

- [ ] Convert `src/utils/exportUtils.ts` to dynamically import `xlsx` (already dynamic in `excelParser`).
- [ ] Validate that `next build` tree‑shakes xlsx from the main route bundles when user never triggers export.

Example:

```ts
// before
import * as XLSX from 'xlsx'

// after
const { utils, write } = await import('xlsx')
```

### 3) Persistence Service Modularization

- [ ] Split `src/utils/storage/service.ts` into focused modules:
  - `sessionIndex.ts` – index maintenance, eviction policy
  - `datasetChunkIO.ts` – chunking, serialization, reconstruction
  - `limits.ts` – adaptive thresholds and size estimates
- [ ] Keep `StorageService` as the single façade assembling these parts.
- [ ] Add unit tests per module to reduce blast radius and clarify behavior.

### 4) Replace Global Shims with Context

- [ ] Introduce typed React contexts for:
  - “Apply chart from AI” callback
  - “Import filters from AI” callback
- [ ] Replace `globalProperties.setApplyChartFromAI` and `setImportFiltersFromAI` with providers used in `src/app/page.tsx` and consumers in charts/filters hooks.
- [ ] Maintain a thin compatibility layer if needed for short‑term transition.

### 5) Error Handling Consistency

- [ ] Replace direct `throw new Error(...)` in services with `ErrorHandler` (type + context), especially in:
  - `src/services/openrouter.ts`
  - `src/services/excelParser.ts`
- [ ] Ensure UI surfaces friendly messages via existing boundaries.

### 6) Network Robustness

- [ ] Add timeout + abort handling to `OpenRouterService.listModels` mirroring `chat()`.
- [ ] Unit tests for non‑200 responses and invalid JSON bodies.

### 7) Bundle & Build Hygiene

- [ ] Remove legacy `pages/_document.tsx` (App Router is in use).
- [ ] Verify chart libraries load only behind lazy boundaries (ChartView already lazy; confirm no stray imports).
- [ ] Keep `next.config.js` `optimizePackageImports` usage, ensure no regressions.

### 8) Coverage Threshold Alignment

- [ ] Raise Jest thresholds in stages toward AGENTS.md guidelines:
  - Phase A: statements 45 / branches 40 / functions 45 / lines 45
  - Phase B: statements 55 / branches 45 / functions 55 / lines 55
  - Phase C: statements 60 / branches 50 / functions 60 / lines 60
- [ ] Add tests for worker path and persistence modules to support the increase.

### 9) Misc Cleanups

- [ ] Add `URL.revokeObjectURL` in worker creation path.
- [ ] Ensure SSR guards for utils that read `window` (e.g., `browserCompatibility.ts`, `localStorage.ts`).
- [ ] Run Prettier across outliers (e.g., `exportUtils.ts`) to match repo style.

## Affected Files (initial)

- `src/services/excelParser.ts` (worker extraction, revoke URL, error flow)
- `src/workers/excelDetectColumns.worker.ts` (new)
- `src/utils/exportUtils.ts` (dynamic import)
- `src/utils/storage/service.ts` → split into submodules (new files under `src/utils/storage/`)
- `src/app/page.tsx`, `src/hooks/useFilters.ts`, `src/components/ChartView.tsx` (contexts replacing global shims)
- `src/services/openrouter.ts` (timeout for listModels)
- `pages/_document.tsx` (remove)
- `jest.config.js` (threshold ramp)

## Acceptance Criteria

- Parsing large files does not lock the UI; worker path covered by tests.
- `xlsx` does not increase initial route bundle size; only loaded on parse/export.
- Persistence service passes existing tests; new tests cover chunking and reconstruction paths.
- No regressions in the 680 existing tests; thresholds increased per phase.
- No unused legacy pages router files; build succeeds and export still works.

## Risks & Mitigations

- Worker bundling nuances: Use module worker approach supported by Next.js/Webpack; add e2e test for both CSV/XLSX.
- Dynamic import fallbacks: Guard for errors and surface via `ErrorHandler`.
- Splitting persistence service might introduce subtle state bugs: land as small PRs with focused tests.

## Rollout Plan

1. PR1 – Worker extraction + revoke URL + tests (excelParser only).
2. PR2 – Dynamic import for `exportUtils` + smoke tests.
3. PR3 – Storage service split (no behavior change) + new unit tests.
4. PR4 – Contexts to replace global shims; wire in page/chart/filter.
5. PR5 – `listModels` timeout + tests.
6. PR6 – Remove legacy `pages/_document.tsx`; verify build/export.
7. PR7 – Increase Jest thresholds (Phase A), add tests. Follow‑ups for Phase B/C.

## Validation

- `npm run type-check && npm run lint && npm test` green.
- Run `ANALYZE=true npm run analyze` to confirm bundle impact improvements (xlsx excluded from main route).
- `npm run export` produces valid `out/` and basic flows work.

## Out of Scope

- New chart types or analytics capabilities (tracked separately).
- Server/edge runtime changes.

---

Prepared to keep PRs small and reviewable. Each step includes tests and explicit acceptance criteria to reduce regressions.
