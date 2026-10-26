import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  /** 0~max */
  value: number
  max?: number
  tone?: 'indigo' | 'success' | 'dark' | 'why' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** 왼쪽 위 라벨 */
  label?: ReactNode
  /** 오른쪽 값 표시(예: "Trial 34 / 100"). true면 퍼센트 */
  valueLabel?: ReactNode | true
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'indigo',
  size = 'md',
  label,
  valueLabel,
  className,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const right = valueLabel === true ? `${Math.round(pct)}%` : valueLabel
  return (
    <div className={cx(styles.wrap, className)}>
      {(label || right) && (
        <div className={styles.head}>
          <span className={styles.label}>{label}</span>
          {right && <span className={cx(styles.value, styles[`text-${tone}`])}>{right}</span>}
        </div>
      )}
      <div
        className={cx(styles.track, styles[size])}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <div className={cx(styles.fill, styles[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
