import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { Badge } from './Chip'
import { GlassCard } from './GlassCard'
import { Mascot } from './Mascot'
import styles from './PagePlaceholder.module.css'

export interface PagePlaceholderProps {
  /** 화면 이름(예: "B-01 로그인") */
  title: string
  /** Figma node id(예: "60:8439"). 여러 개면 " · "로 이어 쓴다 */
  frame?: string
  /** 담당 · 메모 */
  note?: ReactNode
}

/** 페이지 slave가 채우기 전의 빈 자리. 화면 이름과 Figma node id만 보여 준다 */
export function PagePlaceholder({ title, frame, note }: PagePlaceholderProps) {
  const { pathname } = useLocation()
  return (
    <div className={styles.wrap}>
      <GlassCard radius="lg" padding="lg" className={styles.card}>
        <Mascot expression="training" size={96} float alt="" />
        <Badge tone="why" size="md">
          준비 중
        </Badge>
        <h1 className={styles.title}>{title}</h1>
        <dl className={styles.meta}>
          {frame && (
            <>
              <dt>Figma</dt>
              <dd>{frame}</dd>
            </>
          )}
          <dt>경로</dt>
          <dd>{pathname}</dd>
        </dl>
        {note && <p className={styles.note}>{note}</p>}
      </GlassCard>
    </div>
  )
}
