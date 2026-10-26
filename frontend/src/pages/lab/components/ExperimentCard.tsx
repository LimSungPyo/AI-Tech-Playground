import { Link } from 'react-router'
import type { ExperimentSummary } from '../../../api/types'
import { Badge, Button, Character, ProgressBar, Tag, cx } from '../../../components'
import { LEVEL_LABEL, STATE_LABEL, STATE_TONE, thumbBg } from '../experimentMeta'
import type { CardState } from '../experimentMeta'
import styles from './ExperimentCard.module.css'

export interface ExperimentCardProps {
  exp: ExperimentSummary
  state: CardState
  /** 카드 아래 한 줄(진행 · 결과 · 해금 조건) */
  caption: string
  action: { label: string; to?: string; onClick?: () => void; primary?: boolean }
}

/** G-01 실험 카드: 위 캐릭터 썸네일 + 아래 코드 · 난이도 · 제목 · 진행 · 버튼 */
export function ExperimentCard({ exp, state, caption, action }: ExperimentCardProps) {
  const locked = state === 'locked'
  const showBar = state === 'in_progress' && exp.progress
  // 카드 본문 클릭은 상세로. 잠김 · 오픈 예정은 버튼만 동작한다
  const detailTo = state === 'locked' || state === 'coming_soon' || state === 'voting' ? undefined : `/experiments/${exp.id}`
  const actionEl = action.to ? (
    <Button size="md" variant={action.primary ? 'primary' : 'secondary'} to={action.to} className={styles.action}>
      {action.label}
    </Button>
  ) : (
    <Button size="md" variant={action.primary ? 'primary' : 'secondary'} onClick={action.onClick} className={styles.action}>
      {action.label}
    </Button>
  )

  return (
    <article className={cx(styles.card, locked && styles.locked)}>
      <div className={styles.thumb} style={{ background: locked ? undefined : thumbBg(exp.thumbnailColor) }}>
        <Badge tone={STATE_TONE[state]} size="md" className={styles.state}>
          {STATE_LABEL[state]}
        </Badge>
        <Character id={exp.character} size={128} className={styles.character} alt="" />
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.code}>{exp.code}</span>
          <Tag className={styles.level}>{LEVEL_LABEL[exp.level]}</Tag>
        </div>
        <h3 className={styles.title}>
          {detailTo ? (
            <Link to={detailTo} className={styles.titleLink}>
              {exp.title}
            </Link>
          ) : (
            exp.title
          )}
        </h3>
        {showBar && exp.progress && (
          <ProgressBar value={exp.progress.trial} max={exp.progress.maxTrial} size="sm" className={styles.bar} />
        )}
        <div className={styles.foot}>
          <span className={styles.caption}>{caption}</span>
          {actionEl}
        </div>
      </div>
    </article>
  )
}
