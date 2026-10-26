import type { ReactNode } from 'react'
import type { MascotExpression } from '../api/types'
import { cx } from './cx'
import { Mascot } from './Mascot'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  /** 드로시 표정(기본 sleep) */
  expression?: MascotExpression
  /** 그림 대신 쓸 요소 */
  illustration?: ReactNode
  action?: ReactNode
  compact?: boolean
  className?: string
}

/** 빈 목록 · 오류 · 준비 중 안내 */
export function EmptyState({
  title,
  description,
  expression = 'sleep',
  illustration,
  action,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, compact && styles.compact, className)}>
      {illustration ?? <Mascot expression={expression} size={compact ? 72 : 120} alt="" />}
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.desc}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
