import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ADMIN_REAUTH_MINUTES, getAdminTokenIssuedAt } from '../auth/storage'
import { useAuth } from '../auth/useAuth'
import { Avatar, Badge, Icon, Logo } from '../components'
import { cx } from '../components/cx'
import styles from './AdminLayout.module.css'
import { ADMIN_NAV } from './nav'
import { PageFallback } from './PageFallback'

function useReauthRemaining() {
  const { adminToken, setAdminToken } = useAuth()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const issued = adminToken ? getAdminTokenIssuedAt() : null
  const remaining = issued === null ? null : Math.max(0, issued + ADMIN_REAUTH_MINUTES * 60_000 - now)
  useEffect(() => {
    // 재인증 시간이 끝나면 토큰을 버린다 → RequireAdmin이 재인증 화면으로 보낸다
    if (remaining === 0) setAdminToken(null)
  }, [remaining, setAdminToken])
  return remaining
}

function formatRemaining(ms: number) {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** 관리자 콘솔(F-02): 좌측 다크 내비 + 상단 바(관리자 표시 · 재인증 남은 시간 · 사이트로 돌아가기) */
export function AdminLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const remaining = useReauthRemaining()
  const group =
    ADMIN_NAV.find((g) => g.items.some((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to))))?.group ?? '운영'
  const name = user?.nickname ?? '관리자'

  return (
    <div className={styles.layout}>
      <aside className={styles.nav} aria-label="관리자 메뉴">
        <Link to="/admin" className={styles.brand}>
          <Logo text="Playground" onDark />
          <Badge tone="cyan" mono size="md">
            ADMIN
          </Badge>
        </Link>
        <nav className={styles.groups}>
          {ADMIN_NAV.map((g) => (
            <div key={g.group}>
              <p className={styles.group}>{g.group}</p>
              <ul>
                {g.items.map((it) => (
                  <li key={it.to}>
                    <NavLink to={it.to} end={it.end} className={({ isActive }) => cx(styles.item, isActive && styles.active)}>
                      <Icon name={it.icon} size={16} className={styles.icon} />
                      {it.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className={styles.me}>
          <Avatar name={name} size={32} />
          <div>
            <p className={styles.meName}>{name}</p>
            <p className={styles.meRole}>관리자</p>
          </div>
        </div>
      </aside>

      <div className={styles.body}>
        <div className={styles.topbar}>
          <span className={styles.crumb}>ADMIN / {group}</span>
          <div className={styles.topRight}>
            <Badge tone="success" mono size="md">
              PRODUCTION
            </Badge>
            {remaining !== null && (
              <span className={cx(styles.timer, remaining < 5 * 60_000 && styles.timerLow)} title="관리자 재인증 남은 시간">
                <Icon name="clock" size={14} />
                재인증 {formatRemaining(remaining)}
              </span>
            )}
            <Link to="/" className={styles.back}>
              사용자 화면 보기 <Icon name="arrow-up-right" size={14} />
            </Link>
          </div>
        </div>
        <main id="main" className={styles.main}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
