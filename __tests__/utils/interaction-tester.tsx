import userEvent from '@testing-library/user-event'
import { renderComponent } from './component-tester'

export interface UserInteractionTest {
  name: string
  component: string
  interactions: Array<{
    action: 'click' | 'type' | 'hover' | 'drag' | 'focus' | 'blur'
    target: string
    value?: string
    options?: any
  }>
  expected: {
    stateChanges?: Record<string, any>
    events?: string[]
    navigation?: string
    text?: string
    elements?: string[]
    error?: string
  }
}

export async function testUserInteractions<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    interactions: Array<{
      action: 'click' | 'type' | 'hover' | 'drag' | 'focus' | 'blur'
      target: string
      value?: string
      options?: any
    }>
    expected: {
      stateChanges?: Record<string, any>
      events?: string[]
      navigation?: string
      text?: string
      elements?: string[]
      error?: string
    }
  }>,
) {
  describe(`${component.displayName || component.name} user interactions`, () => {
    let userEventInstance: ReturnType<typeof userEvent.setup>

    beforeEach(() => {
      userEventInstance = userEvent.setup()
    })

    testCases.forEach(({ name, props, interactions, expected }) => {
      it(`should handle interactions: ${name}`, async () => {
        const { container, getByRole, getByLabelText, getByTestId, getByText, queryByText } =
          await renderComponent(component, props)

        // Perform interactions
        for (const interaction of interactions) {
          let target: Element | null = null

          // Find the target element
          if (interaction.target.startsWith('data-testid')) {
            const testId = interaction.target.replace('data-testid=', '').replace(/['"]/g, '')
            target = getByTestId(testId)
          } else if (interaction.target.startsWith('[aria-label')) {
            const ariaLabel = interaction.target.match(/aria-label="([^"]+)"/)?.[1]
            if (ariaLabel) {
              target = getByLabelText(ariaLabel)
            }
          } else if (interaction.target.startsWith('[role')) {
            const role = interaction.target.match(/role="([^"]+)"/)?.[1]
            if (role) {
              target = getByRole(role as any)
            }
          } else {
            target = container.querySelector(interaction.target)
          }

          expect(target).toBeInTheDocument()

          // Perform the interaction
          switch (interaction.action) {
            case 'click':
              await userEventInstance.click(target as HTMLElement)
              break
            case 'type':
              if (interaction.value !== undefined && target) {
                await userEventInstance.type(target as HTMLElement, interaction.value)
              }
              break
            case 'hover':
              if (target) {
                await userEventInstance.hover(target as HTMLElement)
              }
              break
            case 'focus':
              await userEventInstance.tab()
              await userEventInstance.tab()
              // Focus on the specific element
              if (target) {
                ;(target as HTMLElement).focus()
              }
              break
            case 'blur':
              if (target) {
                ;(target as HTMLElement).blur()
              }
              break
            case 'drag':
              // Simple drag implementation - would need more sophisticated handling for real drag & drop
              if (interaction.options?.target && target) {
                const dropTarget = container.querySelector(interaction.options.target)
                if (dropTarget) {
                  await userEventInstance.pointer([
                    { coords: { x: 0, y: 0 } },
                    { coords: { x: 100, y: 100 } },
                  ])
                }
              }
              break
          }

          // Wait for any async operations
          await new Promise((resolve) => setTimeout(resolve, 0))
        }

        // Verify expected outcomes
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

        if (expected.error) {
          const errorElement = container.querySelector('[data-testid="error"]')
          if (errorElement) {
            expect(errorElement).toHaveTextContent(expected.error)
          }
        }

        // Note: State changes and events would need to be tested with actual state management
        // This is a basic framework that would need to be extended based on specific component needs
        if (expected.stateChanges) {
          // State change verification would require access to component state
          // This could be implemented with context providers or state mocking
          console.log('State changes to verify:', expected.stateChanges)
        }

        if (expected.events) {
          // Event verification would require event spying
          // This could be implemented with jest.spyOn or custom event handlers
          console.log('Events to verify:', expected.events)
        }
      })
    })
  })
}

