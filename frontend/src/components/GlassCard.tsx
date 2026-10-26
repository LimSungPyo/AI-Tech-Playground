import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import styles from './GlassCard.module.css'

export type GlassVariant = 'clear' | 'nested' | 'tint' | 'dark'
export type GlassPadding = 'none' | 'sm' | 'md' | 'lg'

export interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  variant?: GlassVariant
  padding?: GlassPadding
  /** 호버 시 떠오름 + 포인터 */
  interactive?: boolean
  /** 반경: card 24 · lg 28 · popup 30 */
  radius?: 'card' | 'lg' | 'popup'
  as?: ElementType
  children?: ReactNode
}

export function GlassCard({
  variant = 'clear',
  padding = 'md',
  interactive = false,
  radius = 'card',
  as: Tag = 'div',
  className,
  ...rest
}: GlassCardProps) {
  return (
    <Tag
      className={cx(
        styles.card,
        styles[variant],
        styles[`pad-${padding}`],
        styles[`r-${radius}`],
        interactive && styles.interactive,
        className,
      )}
      {...rest}
    />
  )
}
