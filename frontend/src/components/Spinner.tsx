import { cx } from './cx'
import styles from './Spinner.module.css'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  /** inherit: 글자색을 따른다(버튼 안) */
  tone?: 'indigo' | 'inherit'
  label?: string
  className?: string
}

export function Spinner({ size = 'md', tone = 'indigo', label, className }: SpinnerProps) {
  return (
    <span
      className={cx(styles.spinner, styles[size], styles[tone], className)}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
