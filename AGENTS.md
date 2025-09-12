# Repository Guidelines

## Project Structure & Module Organization

- Source lives in `src/` with `app/` (Next.js App Router), `components/`, `services/`, `hooks/`, `types/`, and `utils/`.
  Public assets are in `public/`. Build output for static export is `out/`.
- Tests live in `__tests__/` (e.g., `unit/`, `setup/`, `utils/`). Use the path alias `@/*` for imports (
  `@/components/...`).

## Build, Test, and Development Commands

- `npm run dev` – Start the dev server.
- `npm run build` – Production build; `npm start` serves it.
- `npm run export` – Static export to `out/` (see `next.config.js`).
- `npm run lint` / `npm run type-check` – ESLint and TypeScript checks.
- `npm test` / `npm run test:watch` / `npm run test:coverage` – Jest tests and coverage.
- `ANALYZE=true npm run analyze` – Bundle analyzer for build size insights.

## Coding Style & Naming Conventions

- TypeScript (strict). Prettier: 2-space indent, single quotes, no semicolons, 100-char width. ESLint: Next.js +
  TypeScript rules.
- Components: PascalCase `.tsx` (e.g., `DataTable.tsx`). Services/utils: camelCase `.ts` (e.g., `excelParser.ts`).
- Prefer `@/` imports over deep relative paths. Avoid inline code comments; use clear types and names instead.

## Testing Guidelines

- Frameworks: Jest + React Testing Library (`@testing-library/jest-dom`), optional `jest-axe` for a11y.
- Name tests `*.test.ts(x)` or `*.spec.ts(x)` under `__tests__/...`.
- Coverage thresholds (see `jest.config.js`): statements 60%, branches 50%, functions 60%, lines 60%.
- Run `npm run test:coverage` before opening a PR.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:` (e.g., `feat(ui): add Modal`).
- PRs should include a clear summary, linked issues, screenshots/GIFs for UI changes, and a test plan.
- Ensure `npm run type-check && npm run lint && npm test` pass locally. Husky + lint-staged format/lint staged files on
  commit.

## Security & Configuration Tips

- Do not commit secrets. OpenRouter API keys are stored client-side; tests may read `OPENROUTER_*` env vars.
- The site supports static hosting via `next export`. For large changes, verify `out/` locally before deploying.

