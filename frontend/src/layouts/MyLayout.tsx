import { Suspense } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Avatar, Icon, useModal } from '../components'
import { cx } from '../components/cx'
import styles from './MyLayout.module.css'
import { MY_NAV } from './nav'
import { PageFallback } from './PageFallback'

/** 마이 영역(C-02 좌측 사이드바 + 본문). AppLayout 안에서 쓴다 */
export function MyLayout() {
  const { user, logout } = useAuth()
  const modal = useModal()
  const navigate = useNavigate()

  const onLogout = async () => {
    const ok = await modal.alert({
      title: '로그아웃할까요?',
      message: '진행 중인 훈련은 자동 저장돼요.\n다음에 이어서 할 수 있어요.',
      confirmLabel: '로그아웃',
      cancelLabel: '취소',
    })
    if (!ok) return
    await logout()
    navigate('/')
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="마이 메뉴">
        {user && (
          <div className={styles.me}>
            <Avatar character={user.avatar} name={user.nickname} size={48} />
            <div>
              <p className={styles.name}>{user.nickname}</p>
              <p className={styles.level}>
                Lv.{user.level}
                {user.title ? ` ${user.title}` : ''}
              </p>
            </div>
          </div>
        )}
        <nav>
          <ul className={styles.nav}>
            {MY_NAV.map((it) => (
              <li key={it.to}>
                <NavLink to={it.to} end={it.end} className={({ isActive }) => cx(styles.item, isActive && styles.active)}>
                  <Icon name={it.icon} size={16} className={styles.icon} />
                  {it.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" className={cx(styles.item, styles.logout)} onClick={onLogout}>
          <Icon name="logout" size={16} className={styles.icon} />
          로그아웃
        </button>
      </aside>
      <div className={styles.content}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
