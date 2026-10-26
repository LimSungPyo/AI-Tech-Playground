import type { ReactNode } from 'react'
import { cx } from '../cx'
import { Icon } from '../Icon'
import type { IconName } from '../Icon'
import styles from './Toast.module.css'

export type ToastTone = 'default' | 'success' | 'danger' | 'why'

export interface ToastProps {
  title: ReactNode
  description?: ReactNode
  tone?: ToastTone
  icon?: IconName
  action?: { label: string; onClick: () => void }
  onClose?: () => void
  /** 등장/퇴장 상태(ToastProvider가 넘긴다) */
  leaving?: boolean
  className?: string
}

const toneIcon: Record<ToastTone, IconName> = {
  default: 'bell',
  success: 'check',
  danger: 'warning',
  why: 'sparkle',
}

/** 화면 위쪽에 잠깐 떴다 사라지는 알림(08:M-03). 보통 useToast()로 띄운다 */
export function Toast({ title, description, tone = 'default', icon, action, onClose, leaving, className }: ToastProps) {
  return (
    <div className={cx(styles.toast, styles[tone], leaving && styles.leaving, className)} role="status">
      <span className={styles.icon}>
        <Icon name={icon ?? toneIcon[tone]} size={18} />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.desc}>{description}</span>}
      </span>
      {action && (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {onClose && (
        <button type="button" className={styles.close} onClick={onClose} aria-label="알림 닫기">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}
