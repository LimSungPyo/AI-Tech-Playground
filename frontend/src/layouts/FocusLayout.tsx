import { Suspense } from 'react'
import { Link, Outlet, useMatches } from 'react-router'
import { Logo } from '../components'
import styles from './FocusLayout.module.css'
import { PageFallback } from './PageFallback'

/**
 * FocusLayout 오른쪽 위 문구. 라우트 `handle: { focusAction }`으로 바꾼다.
 * `to`가 없으면 링크 없이 글자만 보인다(예: E-01 "회원가입 1/3").
 */
export interface FocusAction {
  label: string
  to?: string
}

export interface FocusRouteHandle {
  focusAction?: FocusAction
}

const DEFAULT_ACTION: FocusAction = { label: '← 홈으로', to: '/' }

/** 가장 안쪽 라우트부터 handle.focusAction을 찾는다 */
function useFocusAction(): FocusAction {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const action = (matches[i].handle as FocusRouteHandle | undefined)?.focusAction
    if (action) return action
  }
  return DEFAULT_ACTION
}

/** 헤더 없이 가운데 카드만 있는 화면(로그인 · 가입 · 점검 · 관리자 로그인 · 온보딩). 로고 + 오른쪽 위 문구 */
export function FocusLayout() {
  const action = useFocusAction()
  return (
    <div className={styles.layout}>
      <header className={styles.top}>
        <Link to="/" aria-label="AI Tech Playground 홈">
          <Logo />
        </Link>
        {action.to ? (
          <Link to={action.to} className={styles.home}>
            {action.label}
          </Link>
        ) : (
          <span className={styles.home}>{action.label}</span>
        )}
      </header>
      <main id="main" className={styles.main}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
