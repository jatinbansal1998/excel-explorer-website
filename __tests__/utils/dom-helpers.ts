import {screen} from '@testing-library/react'

// Simple DOM helpers to reduce repetition in tests
export const q = (selector: string, root: Document | Element = document) =>
    root.querySelector(selector)

export const qa = (selector: string, root: Document | Element = document) =>
    root.querySelectorAll(selector)

export function expectHasClasses(el: Element | null, classes: string[]) {
    expect(el).toBeInTheDocument()
    expect(el).toHaveClass(...classes)
}

export function expectLacksClasses(el: Element | null, classes: string[]) {
    expect(el).toBeInTheDocument()
    classes.forEach((c) => expect(el).not.toHaveClass(c))
}

export function byRole(name: string, options?: Parameters<typeof screen.getByRole>[1]) {
    return screen.getByRole(name as any, options as any)
}

