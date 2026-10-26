import type { ReactNode } from 'react'
import { cx } from '../../../components'
import styles from './AuthShell.module.css'

/** 관리자 인증 화면 바탕 + 가운데 흰 카드 */
export function AuthShell({
  tone = 'dark',
  wide,
  label,
  children,
}: {
  tone?: 'dark' | 'light'
  wide?: boolean
  label: string
  children: ReactNode
}) {
  return (
    <div className={cx(styles.shell, styles[tone])}>
      <section className={cx(styles.card, wide && styles.wide)} aria-label={label}>
        {children}
      </section>
    </div>
  )
}

export function AdminConsoleBadge() {
  return <span className={styles.adminBadge}>ADMIN CONSOLE</span>
}
