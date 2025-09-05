# Excel Explorer Website — Infrastructure Setup (Plan 01)

This repository is initialized per PLAN_01_INFRASTRUCTURE.md.

Stack:
- Next.js 14 (App Router) + React 18
- TypeScript (strict)
- Tailwind CSS 3
- ESLint (next/core-web-vitals) + Prettier 3
- Static export configured

## Getting Started
1. Ensure Node.js 18+ is installed.
2. Install dependencies:
   - npm install
3. Development server:
   - npm run dev
4. Production build:
   - npm run build
5. Static export (outputs to `out/`):
   - npm run export
6. Lint & type-check:
   - npm run lint
   - npm run type-check

## Configuration Notes
- next.config.js: `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`.
- TypeScript: strict mode with path alias `@/*` to `src/*`.
- Tailwind: configured via `tailwind.config.js`, processed by `postcss.config.js`. Global styles in `src/app/globals.css`.
- ESLint: `next/core-web-vitals` extended + Prettier formatting. Prettier config in `.prettierrc`.

## Project Structure
```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    ui/
  hooks/
  services/
  types/
  utils/
```

## Handoff Checklist
- Builds with `npm run build`
- Static export with `npm run export`
- Type-checks pass
- Lint passes
- Placeholder folders created

Further UI, data models, and services will be implemented by respective teams.
