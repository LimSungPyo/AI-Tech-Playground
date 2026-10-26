import type { ReactNode } from 'react'
import { cx } from '../../../components'
import styles from './SettingsCard.module.css'

/** 설정 묶음 카드(제목 + 줄 목록) */
export function SettingsCard({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={cx(styles.card, className)} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.rows}>{children}</div>
    </section>
  )
}

/** 왼쪽 제목 · 설명, 오른쪽 조작 요소 한 줄 */
export function SettingRow({
  title,
  description,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <p className={styles.rowTitle}>{title}</p>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      {children && <div className={styles.control}>{children}</div>}
    </div>
  )
}
