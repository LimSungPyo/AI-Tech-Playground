import type { CSSProperties } from 'react'
import { cx } from './cx'
import styles from './Skeleton.module.css'

export interface SkeletonProps {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  /** text: 글줄 · rect: 카드 · circle: 아바타 */
  shape?: 'text' | 'rect' | 'circle'
  /** text일 때 줄 수 */
  lines?: number
  className?: string
}

/** 로딩 자리 표시. 반짝이는 회색 면 */
export function Skeleton({ width, height, shape = 'rect', lines = 1, className }: SkeletonProps) {
  if (shape === 'text' && lines > 1) {
    return (
      <span className={cx(styles.stack, className)} aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className={cx(styles.sk, styles.text)} style={{ width: i === lines - 1 ? '60%' : width }} />
        ))}
      </span>
    )
  }
  return (
    <span
      aria-hidden
      className={cx(styles.sk, styles[shape], className)}
      style={{ width, height: shape === 'circle' ? (height ?? width) : height }}
    />
  )
}
