import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import styles from './Chip.module.css'

export type BadgeTone = 'indigo' | 'success' | 'danger' | 'warning' | 'why' | 'pink' | 'neutral' | 'dark' | 'cyan' | 'solid'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  size?: 'sm' | 'md'
  /** 앞에 작은 점 */
  dot?: boolean
  /** JetBrains Mono 대문자 라벨(CONTINUE, ADMIN 등) */
  mono?: boolean
  icon?: ReactNode
}

/** 상태 · 강조 라벨(미션 2 해금됨!, NEW, Lv.7 탐험가, ADMIN) */
export function Badge({ tone = 'indigo', size = 'sm', dot, mono, icon, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], styles[size], mono && styles.mono, className)} {...rest}>
      {dot && <span className={styles.dot} aria-hidden />}
      {icon}
      {children}
    </span>
  )
}

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  icon?: ReactNode
  /** 오른쪽 숫자 */
  count?: number
}

/** 선택 칩(필터 · 관심사 선택). 선택되면 인디고 */
export function Chip({ selected, icon, count, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(styles.chip, selected && styles.selected, className)}
      {...rest}
    >
      {icon}
      {children}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  )
}

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode
}

/** 정보 태그(최전선 · 10분 · 강화학습). 흰 유리 pill */
export function Tag({ icon, className, children, ...rest }: TagProps) {
  return (
    <span className={cx(styles.tag, className)} {...rest}>
      {icon}
      {children}
    </span>
  )
}
