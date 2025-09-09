import { axe, toHaveNoViolations } from 'jest-axe'
import { render } from '@testing-library/react'

// Extend Jest expect with axe assertions
expect.extend(toHaveNoViolations)

// Add type declarations for Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R
    }
  }
}

// Type definitions for axe results
interface AxeResult {
  violations: Array<{
    id: string
    impact: string
    description: string
    help: string
    helpUrl: string
    tags: string[]
  }>
}

/**
 * Accessibility testing helper that combines RTL render with axe checks
 * @param ui The React component to test
 * @param options Optional configuration for render and axe
 * @returns Object containing render results and accessibility results
 */
export async function renderWithA11y(
  ui: React.ReactElement,
  options: {
    renderOptions?: Parameters<typeof render>[1]
    axeOptions?: Parameters<typeof axe>[1]
  } = {},
) {
  const { renderOptions = {}, axeOptions = {} } = options

  // Render the component
  const renderResult = render(ui, renderOptions)

  // Run accessibility checks
  const results = (await axe(renderResult.container, axeOptions)) as AxeResult

  return {
    ...renderResult,
    axeResults: results,
  }
}

/**
 * Helper to check for accessibility violations and fail the test if any are found
 * @param ui The React component to test
 * @param options Optional configuration for render and axe
 */
export async function expectNoA11yViolations(
  ui: React.ReactElement,
  options: {
    renderOptions?: Parameters<typeof render>[1]
    axeOptions?: Parameters<typeof axe>[1]
  } = {},
) {
  const { axeResults } = await renderWithA11y(ui, options)
  expect(axeResults).toHaveNoViolations()
}

/**
 * Helper to check specific accessibility rules
 * @param ui The React component to test
 * @param rules Array of rule IDs to check
 * @param options Optional configuration for render and axe
 */
export async function expectA11yRulesPass(
  ui: React.ReactElement,
  rules: string[],
  options: {
    renderOptions?: Parameters<typeof render>[1]
    axeOptions?: Parameters<typeof axe>[1]
  } = {},
) {
  const { axeResults } = await renderWithA11y(ui, {
    ...options,
    axeOptions: {
      ...options.axeOptions,
      rules: rules.map((ruleId) => ({ id: ruleId, enabled: true })),
    },
  })

  const violations = axeResults.violations.filter((violation) => rules.includes(violation.id))

  expect(violations).toHaveLength(0)
}
