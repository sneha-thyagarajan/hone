import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast, useToast } from '../toast'

beforeEach(() => {
  useToast.setState({ toasts: [] })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toast store', () => {
  it('adds a toast with show()', () => {
    toast.success('Saved')
    const { toasts } = useToast.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]).toMatchObject({ message: 'Saved', kind: 'success' })
  })

  it('supports error and info kinds', () => {
    toast.error('Nope')
    toast.info('FYI')
    const kinds = useToast.getState().toasts.map((t) => t.kind)
    expect(kinds).toEqual(['error', 'info'])
  })

  it('dismisses by id', () => {
    useToast.getState().show('a')
    const id = useToast.getState().toasts[0].id
    useToast.getState().dismiss(id)
    expect(useToast.getState().toasts).toHaveLength(0)
  })

  it('auto-dismisses after the TTL', () => {
    toast.success('bye')
    expect(useToast.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(3500)
    expect(useToast.getState().toasts).toHaveLength(0)
  })
})