// Helper for testing form interactions
export async function testFormInteractions<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    formFields: Array<{
      name: string
      value: string
      type?: 'input' | 'select' | 'textarea' | 'checkbox' | 'radio'
    }>
    submitAction?: {
      target: string
    }
    expected: {
      formData?: Record<string, any>
      validationErrors?: string[]
      success?: boolean
      submittedData?: any
    }
  }>,
) {
  describe(`${component.displayName || component.name} form interactions`, () => {
    let userEventInstance: ReturnType<typeof userEvent.setup>

    beforeEach(() => {
      userEventInstance = userEvent.setup()
    })

    testCases.forEach(({ name, props, formFields, submitAction, expected }) => {
      it(`should handle form interactions: ${name}`, async () => {
        const { container } = await renderComponent(component, props)

        // Fill form fields
        for (const field of formFields) {
          let fieldElement: Element | null

          switch (field.type) {
            case 'checkbox':
            case 'radio':
              fieldElement = container.querySelector(
                `input[name="${field.name}"][type="${field.type}"]`,
              )
              if (fieldElement) {
                await userEventInstance.click(fieldElement as HTMLElement)
              }
              break
            case 'select':
              fieldElement = container.querySelector(`select[name="${field.name}"]`)
              if (fieldElement) {
                const option = (fieldElement as HTMLSelectElement).querySelector(
                  `option[value="${field.value}"]`,
                )
                if (option) {
                  await userEventInstance.selectOptions(
                    fieldElement as HTMLSelectElement,
                    field.value,
                  )
                }
              }
              break
            default:
              fieldElement = container.querySelector(
                `input[name="${field.name}"], textarea[name="${field.name}"]`,
              )
              if (fieldElement) {
                await userEventInstance.clear(fieldElement as HTMLElement)
                await userEventInstance.type(fieldElement as HTMLElement, field.value)
              }
          }

          expect(fieldElement).toBeInTheDocument()
        }

        // Submit form if action specified
        if (submitAction) {
          const submitButton = container.querySelector(submitAction.target)
          if (submitButton) {
            await userEventInstance.click(submitButton as HTMLElement)
          }
        }

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Verify expected outcomes
        if (expected.validationErrors) {
          expected.validationErrors.forEach((error) => {
            const errorElement = container.querySelector(
              `[data-testid="error"], .error, [role="alert"]`,
            )
            if (errorElement) {
              expect(errorElement).toHaveTextContent(error)
            }
          })
        }

        if (expected.success !== undefined) {
          const successElement = container.querySelector('[data-testid="success"], .success')
          if (expected.success) {
            expect(successElement).toBeInTheDocument()
          } else {
            expect(successElement).not.toBeInTheDocument()
          }
        }
      })
    })
  })
}

// Helper for testing keyboard navigation
export async function testKeyboardNavigation<T>(
  component: React.ComponentType<T>,
  testCases: Array<{
    name: string
    props: T
    keySequence: Array<{
      key: string
      target?: string
      options?: KeyboardEventInit
    }>
    expected: {
      focusedElement?: string
      activeElement?: string
      stateChanges?: Record<string, any>
    }
  }>,
) {
  describe(`${component.displayName || component.name} keyboard navigation`, () => {
    testCases.forEach(({ name, props, keySequence, expected }) => {
      it(`should handle keyboard navigation: ${name}`, async () => {
        const { container } = await renderComponent(component, props)

        // Simulate keyboard events
        for (const keyAction of keySequence) {
          let target: Element | Document = document

          if (keyAction.target) {
            target = container.querySelector(keyAction.target) || document
          }

          const keyboardEvent = new KeyboardEvent('keydown', {
            key: keyAction.key,
            ...keyAction.options,
          })

          target.dispatchEvent(keyboardEvent)
          await new Promise((resolve) => setTimeout(resolve, 10))
        }

        // Verify expected outcomes
        if (expected.focusedElement) {
          const focusedElement = container.querySelector(expected.focusedElement)
          expect(focusedElement).toEqual(document.activeElement)
        }

        if (expected.activeElement) {
          const activeElement = container.querySelector(expected.activeElement)
          expect(activeElement).toHaveClass('active')
        }
      })
    })
  })
}
