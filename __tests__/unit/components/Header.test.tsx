import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {Header} from '@/components/Header'

// Mock @headlessui/react to simplify Transition/Dialog behavior in tests
jest.mock('@headlessui/react', () => {
    const MockDialogTitle = ({children, className, as: As = 'h3', ...props}: any) => (
        <As className={className} {...props}>
            {children}
        </As>
    )

    const MockDialogPanel = ({children, className, ...props}: any) => (
        <div className={className} {...props}>
            {children}
        </div>
    )

    const MockTransition = ({children, show}: any) => {
        if (!show) return null
        return <>{children}</>
    }
    const MockTransitionChild = ({children}: any) => <>{children}</>
    MockTransition.Child = MockTransitionChild

    const MockDialog = ({children, className, onClose}: any) => (
        <div
            role="dialog"
            aria-modal="true"
            className={className}
            onClick={(e: React.MouseEvent) => {
                if (e.target === e.currentTarget && typeof onClose === 'function') onClose()
            }}
        >
            {children}
        </div>
    )

    return {
        Transition: MockTransition,
        Dialog: Object.assign(MockDialog, {Title: MockDialogTitle, Panel: MockDialogPanel}),
        Fragment: React.Fragment,
    }
})

// Mock OpenRouter context hook to avoid provider requirements
jest.mock('@/hooks/useOpenRouter', () => ({
    useOpenRouter: () => ({
        state: {
            isConnected: false,
            models: [],
            filteredModels: [],
            credits: null,
            searchQuery: '',
            filter: 'all',
            error: null,
            namedKeyNames: [],
            lastUsedKeyName: undefined,
            selectedModelId: undefined,
        },
        setSearchQuery: jest.fn(),
        setFilter: jest.fn(),
        connectWithPlainKey: jest.fn(),
        saveEncryptedKeyNamed: jest.fn(),
        loadEncryptedKeyByName: jest.fn(),
        refreshNamedKeyNames: jest.fn(),
        deleteNamedKey: jest.fn(),
        disconnect: jest.fn(),
        refreshModels: jest.fn(),
        selectModel: jest.fn(),
        sendChat: jest.fn(),
    }),
}))

// Mock session persistence to avoid touching storage
jest.mock('@/hooks/useSessionPersistence', () => ({
    useSessionPersistence: () => ({
        sessions: [],
        restoreSession: jest.fn(),
        deleteSession: jest.fn(),
        clearAll: jest.fn(),
        showRestoreBanner: false,
        lastSessionSummary: null,
        isRestoring: false,
        restoreProgress: null,
        cancelRestore: jest.fn(),
        restoreLastSession: jest.fn(),
        dismissRestoreBanner: jest.fn(),
    }),
}))

describe('Header - OpenRouter modal', () => {
    test('opens OpenRouter settings modal on button click', () => {
        render(<Header/>)

        // Modal should not be present initially
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

        // Click the OpenRouter button
        fireEvent.click(screen.getByRole('button', {name: 'OpenRouter'}))

        // Modal should now be visible with the correct title
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByRole('heading', {name: 'OpenRouter Settings'})).toBeInTheDocument()
    })
})

