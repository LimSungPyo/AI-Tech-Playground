import { createContext } from 'react'
import type { ReactNode } from 'react'
import type { ActionSheetOption } from './Dialogs'
import type { ToastProps } from './Toast'

export interface AlertOptions {
  title: ReactNode
  message?: ReactNode
  media?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
}
export interface InfoOptions {
  title: ReactNode
  message?: ReactNode
  media?: ReactNode
  confirmLabel?: string
}
export interface NotifyOptions {
  title: ReactNode
  message?: ReactNode
  media?: ReactNode
  acceptLabel?: string
  closeLabel?: string
}
export interface ActionSheetOptions<V extends string> {
  title?: ReactNode
  message?: ReactNode
  options: ActionSheetOption<V>[]
  cancelLabel?: string
}

export interface ModalApi {
  /** 예 → true, 아니요/닫기 → false */
  alert: (opts: AlertOptions) => Promise<boolean>
  /** 확인 또는 닫기 → 끝 */
  info: (opts: InfoOptions) => Promise<void>
  /** 수락 → true, 닫기 → false */
  notify: (opts: NotifyOptions) => Promise<boolean>
  /** 고른 value, 취소 → null */
  actionSheet: <V extends string>(opts: ActionSheetOptions<V>) => Promise<V | null>
}

export interface ToastOptions extends Omit<ToastProps, 'leaving' | 'onClose' | 'className'> {
  /** ms. 0이면 직접 닫을 때까지. 기본 3500 */
  duration?: number
}

export interface ToastApi {
  show: (opts: ToastOptions) => string
  dismiss: (id: string) => void
}

export const ModalContext = createContext<ModalApi | null>(null)
export const ToastContext = createContext<ToastApi | null>(null)
