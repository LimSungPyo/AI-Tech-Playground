import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Avatar, Badge, Button, Icon, IconButton, Logo, useModal } from '../components'
import { cx } from '../components/cx'
import styles from './Header.module.css'
import { MAIN_NAV, loginPath } from './nav'
import { NotificationMenu } from './NotificationMenu'
import { ProfileMenu } from './ProfileMenu'

/** 상단 헤더: 로고 + 가운데 유리 pill 내비 + 오른쪽(비회원: Tech Drop · 로그인 / 회원: 벨 · 프로필 칩) */
export function Header() {
  const { user, isMember, status, logout } = useAuth()
  const modal = useModal()
  const navigate = useNavigate()
  const loc = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState<'notifications' | 'profile' | null>(null)
  const [unread, setUnread] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)
  const profileRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 이동하면 열린 메뉴를 닫는다(렌더 중 이전 경로와 비교)
  const [menuPath, setMenuPath] = useState(loc.pathname)
  if (menuPath !== loc.pathname) {
    setMenuPath(loc.pathname)
    setMenu(null)
  }

  const onLogout = async () => {
    setMenu(null)
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
    <header className={cx(styles.header, scrolled && styles.scrolled)}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="AI Tech Playground 홈">
          <Logo />
        </Link>

        <nav className={styles.nav} aria-label="주 메뉴">
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cx(styles.navItem, isActive && styles.navActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.right}>
          {status === 'loading' ? null : isMember && user ? (
            <>
              <IconButton
                ref={bellRef}
                icon="bell"
                label={unread ? '알림 · 안 읽은 알림 있음' : '알림'}
                dot={unread}
                aria-haspopup="dialog"
                aria-expanded={menu === 'notifications'}
                onClick={() => setMenu((m) => (m === 'notifications' ? null : 'notifications'))}
              />
              <button
                ref={profileRef}
                type="button"
                className={styles.profile}
                aria-haspopup="menu"
                aria-expanded={menu === 'profile'}
                onClick={() => setMenu((m) => (m === 'profile' ? null : 'profile'))}
              >
                <Avatar character={user.avatar} name={user.nickname} size={34} />
                <span className={styles.nick}>{user.nickname}</span>
                <span className={styles.level}>Lv.{user.level}</span>
                <Icon name="chevron-down" size={14} className={styles.caret} />
              </button>
              <NotificationMenu
                open={menu === 'notifications'}
                onClose={() => setMenu(null)}
                anchorRef={bellRef}
                onUnreadChange={setUnread}
              />
              <ProfileMenu
                open={menu === 'profile'}
                onClose={() => setMenu(null)}
                anchorRef={profileRef}
                user={user}
                onLogout={onLogout}
              />
            </>
          ) : (
            <>
              <Link to="/experiments/001" className={styles.techDrop}>
                <span>Tech Drop #001</span>
                <Badge tone="danger">NEW</Badge>
              </Link>
              <Button variant="secondary" to={loginPath(loc)}>
                로그인
              </Button>
              <Button variant="primary" to="/signup" className={styles.signup}>
                무료로 시작하기
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
