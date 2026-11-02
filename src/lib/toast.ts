import { create } from 'zustand'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: string
  kind: ToastKind
  action?: ToastAction
}

export interface ShowOptions {
  kind?: ToastKind
  action?: ToastAction
  ttl?: number
}

interface ToastState {
  toasts: Toast[]
  show: (message: string, kindOrOpts?: ToastKind | ShowOptions) => void
  dismiss: (id: string) => void
}

const DEFAULT_TTL = 3500
const ACTION_TTL = 6000 // toasts with actions stay longer

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, kindOrOpts) => {
    const opts: ShowOptions =
      typeof kindOrOpts === 'string' ? { kind: kindOrOpts } : (kindOrOpts ?? {})
    const kind = opts.kind ?? 'success'
    const ttl = opts.ttl ?? (opts.action ? ACTION_TTL : DEFAULT_TTL)
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, kind, action: opts.action }] }))
    setTimeout(() => get().dismiss(id), ttl)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Convenience helpers usable from non-component code. */
export const toast = {
  success: (m: string) => useToast.getState().show(m, 'success'),
  error: (m: string) => useToast.getState().show(m, 'error'),
  info: (m: string) => useToast.getState().show(m, 'info'),
  successWithAction: (m: string, action: ToastAction) =>
    useToast.getState().show(m, { kind: 'success', action }),
}
