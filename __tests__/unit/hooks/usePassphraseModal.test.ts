import {act, renderHook} from '@testing-library/react'
import {usePassphraseModal} from '@/hooks/usePassphraseModal'

describe('usePassphraseModal', () => {
    it('manages passphrase state and toggles', () => {
        const onSubmit = jest.fn()
        const {result} = renderHook(() => usePassphraseModal({busy: false, onSubmit}))

        act(() => result.current.setPassphrase('secret'))
        expect(result.current.passphrase).toBe('secret')

        act(() => result.current.setShowPassphrase(true))
        expect(result.current.showPassphrase).toBe(true)
    })

    it('calls onSubmit when not busy and has passphrase', () => {
        const onSubmit = jest.fn()
        const {result} = renderHook(() => usePassphraseModal({busy: false, onSubmit}))

        act(() => result.current.setPassphrase('go'))
        act(() => result.current.handleSubmit({preventDefault: jest.fn()} as any))
        expect(onSubmit).toHaveBeenCalledWith('go')
    })

    it('does not submit when busy', () => {
        const onSubmit = jest.fn()
        const {result} = renderHook(() => usePassphraseModal({busy: true, onSubmit}))

        act(() => result.current.setPassphrase('go'))
        act(() => result.current.handleSubmit({preventDefault: jest.fn()} as any))
        expect(onSubmit).not.toHaveBeenCalled()
    })
})

