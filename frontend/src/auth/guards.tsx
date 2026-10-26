import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Spinner } from '../components/Spinner'
import { useAuth } from './useAuth'
import styles from './guards.module.css'

function currentPath(loc: { pathname: string; search: string; hash: string }) {
  return encodeURIComponent(loc.pathname + loc.search + loc.hash)
}

function Checking() {
  return (
    <div className={styles.checking} role="status" aria-live="polite">
      <Spinner size="lg" />
      <span className="sr-only">로그인 상태를 확인하고 있어요</span>
    </div>
  )
}

/** 회원 전용. 비회원이면 `/login-required?returnTo=` (E-06) */
export function RequireMember({ children }: { children?: ReactNode }) {
  const { status } = useAuth()
  const loc = useLocation()
  if (status === 'loading') return <Checking />
  if (status !== 'member') return <Navigate to={`/login-required?returnTo=${currentPath(loc)}`} replace />
  return children ?? <Outlet />
}

/** 관리자 전용. 관리자 아니면 `/`, 재인증 토큰이 없으면 `/admin/reauth?returnTo=` (G-10) */
export function RequireAdmin({ children }: { children?: ReactNode }) {
  const { status, isAdmin, adminToken } = useAuth()
  const loc = useLocation()
  if (status === 'loading') return <Checking />
  // 관리자 2단계 로그인(F-01)만 거친 경우(회원 토큰 없이 재인증 토큰만 있음)도 콘솔에 들어갈 수 있다
  if (adminToken) return children ?? <Outlet />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Navigate to={`/admin/reauth?returnTo=${currentPath(loc)}`} replace />
}
