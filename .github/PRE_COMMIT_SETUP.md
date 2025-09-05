# Pre-commit Hook Setup

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to enforce code quality standards before commits.

## What the Pre-commit Hook Does

The pre-commit hook automatically runs the following checks on staged files:

### For TypeScript Files (_.ts, _.tsx)

- **ESLint**: Fixes linting issues and enforces code standards
- **Prettier**: Formats code according to project style guide

### For All JavaScript/TypeScript Files (_.js, _.jsx, _.ts, _.tsx)

- **TypeScript Type Check**: Ensures no type errors exist

### For Style/Config Files (_.css, _.scss, _.md, _.json)

- **Prettier**: Formats files according to style guide

## Benefits

✅ **Code Quality**: Prevents commits with linting errors or formatting issues  
✅ **Consistency**: Enforces consistent code style across the team  
✅ **Type Safety**: Catches TypeScript errors before they reach the repository  
✅ **Performance**: Only runs checks on staged files, not the entire codebase  
✅ **Automatic Fixes**: ESLint and Prettier automatically fix many issues

## Configuration

### Package.json Configuration

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,jsx,ts,tsx}": ["npm run type-check"],
    "*.{css,scss,md,json}": ["prettier --write"]
  }
}
```

### Husky Hook (.husky/pre-commit)

```bash
npx lint-staged
```

## What Happens During a Commit

1. **Staging Check**: lint-staged identifies which staged files match the configured patterns
2. **ESLint**: Runs on TypeScript files, automatically fixes issues where possible
3. **Prettier**: Formats all applicable files according to style guide
4. **Type Check**: Runs TypeScript compiler to check for type errors
5. **Auto-stage**: If files were modified by linting/formatting, they're automatically re-staged
6. **Commit**: If all checks pass, the commit proceeds

## If Checks Fail

If any check fails, the commit is aborted and you'll see error messages indicating:

- Which files have issues
- What specific problems were found
- How to fix them

Common failure scenarios:

- **TypeScript errors**: Fix type issues in your code
- **ESLint errors**: Some issues require manual fixes
- **Formatting**: Usually auto-fixed by Prettier

## Bypassing the Hook (Not Recommended)

In rare cases where you need to bypass the pre-commit hook:

```bash
git commit --no-verify -m "your commit message"
```

⚠️ **Warning**: Only use this in emergency situations as it defeats the purpose of quality gates.

## Manual Commands

You can run these checks manually at any time:

```bash
# Run lint-staged on all staged files
npx lint-staged

# Type check the entire project
npm run type-check

# Lint and fix TypeScript files
npx eslint src/ --fix

# Format all files
npx prettier --write .
```

## Troubleshooting

### Hook Not Running

```bash
# Reinstall husky
npm run prepare
```

### Permission Issues

```bash
# Make hook executable
chmod +x .husky/pre-commit
```

### Dependencies Issues

```bash
# Reinstall dependencies
npm install
```

## Team Setup

When new team members clone the repository:

1. Run `npm install` (automatically runs `npm run prepare` which sets up husky)
2. The pre-commit hook is automatically installed and ready to use

No additional setup required! 🎉
