import { useState } from 'react'
import { castVote, getCurrentVote, getRadar } from '../../../api'
import type { RadarKeyword, Vote } from '../../../api/types'
import { Button, CHARACTERS, Character, EmptyState, Icon, Modal, Skeleton, cx, useToast } from '../../../components'
import { useApi } from '../../../hooks/useApi'
import { arrowPct } from '../format'
import { characterOfExperiment, formatDeadline, votePercents } from '../vote'
import styles from './VoteModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  /** 레이더 키워드(있으면 다시 부르지 않는다) */
  keywords?: RadarKeyword[]
  /** 투표 후 결과를 부모에 알린다 */
  onVoted?: (vote: Vote) => void
}

/** D-09 다음 실험 투표 모달 */
export function VoteModal({ open, onClose, keywords, onVoted }: Props) {
  const toast = useToast()
  const vote = useApi(open ? (s) => getCurrentVote(s) : null, [open])
  const radar = useApi(open && !keywords ? (s) => getRadar(s) : null, [open, !keywords])
  const kws = keywords ?? radar.data?.keywords ?? []
  const [picked, setPicked] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const v = vote.data
  const selected = picked ?? v?.myVote ?? v?.options[0]?.id ?? null
  const selectedChar = selected ? characterOfExperiment(selected) : undefined
  const { total, pct } = v ? votePercents(v) : { total: 0, pct: () => 0 }

  const submit = async () => {
    if (!v || !selected) return
    setSending(true)
    try {
      const next = await castVote(v.id, selected)
      vote.setData(next)
      onVoted?.(next)
      toast.show({ title: '투표했어요', description: '투표한 실험이 열리면 가장 먼저 알려드려요.', tone: 'success' })
      onClose()
    } catch (e) {
      toast.show({ title: '투표하지 못했어요', description: e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.', tone: 'danger' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      showClose
      className={styles.modal}
      title={v?.title ?? '다음에 열릴 실험을 골라 주세요'}
      description="기술 레이더에서 뜨는 기술 중 3개를 골랐어요. 가장 많이 뽑힌 실험이 다음 Tech Drop으로 먼저 열려요."
    >
      {vote.loading && !v ? (
        <div className={styles.grid}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={230} />
          ))}
        </div>
      ) : vote.error || !v ? (
        <EmptyState compact expression="confused" title="투표를 불러오지 못했어요" action={<Button onClick={vote.reload}>다시 시도</Button>} />
      ) : (
        <>
          <div className={styles.grid} role="radiogroup" aria-label="투표할 실험">
            {v.options.map((o) => {
              const ch = characterOfExperiment(o.id)
              const kw = kws.find((k) => k.relatedExperimentId === o.id)
              const on = o.id === selected
              const p = pct(o.votes)
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={cx(styles.option, on && styles.on)}
                  onClick={() => setPicked(o.id)}
                >
                  {on && (
                    <span className={styles.check} aria-hidden>
                      <Icon name="check" size={14} />
                    </span>
                  )}
                  {ch && <Character id={ch} size={100} alt="" />}
                  <span className={styles.optTitle}>{o.title}</span>
                  {kw && (
                    <span className={cx(styles.kw, kw.changePct < 0 && styles.kwDown)}>
                      {kw.name} {arrowPct(kw.changePct).replace(' ', '')}
                    </span>
                  )}
                  <span className={styles.bar}>
                    <span className={styles.fill} style={{ width: `${p}%` }} />
                  </span>
                  <span className={styles.pct}>{p}%</span>
                </button>
              )
            })}
          </div>
          <div className={styles.foot}>
            <span className={styles.meta}>
              {total.toLocaleString('ko-KR')}명 참여 · {formatDeadline(v.endsAt)} 마감
            </span>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={onClose}>
                나중에
              </Button>
              <Button onClick={submit} loading={sending} disabled={!selected}>
                {selectedChar ? `${CHARACTERS[selectedChar].name}에게 투표하기` : '투표하기'}
              </Button>
            </div>
          </div>
          <p className={styles.note}>투표한 실험이 열리면 가장 먼저 알려드려요 · 1주에 1표 · 결과는 다음 월요일 기술 레이더에서 공개</p>
        </>
      )}
    </Modal>
  )
}
