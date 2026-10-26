import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '../Button'
import { cx } from '../cx'
import { Icon } from '../Icon'
import styles from './Banner.module.css'

export interface BannerProps {
  title: ReactNode
  description?: ReactNode
  /** 왼쪽 원형 아이콘 자리(기본 별) */
  icon?: ReactNode
  /** 누르면 이동 */
  to?: string
  onClick?: () => void
  className?: string
}

/** Banner · 목록형 (★ 배지를 받았어요 · ×10 훈련왕 ›). 누르면 이동하거나 onClick */
export function Banner({ title, description, icon, to, onClick, className }: BannerProps) {
  const content = (
    <>
      <span className={styles.icon}>{icon ?? <Icon name="star" size={18} />}</span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.desc}>{description}</span>}
      </span>
      {(to || onClick) && <Icon name="chevron-right" size={18} className={styles.chevron} />}
    </>
  )
  const cls = cx(styles.banner, (to || onClick) && styles.clickable, className)
  if (to)
    return (
      <Link to={to} className={cls} onClick={onClick}>
        {content}
      </Link>
    )
  if (onClick)
    return (
      <button type="button" className={cls} onClick={onClick}>
        {content}
      </button>
    )
  return <div className={cls}>{content}</div>
}

export interface BannerActionProps {
  title: ReactNode
  description?: ReactNode
  actionLabel: string
  onAction?: () => void
  /** 버튼 대신 링크 */
  to?: string
  icon?: ReactNode
  className?: string
}

/** Banner · 버튼형 (문의 답변이 도착했어요 · T-2058 [보기]) */
export function BannerAction({ title, description, actionLabel, onAction, to, icon, className }: BannerActionProps) {
  return (
    <div className={cx(styles.banner, className)}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.desc}>{description}</span>}
      </span>
      {to ? (
        <Button variant="secondary" size="sm" to={to} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
