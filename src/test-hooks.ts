// Test file for pre-commit hooks
export const testFunction = (value: string): string => {
  return value.toUpperCase()
}

export const spacingTest = 'This should be formatted'

// Missing type annotation to test linting
export const noTypeFunction = (x) => {
  return x * 2
}
