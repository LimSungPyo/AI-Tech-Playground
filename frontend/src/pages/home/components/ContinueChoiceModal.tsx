import { useState } from 'react'
import { getExperiment } from '../../../api'
import type { MeHome } from '../../../api/types'
import { Badge, Button, Checkbox, Icon, Modal, Skeleton, cx } from '../../../components'
import { useApi } from '../../../hooks/useApi'
import { relativeDay } from '../format'
import styles from './ContinueChoiceModal.module.css'

export type ContinueChoice = 'current' | 'new'

interface Props {
  open: boolean
  data: MeHome['continue']
  onClose: () => void
  /** remember: "다음부터 묻지 않기" 체크 여부 */
  onPick: (choice: ContinueChoice, remember: boolean) => void
}

/** 미션 경로 그림(장식). obstacle이면 가운데 장애물 */
function PathArt({ obstacle }: { obstacle?: boolean }) {
  return (
    <svg viewBox="0 0 260 120" className={styles.art} aria-hidden>
      <path
        d={obstacle ? 'M42 86 C 90 86, 110 70, 140 60 S 190 36, 216 36' : 'M42 86 C 100 80, 140 40, 216 36'}
        fill="none"
        stroke="var(--color-accent-indigo)"
        strokeWidth="3"
        strokeDasharray="2 7"
        strokeLinecap="round"
      />
      {obstacle && <rect x="130" y="40" width="14" height="52" rx="3" fill="var(--color-line-strong)" />}
      <circle cx="42" cy="86" r="9" fill="var(--color-fly-yellow)" stroke="var(--color-fly-brown)" strokeWidth="2" />
      <circle cx="216" cy="36" r="11" fill="var(--color-accent-danger)" opacity="0.85" />
    </svg>
  )
}

/** D-04 이어하기 선택 모달 — 새 미션이 해금된 직후 한 번 뜬다 */
export function ContinueChoiceModal({ open, data, onClose, onPick }: Props) {
  const [choice, setChoice] = useState<ContinueChoice>('new')
  const [remember, setRemember] = useState(false)
  const { experiment, mission } = data
  const detail = useApi(open ? (s) => getExperiment(experiment.id, s) : null, [open, experiment.id])

  const missions = detail.data?.missions ?? []
  const newIndex = missions.findIndex((m) => m.id === mission.id)
  const current = missions.filter((m) => m.id !== mission.id && m.status !== 'locked').pop()
  const currentIndex = current ? missions.indexOf(current) : -1
  const missionLabel = (i: number, title: string) => (i >= 0 ? `미션 ${i + 1} · ${title}` : title)
  const newLabel = missionLabel(newIndex, mission.title)
  const newShort = newIndex >= 0 ? `미션 ${newIndex + 1}` : '새 미션'
  const curShort = currentIndex >= 0 ? `미션 ${currentIndex + 1}` : '지난 미션'
  const progress = experiment.progress

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      showClose
      className={styles.modal}
      title="어디서부터 이어할까요?"
      description={`${newShort}가 새로 열렸어요. 하던 미션을 계속하거나, 새 미션을 시작할 수 있어요.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => onPick(choice, remember)} iconRight={<Icon name="arrow-right" size={16} />}>
            {choice === 'new' ? `${newShort} 시작하기` : `${curShort} 이어하기`}
          </Button>
        </>
      }
    >
      <div className={styles.cards} role="radiogroup" aria-label="이어할 미션">
        <button
          type="button"
          role="radio"
          aria-checked={choice === 'current'}
          className={cx(styles.card, choice === 'current' && styles.selected)}
          onClick={() => setChoice('current')}
        >
          <span className={cx(styles.artBox, styles.artButter)}>
            <PathArt />
          </span>
          {detail.loading ? (
            <Skeleton shape="text" lines={2} />
          ) : (
            <span className={styles.cardTitle}>{current ? missionLabel(currentIndex, current.title) : experiment.title}</span>
          )}
          {progress && <strong className={styles.cardSub}>Trial {progress.trial + 1}부터 계속</strong>}
          <span className={styles.cardMeta}>
            {progress ? `성공률 ${Math.round(progress.successRate)}% · ` : ''}마지막 플레이 {relativeDay(data.lastPlayedAt)}
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={choice === 'new'}
          className={cx(styles.card, choice === 'new' && styles.selected)}
          onClick={() => setChoice('new')}
        >
          <span className={cx(styles.artBox, styles.artLilac)}>
            <PathArt obstacle />
          </span>
          <span className={styles.cardTitleRow}>
            <span className={styles.cardTitle}>{newLabel}</span>
            <Badge tone="solid">AI 추천</Badge>
          </span>
          <strong className={cx(styles.cardSub, styles.link)}>새 미션 · 브리핑부터</strong>
          <span className={styles.cardMeta}>
            예상 {experiment.durationMin}분 · {mission.goal}
          </span>
        </button>
      </div>
      <Checkbox
        className={styles.remember}
        label="다음부터 묻지 않고 마지막 미션 이어하기"
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
      />
    </Modal>
  )
}
