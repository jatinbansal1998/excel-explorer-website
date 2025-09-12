import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {PassphraseModalView} from '@/components/presentational/openrouter'

describe('PassphraseModalView (presentational)', () => {
    function setup(extraProps: Partial<React.ComponentProps<typeof PassphraseModalView>> = {}) {
        const props: React.ComponentProps<typeof PassphraseModalView> = {
            isOpen: true,
            onClose: jest.fn(),
            error: null,
            busy: false,
            passphrase: '',
            showPassphrase: false,
            onPassphraseChange: jest.fn(),
            onToggleShowPassphrase: jest.fn(),
            onSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
            ...extraProps,
        }
        render(<PassphraseModalView {...props} />)
        return props
    }

    it('disables submit when passphrase is empty', () => {
        setup({passphrase: ''})
        const btn = screen.getByRole('button', {name: 'Decrypt & Connect'})
        expect(btn).toBeDisabled()
    })

    it('calls handlers for toggle, cancel and submit', () => {
        const props = setup({passphrase: 'secret'})
        const toggle = screen.getByRole('button', {name: ''}) // eye button has aria-hidden, no text
        fireEvent.click(toggle)
        expect(props.onToggleShowPassphrase).toHaveBeenCalled()

        const cancel = screen.getByRole('button', {name: 'Cancel'})
        fireEvent.click(cancel)
        expect(props.onClose).toHaveBeenCalled()

        const submit = screen.getByRole('button', {name: 'Decrypt & Connect'})
        fireEvent.click(submit)
        expect(props.onSubmit).toHaveBeenCalled()
    })
})
