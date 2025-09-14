# Testing Hardening Plan

> Directory: `plans/test/`

## 1. Purpose

Strengthen the automated-testing safety net so that refactors reliably surface behavior changes. Plan is actionable,
mapped to files and user-visible flows, and can be parallelized by multiple engineers.

---

## 2. Guiding Principles

1. **Behavior-first**: Assert UI/side-effects, not implementation details.
2. **Fast feedback**: Unit < 500 ms, integration < 2 s per test file.
3. **Coverage gates**: Stage to 60/50/60/60, then 75/65/75/75, then 80/70/80/80 (S/B/F/L).
4. **Determinism**: Control time, storage, network; no flakiness.
5. **Refactor-resilience**: Tests describe intent and user outcomes.

---

## 3. Current State (snapshot)

- Coverage overall extremely low; hooks and services at ~0% per generated report.
- Good unit coverage for several components (`components/charts`, `DataTable`, `ui`), but no direct hook tests, minimal
  services/utils tests, no integration/E2E.
- Useful test utilities in `__tests__/setup/*` (mocks, render helpers) exist and should be leveraged.

---

## 4. Gaps and Risks

- Hooks untested: `useExcelData`, `useFilters`, `useOpenRouter`, `usePerformance`, `useSessionPersistence`.
- Services untested: `excelParser`, `chartDataProcessor`, `dataFilter`, `filterGenerator`, `numericRangeGenerator`,
  `openrouter`, `chartExport`.
- Missing integration flows: upload → chart → filter; error boundary; persistence across reloads.
- Accessibility: basic assertions exist; no `jest-axe` automated checks.
- No E2E to validate real navigation and persistence in browser.

---

## 5. Targets and Thresholds

- Milestone A (Week 1–2): Global gate S/B/F/L ≥ 60/50/60/60; hooks and critical services ≥ 50% statements.
- Milestone B (Week 3–4): Global gate ≥ 75/65/75/75; integration flows added.
- Milestone C (Week 5): Global gate ≥ 80/70/80/80; E2E green on CI.

Coverage gates enforced in CI with a 3% grace for new/changed files.

---

## 6. Work Breakdown (Actionable)

### 6.1 Infrastructure

| ID     | Task                                                                                 | Owner  | Acceptance Criteria                                                              |
| ------ | ------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------- |
| INF-01 | Ensure `collectCoverageFrom` includes `src/**/*.{ts,tsx}` and excludes stories/types | DevOps | `coverage/lcov-report` maps to `src/*`; current config already set, verify paths |
| INF-02 | Enable coverage thresholds in Jest                                                   | DevOps | `jest.config.js` has `coverageThreshold` S/B/F/L gates at Milestone A values     |
| INF-03 | Add `@testing-library/jest-axe` and a11y helper                                      | Dev    | `axe` checks runnable; at least one suite uses it                                |
| INF-04 | CI workflow for test + coverage artifact                                             | DevOps | Pipeline fails on threshold breach; uploads HTML report                          |
| INF-05 | Flake controls                                                                       | Dev    | Fake timers for time-bound hooks; stable network/storage mocks                   |

Notes:

- Current `jest.config.js` already has `collectCoverageFrom`, reporters, and setup. We need thresholds and a11y deps.

### 6.2 Hooks – Unit Tests (Jest + RTL)

| ID    | File                                 | Scenarios (assert behavior)                                                  |
| ----- | ------------------------------------ | ---------------------------------------------------------------------------- |
| HK-01 | `src/hooks/useExcelData.ts`          | success parse, parser error, memoized rerender, large file path              |
| HK-02 | `src/hooks/useFilters.ts`            | add/update/remove filter; predicate effects; memoization correctness         |
| HK-03 | `src/hooks/useOpenRouter.ts`         | 200 success, 4xx error mapping, timeout/cancel; retries if present           |
| HK-04 | `src/hooks/usePerformance.ts`        | mark/measure calls, cleanup on unmount; guard in non-browser env             |
| HK-05 | `src/hooks/useSessionPersistence.ts` | save/load flows, quota exceeded, JSON parse failure, versioning              |
| HK-06 | `src/hooks/useErrorHandler.ts`       | transforms errors to user-facing state; logs once                            |
| HK-07 | `src/hooks/useCharts.ts`             | config CRUD emits correct outputs; memoized select; invalid chart type guard |
| HK-08 | `src/hooks/useLLMAnalytics.ts`       | debounce, request shaping, error/fallback, disable if key missing            |

### 6.3 Services – Unit Tests

