import { create } from 'zustand'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  kind: ToastKind
}

interface ToastState {
  toasts: Toast[]
  show: (message: string, kind?: ToastKind) => void
  dismiss: (id: string) => void
}

const TTL_MS = 3500

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, kind = 'success') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }))
    setTimeout(() => get().dismiss(id), TTL_MS)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Convenience helpers usable from non-component code. */
export const toast = {
  success: (m: string) => useToast.getState().show(m, 'success'),
  error: (m: string) => useToast.getState().show(m, 'error'),
  info: (m: string) => useToast.getState().show(m, 'info'),
}
