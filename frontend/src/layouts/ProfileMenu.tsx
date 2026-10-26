import type { RefObject } from 'react'
import { Link } from 'react-router'
import type { User } from '../api/types'
import { Avatar, Badge, Icon, Popover } from '../components'
import { cx } from '../components/cx'
import styles from './HeaderMenu.module.css'
import { MY_NAV } from './nav'

interface Props {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  user: User
  onLogout: () => void
}

/** D-02 프로필 메뉴. 관리자 계정이면 G-09처럼 "관리자 콘솔" 항목이 붙는다 */
export function ProfileMenu({ open, onClose, anchorRef, user, onLogout }: Props) {
  const isAdmin = user.role === 'admin'
  const myItems = MY_NAV.filter((i) => i.to !== '/settings')
  return (
    <Popover open={open} onClose={onClose} anchorRef={anchorRef} width={320} label="프로필 메뉴" role="menu" autoFocus dim>
      <div className={styles.profileHead}>
        <Avatar character={user.avatar} name={user.nickname} size={52} />
        <div className={styles.profileText}>
          <span className={styles.profileName}>{user.nickname}</span>
          <span className={styles.profileMail}>{user.email}</span>
        </div>
      </div>
      <div className={styles.levelRow}>
        <span className={styles.levelLabel}>Lv.{user.level}</span>
        {user.streakDays > 0 && <span className={styles.profileMail}>{user.streakDays}일 연속 학습 중</span>}
      </div>

      <ul className={styles.menu}>
        {myItems.map((it) => (
          <li key={it.to}>
            <Link to={it.to} role="menuitem" className={styles.menuItem} onClick={onClose}>
              <Icon name={it.icon} size={16} className={styles.menuIcon} />
              {it.label}
            </Link>
          </li>
        ))}
        {isAdmin && (
          <li className={styles.adminBlock}>
            <Link to="/admin/reauth" role="menuitem" className={cx(styles.menuItem, styles.adminItem)} onClick={onClose}>
              <Icon name="key" size={16} />
              관리자 콘솔
              <Badge tone="cyan" mono>
                ADMIN
              </Badge>
              <Icon name="arrow-up-right" size={16} className={styles.adminArrow} />
            </Link>
            <p className={styles.adminNote}>관리자 권한이 있는 계정에만 보여요 · 누르면 2단계 인증</p>
          </li>
        )}
        <li className={styles.menuDivider} role="separator" />
        <li>
          <Link to="/settings" role="menuitem" className={styles.menuItem} onClick={onClose}>
            <Icon name="settings" size={16} className={styles.menuIcon} />
            설정
          </Link>
        </li>
        <li>
          <Link to="/support" role="menuitem" className={styles.menuItem} onClick={onClose}>
            <Icon name="question" size={16} className={styles.menuIcon} />
            도움말 · 문의
          </Link>
        </li>
        <li>
          <button type="button" role="menuitem" className={cx(styles.menuItem, styles.logout)} onClick={onLogout}>
            <Icon name="logout" size={16} />
            로그아웃
          </button>
        </li>
      </ul>
    </Popover>
  )
}
