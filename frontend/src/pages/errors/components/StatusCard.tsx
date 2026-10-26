import type { ReactNode } from 'react'
import styles from './StatusCard.module.css'

interface StatusCardProps {
  /** 큰 숫자(404 등) */
  code?: string
  media: ReactNode
  title: ReactNode
  description: ReactNode
  /** 설명 아래 칩(returnTo · 예상 종료) */
  extra?: ReactNode
  children: ReactNode
}

/** E-06 · E-11 · E-12 공통: 가운데 유리 카드 + 드로시 + 제목 + 버튼 */
export function StatusCard({ code, media, title, description, extra, children }: StatusCardProps) {
  return (
    <div className={styles.wrap}>
      <section className={styles.card} aria-labelledby="status-title">
        {code && (
          <p className={styles.code} aria-hidden="true">
            {code}
          </p>
        )}
        <div className={styles.media}>{media}</div>
        <h1 id="status-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.desc}>{description}</p>
        {extra && <div className={styles.extra}>{extra}</div>}
        <div className={styles.actions}>{children}</div>
      </section>
    </div>
  )
}
