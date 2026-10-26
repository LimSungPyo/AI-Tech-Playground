import type { ReactNode } from 'react'
import { cx } from './cx'
import styles from './Stat.module.css'

export interface StatProps {
  label: ReactNode
  value: ReactNode
  /** 단위(값 옆 작은 글자) */
  unit?: ReactNode
  /** 변화량 텍스트(+6%p). 숫자를 주면 부호로 색을 정한다 */
  delta?: ReactNode
  /** 변화 방향. 생략하면 delta가 숫자/문자열일 때 +/-로 추정 */
  trend?: 'up' | 'down' | 'flat'
  /** 아래 작은 설명(이번 주 +48m) */
  caption?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** 다크 카드 위 */
  onDark?: boolean
  className?: string
}

function guessTrend(delta: ReactNode): StatProps['trend'] {
  if (typeof delta === 'number') return delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  if (typeof delta === 'string') {
    if (delta.trim().startsWith('+')) return 'up'
    if (delta.trim().startsWith('-') || delta.trim().startsWith('−')) return 'down'
  }
  return 'flat'
}

/** 라벨 + 큰 숫자 + 델타(현재 성공률 58% · 어제보다 +6%p) */
export function Stat({ label, value, unit, delta, trend, caption, size = 'md', onDark, className }: StatProps) {
  const t = delta !== undefined ? (trend ?? guessTrend(delta)) : undefined
  return (
    <div className={cx(styles.stat, styles[size], onDark && styles.onDark, className)}>
      <span className={styles.label}>{label}</span>
      <span className={styles.row}>
        <span className={styles.value}>
          {value}
          {unit && <span className={styles.unit}>{unit}</span>}
        </span>
        {delta !== undefined && (
          <span className={cx(styles.delta, t && styles[t])}>
            {t === 'up' ? '▲ ' : t === 'down' ? '▼ ' : ''}
            {typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta}` : delta}
          </span>
        )}
      </span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </div>
  )
}
