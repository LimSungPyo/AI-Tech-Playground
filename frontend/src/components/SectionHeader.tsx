import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from './cx'
import styles from './SectionHeader.module.css'

export interface SectionHeaderProps {
  /** 위 작은 영문 라벨(HOW IT WORKS · CONTINUE) */
  eyebrow?: ReactNode
  title: ReactNode
  /** 제목 옆(작게) 또는 아래 설명 */
  description?: ReactNode
  /** description을 제목 옆에 붙일지(B-02 "오늘의 추천 AI 안내자가…") */
  inlineDescription?: boolean
  /** 오른쪽 링크 */
  link?: { to: string; label: ReactNode }
  /** 오른쪽 임의 요소(link 대신) */
  right?: ReactNode
  level?: 1 | 2 | 3
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  inlineDescription,
  link,
  right,
  level = 2,
  className,
}: SectionHeaderProps) {
  const H = `h${level}` as 'h1' | 'h2' | 'h3'
  return (
    <div className={cx(styles.header, className)}>
      <div className={styles.left}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <div className={cx(styles.titleRow, inlineDescription && styles.inline)}>
          <H className={cx(styles.title, styles[`h${level}`])}>{title}</H>
          {description && <p className={styles.desc}>{description}</p>}
        </div>
      </div>
      {right ??
        (link && (
          <Link to={link.to} className={styles.link}>
            {link.label}
          </Link>
        ))}
    </div>
  )
}
