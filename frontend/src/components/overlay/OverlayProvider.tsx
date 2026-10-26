import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ModalContext, ToastContext } from './context'
import type { ActionSheetOptions, AlertOptions, InfoOptions, ModalApi, NotifyOptions, ToastApi, ToastOptions } from './context'
import { ActionSheet, Alert, Info, Notify } from './Dialogs'
import { Toast } from './Toast'
import styles from './OverlayProvider.module.css'

type Entry =
  | { id: number; open: boolean; kind: 'alert'; opts: AlertOptions; resolve: (v: boolean) => void }
  | { id: number; open: boolean; kind: 'info'; opts: InfoOptions; resolve: (v: void) => void }
  | { id: number; open: boolean; kind: 'notify'; opts: NotifyOptions; resolve: (v: boolean) => void }
  | { id: number; open: boolean; kind: 'sheet'; opts: ActionSheetOptions<string>; resolve: (v: string | null) => void }

interface ToastEntry extends ToastOptions {
  id: string
  leaving: boolean
}

const EXIT_MS = 240

/** useModal() · useToast()를 쓸 수 있게 하는 전역 provider. App 최상단에 한 번 둔다 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const seq = useRef(0)
  const timers = useRef(new Map<string, number>())

  // ── 모달 ──
  const close = useCallback((id: number, settle: () => void) => {
    settle()
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, open: false } : e)))
    window.setTimeout(() => setEntries((list) => list.filter((e) => e.id !== id)), EXIT_MS)
  }, [])

  const push = useCallback(<T,>(make: (id: number, resolve: (v: T) => void) => Entry) => {
    return new Promise<T>((resolve) => {
      const id = ++seq.current
      setEntries((list) => [...list, make(id, resolve)])
    })
  }, [])

  const modal = useMemo<ModalApi>(
    () => ({
      alert: (opts) => push<boolean>((id, resolve) => ({ id, open: true, kind: 'alert', opts, resolve })),
      info: (opts) => push<void>((id, resolve) => ({ id, open: true, kind: 'info', opts, resolve })),
      notify: (opts) => push<boolean>((id, resolve) => ({ id, open: true, kind: 'notify', opts, resolve })),
      actionSheet: <V extends string>(opts: ActionSheetOptions<V>) =>
        push<string | null>((id, resolve) => ({
          id,
          open: true,
          kind: 'sheet',
          opts: opts as ActionSheetOptions<string>,
          resolve,
        })) as Promise<V | null>,
    }),
    [push],
  )

  // ── 토스트 ──
  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) window.clearTimeout(t)
    timers.current.delete(id)
    setToasts((list) => list.map((x) => (x.id === id ? { ...x, leaving: true } : x)))
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), EXIT_MS)
  }, [])

  const show = useCallback(
    (opts: ToastOptions) => {
      const id = `t${++seq.current}`
      setToasts((list) => [...list.slice(-3), { ...opts, id, leaving: false }])
      const duration = opts.duration ?? 3500
      if (duration > 0) timers.current.set(id, window.setTimeout(() => dismiss(id), duration))
      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => window.clearTimeout(t))
  }, [])

  const toast = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ModalContext.Provider value={modal}>
      <ToastContext.Provider value={toast}>
        {children}
        {entries.map((e) => {
          switch (e.kind) {
            case 'alert':
              return (
                <Alert
                  key={e.id}
                  open={e.open}
                  {...e.opts}
                  onConfirm={() => close(e.id, () => e.resolve(true))}
                  onCancel={() => close(e.id, () => e.resolve(false))}
                />
              )
            case 'info':
              return <Info key={e.id} open={e.open} {...e.opts} onClose={() => close(e.id, () => e.resolve())} />
            case 'notify':
              return (
                <Notify
                  key={e.id}
                  open={e.open}
                  {...e.opts}
                  onAccept={() => close(e.id, () => e.resolve(true))}
                  onClose={() => close(e.id, () => e.resolve(false))}
                />
              )
            case 'sheet':
              return (
                <ActionSheet
                  key={e.id}
                  open={e.open}
                  {...e.opts}
                  onSelect={(v) => close(e.id, () => e.resolve(v))}
                  onCancel={() => close(e.id, () => e.resolve(null))}
                />
              )
          }
        })}
        {toasts.length > 0 &&
          createPortal(
            <div className={styles.toasts} aria-live="polite">
              {toasts.map(({ id, leaving, duration: _d, ...t }) => (
                <Toast key={id} {...t} leaving={leaving} onClose={() => dismiss(id)} />
              ))}
            </div>,
            document.body,
          )}
      </ToastContext.Provider>
    </ModalContext.Provider>
  )
}
