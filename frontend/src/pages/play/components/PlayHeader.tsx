import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../../components'
import styles from './PlayHeader.module.css'

export interface PlayHeaderProps {
  code: string
  title: string
  backLabel: string
  /** 링크로 돌아가기 */
  backTo?: string
  /** 버튼으로 돌아가기(확인이 필요할 때) */
  onBack?: () => void
  children?: ReactNode
}

/** 플레이 · ×10 훈련 상단 줄: ← 돌아가기 · EXPERIMENT 코드 · 제목 · 오른쪽 도구 */
export function PlayHeader({ code, title, backLabel, backTo, onBack, children }: PlayHeaderProps) {
  const back = (
    <>
      <Icon name="arrow-left" size={16} />
      {backLabel}
    </>
  )
  return (
    <header className={styles.header}>
      {backTo ? (
        <Link to={backTo} className={styles.back}>
          {back}
        </Link>
      ) : (
        <button type="button" className={styles.back} onClick={onBack}>
          {back}
        </button>
      )}
      <div className={styles.titles}>
        <span className={styles.eyebrow}>EXPERIMENT {code}</span>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.tools}>{children}</div>
    </header>
  )
}

/** TRIAL 12 / 100 카드 */
export function TrialCounter({ value, max }: { value: ReactNode; max?: number }) {
  return (
    <span className={styles.trial} aria-label={`Trial ${value}${max ? ` / ${max}` : ''}`}>
      <small>TRIAL</small>
      <strong>{value}</strong>
      {max !== undefined && <em>/ {max}</em>}
    </span>
  )
}
