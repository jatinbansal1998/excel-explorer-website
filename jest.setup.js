require('@testing-library/jest-dom')
const {configure} = require('@testing-library/react')
require('whatwg-fetch')

// Configure testing-library
configure({
    testIdAttribute: 'data-testid',
    throwSuggestions: true,
})

// Mock next/router
jest.mock('next/router', () => ({
    useRouter() {
        return {
            route: '/',
            pathname: '/',
            query: {},
            asPath: '/',
            push: jest.fn(),
            pop: jest.fn(),
            reload: jest.fn(),
            back: jest.fn(),
            prefetch: jest.fn().mockResolvedValue(undefined),
            beforePopState: jest.fn(),
            events: {
                on: jest.fn(),
                off: jest.fn(),
                emit: jest.fn(),
            },
            isFallback: false,
        }
    },
}))

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation((props) => {
        // Return a simple img element mock
        return {
            type: 'img',
            props: {...props, alt: props.alt || ''}
        }
    }),
}))

// Global test setup
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}))

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})
