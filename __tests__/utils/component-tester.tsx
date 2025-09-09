import React from 'react'
import { render, RenderResult } from '@testing-library/react'
import { createTestWrapper } from '../setup/test-utils'

export interface ComponentTestProps<T = any> {
  component: React.ComponentType<T>
  props: T
  wrapper?: React.ComponentType
  providers?: React.ComponentType[]
}

export async function renderComponent<T = any>(
  component: React.ComponentType<T>,
  props: T,
  options: {
    wrapper?: React.ComponentType
    providers?: React.ComponentType[]
  } = {},
): Promise<RenderResult & { rerender: (newProps: Partial<T>) => void }> {
  const { wrapper, providers = [] } = options
  const Wrapper = createTestWrapper(providers)

  const renderResult = render(
    <Wrapper>{React.createElement(component as React.ComponentType<any>, props as any)}</Wrapper>,
    { wrapper },
  )

  return {
    ...renderResult,
    rerender: ((newProps: Partial<T>) => {
      return renderResult.rerender(
        <Wrapper>
          {React.createElement(
            component as React.ComponentType<any>,
            { ...props, ...newProps } as any,
          )}
        </Wrapper>,
      )
    }) as any,
  }
}

export function testComponentRendering<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    expected: {
      rendered: boolean
      text?: string
      elements?: string[]
    }
  }>,
) {
  describe(`${component.displayName || component.name} rendering`, () => {
    testCases.forEach(({ name, props, expected }) => {
      it(`should render correctly: ${name}`, async () => {
        const { container, getByText, queryByText } = await renderComponent(component, props)

        expect(container).toBeInTheDocument()

        if (expected.text) {
          const textElement = getByText(expected.text)
          expect(textElement).toBeInTheDocument()
        }

        if (expected.elements) {
          expected.elements.forEach((element) => {
            const foundElement = container.querySelector(element)
            expect(foundElement).toBeInTheDocument()
          })
        }
      })
    })
  })
}

export function testComponentAccessibility<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    expected: {
      hasRequiredAttributes?: string[]
      isKeyboardAccessible?: boolean
      hasAriaLabels?: string[]
    }
  }>,
) {
  describe(`${component.displayName || component.name} accessibility`, () => {
    testCases.forEach(({ name, props, expected }) => {
      it(`should meet accessibility requirements: ${name}`, async () => {
        const { container } = await renderComponent(component, props)

        if (expected.hasRequiredAttributes) {
          expected.hasRequiredAttributes.forEach((attr) => {
            const elements = container.querySelectorAll(`[${attr}]`)
            expect(elements.length).toBeGreaterThan(0)
          })
        }

        if (expected.hasAriaLabels) {
          expected.hasAriaLabels.forEach((ariaLabel) => {
            const element = container.querySelector(`[aria-label="${ariaLabel}"]`)
            expect(element).toBeInTheDocument()
          })
        }
      })
    })
  })
}

export function testComponentResponsiveness<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    viewports: Array<{
      width: number
      height: number
      expected: {
        visibleElements?: string[]
        hiddenElements?: string[]
      }
    }>
  }>,
) {
  describe(`${component.displayName || component.name} responsiveness`, () => {
    testCases.forEach(({ name, props, viewports }) => {
      viewports.forEach((viewport) => {
        it(`should render correctly at ${viewport.width}x${viewport.height}: ${name}`, async () => {
          // Mock window resize
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          })
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewport.height,
          })

          window.dispatchEvent(new Event('resize'))

          const { container } = await renderComponent(component, props)

          if (viewport.expected.visibleElements) {
            viewport.expected.visibleElements.forEach((element) => {
              const foundElement = container.querySelector(element)
              expect(foundElement).toBeInTheDocument()
              expect(foundElement).toBeVisible()
            })
          }

          if (viewport.expected.hiddenElements) {
            viewport.expected.hiddenElements.forEach((element) => {
              const foundElement = container.querySelector(element)
              if (foundElement) {
                expect(foundElement).not.toBeVisible()
              }
            })
          }
        })
      })
    })
  })
}

// Helper to test component with different states
export function testComponentStates<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    states: Array<{
      stateName: string
      stateProps: Partial<T>
      expected: {
        rendered?: boolean
        text?: string
        elements?: string[]
        disabled?: boolean
        loading?: boolean
        error?: boolean
      }
    }>
  }>,
) {
  describe(`${component.displayName || component.name} states`, () => {
    testCases.forEach(({ name, props, states }) => {
      describe(`State variations: ${name}`, () => {
        states.forEach(({ stateName, stateProps, expected }) => {
          it(`should handle ${stateName} state correctly`, async () => {
            const { container, getByText, queryByText } = await renderComponent(component, {
              ...props,
              ...stateProps,
            })

            if (expected.rendered !== undefined) {
              if (expected.rendered) {
                expect(container).toBeInTheDocument()
              } else {
                expect(container).toBeEmptyDOMElement()
              }
            }

            if (expected.text) {
              const textElement = getByText(expected.text)
              expect(textElement).toBeInTheDocument()
            }

            if (expected.elements) {
              expected.elements.forEach((element) => {
                const foundElement = container.querySelector(element)
                expect(foundElement).toBeInTheDocument()
              })
            }

            if (expected.disabled !== undefined) {
              const disabledElements = container.querySelectorAll('[disabled]')
              if (expected.disabled) {
                expect(disabledElements.length).toBeGreaterThan(0)
              } else {
                expect(disabledElements.length).toBe(0)
              }
            }

            if (expected.loading !== undefined) {
              const loadingElement = container.querySelector('[data-testid="loading"]')
              if (expected.loading) {
                expect(loadingElement).toBeInTheDocument()
              } else {
                expect(loadingElement).not.toBeInTheDocument()
              }
            }

            if (expected.error !== undefined) {
              const errorElement = container.querySelector('[data-testid="error"]')
              if (expected.error) {
                expect(errorElement).toBeInTheDocument()
              } else {
                expect(errorElement).not.toBeInTheDocument()
              }
            }
          })
        })
      })
    })
  })
}
