import type { ReactNode } from 'react'
import styles from './my.module.css'

/** 마이 영역 페이지 제목(내 실험 · 내 캐릭터 · 배지 · 학습 기록) */
export function PageTitle({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className={styles.pageHead}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {sub && <div className={styles.pageSub}>{sub}</div>}
      </div>
      {right && <div className={styles.pageRight}>{right}</div>}
    </header>
  )
}