| ID    | Module                                  | Key Cases                                                                                                           |
| ----- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| SV-01 | `src/services/excelParser.ts`           | numeric/date detection, malformed file, type inference, empty sheet                                                 |
| SV-02 | `src/services/chartDataProcessor.ts`    | count/sum/avg; empty dataset; unknown column; categorical-only guard                                                |
| SV-03 | `src/services/dataFilter.ts`            | string contains, numeric range, date range, invalid operators                                                       |
| SV-04 | `src/services/filterGenerator.ts`       | unique values calc; 0 unique; high cardinality                                                                      |
| SV-05 | `src/services/numericRangeGenerator.ts` | ✅ COMPLETED - bucket generation for edge ranges; negatives; all nulls (98.41%/94.79%/100%/98.27% coverage)         |
| SV-06 | `src/services/openrouter.ts`            | ✅ COMPLETED - request payload shape; 401/429/5xx handling; timeout; model list (96.29%/86.3%/83.33%/100% coverage) |
| SV-07 | `src/services/chartExport.ts`           | CSV/PNG export stubs; blob creation; error propagation                                                              |

### 6.4 Utils – Unit Tests

| ID    | Module                        | Key Cases                                     |
| ----- | ----------------------------- | --------------------------------------------- |
| UT-01 | `src/utils/crypto.ts`         | deterministic hash; large input; unicode      |
| UT-02 | `src/utils/fileValidation.ts` | size limit; mime; corrupt content             |
| UT-03 | `src/utils/localStorage.ts`   | quota exceeded; JSON parse error; namespacing |
| UT-04 | `src/utils/exportUtils.ts`    | filename formatting; BOM; URL revoke          |
| UT-05 | `src/utils/errorHandling.ts`  | mapping to user-friendly messages             |

### 6.5 Components – Additions and A11y

Focus on gaps (from coverage report): `components/analytics/*`, `components/openrouter/*`, `components/session/*`,
remaining `components/filters/*` beyond structural tests.

Tasks:

- Add behavior tests for analytics panels: renders insights, loading, error, empty state.
- OpenRouter widgets: prompt building, submit disabled without data, error banner.
- Session components: auto-restore indicator, conflict resolution UI.
- Filters: real component tests for SelectFilter (replace structural div tests with component-under-test), Range/Date
  edge cases.
- Add `jest-axe` checks to `DataTable`, `ChartContainer`, Filter forms.

### 6.6 Integration Tests (RTL)

| ID    | Flow                                  | Steps                                                                                                           |
| ----- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| IT-01 | Upload → Create Chart → Apply Filters | Use fixture Excel; assert DOM and service calls (parser, dataFilter, chartDataProcessor) and final chart labels |
| IT-02 | Error Boundary path                   | Throw from child; fallback UI renders; error analytics hook fired once                                          |
| IT-03 | Persistence across reload             | Create chart; persist in storage; simulate reload; state restored correctly                                     |

### 6.7 End-to-End (Playwright)

| ID     | Scenario                    | Viewport  | Notes                                                    |
| ------ | --------------------------- | --------- | -------------------------------------------------------- |
| E2E-01 | Happy path upload-to-export | 1280x720  | LocalStorage persisted after reload; export file stubbed |
| E2E-02 | Slow network & large file   | desktop   | Progress indication; no console errors                   |
| E2E-03 | Mobile interactions         | iPhone 12 | Modal/Drawer nav paths; keyboard nav                     |

### 6.8 Regression Guards

- Snapshot: chart config JSON at each CRUD action in `useCharts` and chart UI output fragment (appropriately scoped).
- Golden files: CSV/JSON for `excelParser` and `chartDataProcessor` representative inputs.

---

## 7. Execution Plan

### Milestone A (Week 1–2): Baseline safety and hooks/services

- Implement HK-01…HK-05, SV-01…SV-03, UT-01…UT-03.
- Add `coverageThreshold` in `jest.config.js` to 60/50/60/60.
- Add `jest-axe` and one a11y suite.

### Milestone B (Week 3–4): Integration and analytics/openrouter/session components

- Implement IT-01…IT-03.
- Add component tests for analytics/openrouter/session.
- Raise coverage gates to 75/65/75/75.

### Milestone C (Week 5): E2E and polish

- Implement E2E-01…E2E-03 with Playwright.
- Golden files and targeted snapshots.
- Raise gates to 80/70/80/80; stabilize CI.

---

## 8. Ownership

| Area           | Owner (🔥 lead)    |
| -------------- | ------------------ |
| Infrastructure | 🔥 DevOps / @alice |
| Hooks          | @bob               |
| Services/Utils | @carol             |
| Components     | @dave              |
| Integration    | @erin              |
| E2E            | @frank             |

---

## 9. Acceptance Criteria (Definition of Done)

- CI fails when thresholds unmet; report uploaded.
- Hooks/services tests cover listed scenarios; flaky tests quarantined or fixed.
- Integration flows green; simulate storage and network deterministically.
- A11y: no critical axe violations in primary screens.
- E2E validates happy path and key edge scenarios on CI.

---

## 10. References

- Testing Library: `https://testing-library.com/docs/`
- Playwright: `https://playwright.dev/docs/intro`
- Istanbul: `https://istanbul.js.org/`

---

## 11. Notes to Implementers

- Prefer behavior assertions; avoid internal state peeking.
- Use `__tests__/setup/test-utils.tsx` helpers; extend if needed.
- Mock services via `TestServiceManager` or explicit jest mocks to isolate cases.
- When adding snapshots, scope narrowly to stable output.
