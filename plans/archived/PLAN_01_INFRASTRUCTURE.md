# Plan 01: Core Infrastructure & Project Setup

## Engineer Assignment

**Primary Engineer**: Infrastructure/DevOps Engineer
**Dependencies**: None (can start immediately)
**Estimated Time**: 1-2 days

## Overview

Set up the foundational Next.js project with TypeScript, configure build tools, and establish development workflow. This must be completed first as other teams depend on this infrastructure.

## Deliverables

### 1. Project Initialization

- [ ] Initialize Next.js project with TypeScript
- [ ] Configure App Router structure
- [ ] Set up static export configuration
- [ ] Create initial folder structure per main plan

### 2. Development Tools Configuration

- [ ] Configure TypeScript with strict mode
- [ ] Set up Tailwind CSS with config
- [ ] Configure ESLint and Prettier
- [ ] Add development scripts to package.json

### 3. Build System

- [ ] Configure Next.js for static export
- [ ] Set up build and export scripts
- [ ] Configure deployment-ready output
- [ ] Test static generation workflow

### 4. Dependencies Installation

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "@types/react": "^18.0.0",
  "@types/node": "^20.0.0",
  "tailwindcss": "^4.1.13",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0",
  "prettier": "^3.0.0"
}
```

## File Structure to Create

```
excel-explorer-website/
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── utils/
```

## Configuration Files

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Scripts Configuration

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next build && next export",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

## Handoff Requirements

- [ ] Project builds successfully with `npm run build`
- [ ] Static export generates correctly
- [ ] TypeScript compilation passes
- [ ] Linting passes without errors
- [ ] All folder structure created with placeholder files
- [ ] Documentation of any setup decisions or configurations

## Notes for Other Engineers

- Base layout and global styles will be minimal - UI team will enhance
- TypeScript interfaces folder created but empty - Data team will populate
- Component structure established but components need implementation
- Build process tested and ready for continuous integration

## Blockers This Plan Removes

- ✅ Project structure for all teams
- ✅ TypeScript configuration for type safety
- ✅ Build system for testing implementations
- ✅ Development tools for code quality
