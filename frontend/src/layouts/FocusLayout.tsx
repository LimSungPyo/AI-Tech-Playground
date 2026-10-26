import { Suspense } from 'react'
import { Link, Outlet } from 'react-router'
import { Logo } from '../components'
import styles from './FocusLayout.module.css'
import { PageFallback } from './PageFallback'

/** 헤더 없이 가운데 카드만 있는 화면(로그인 · 가입 · 점검 · 관리자 로그인). 로고 + 홈으로 */
export function FocusLayout() {
  return (
    <div className={styles.layout}>
      <header className={styles.top}>
        <Link to="/" aria-label="AI Tech Playground 홈">
          <Logo />
        </Link>
        <Link to="/" className={styles.home}>
          ← 홈으로
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
