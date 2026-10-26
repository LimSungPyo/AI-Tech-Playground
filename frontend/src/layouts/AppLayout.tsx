import { Suspense } from 'react'
import { Outlet } from 'react-router'
import styles from './AppLayout.module.css'
import { Footer } from './Footer'
import { Header } from './Header'
import { PageFallback } from './PageFallback'

/** 일반 화면: 헤더 + 본문 + 푸터. 본문은 최대폭 1312px(좌우 64px) */
export function AppLayout() {
  return (
    <div className={styles.app}>
      <a href="#main" className={styles.skip}>
        본문으로 건너뛰기
      </a>
      <Header />
      <main id="main" className={styles.main}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
