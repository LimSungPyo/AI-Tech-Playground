import type { ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './BackLink.module.css'

/** 제목 위 "← 설정" 되돌아가기 */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={styles.back}>
      ← {children}
    </Link>
  )
}
