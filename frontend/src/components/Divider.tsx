import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './Divider.module.css'

export interface DividerProps {
  /** 가운데 글자(또는 이메일로) */
  label?: ReactNode
  vertical?: boolean
  className?: string
}

export function Divider({ label, vertical, className }: DividerProps) {
  if (vertical) return <span role="separator" aria-orientation="vertical" className={cx(styles.vertical, className)} />
  if (!label) return <hr className={cx(styles.line, className)} />
  return (
    <div role="separator" className={cx(styles.labeled, className)}>
      <span>{label}</span>
    </div>
  )
}
