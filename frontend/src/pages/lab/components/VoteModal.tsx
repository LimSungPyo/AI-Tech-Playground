import { useState } from 'react'
import { useNavigate } from 'react-router'
import { castVote } from '../../../api'
import type { Vote } from '../../../api/types'
import { Button, Modal, ProgressBar, cx, useToast } from '../../../components'
import { useAuth } from '../../../auth/useAuth'
import styles from './VoteModal.module.css'

interface Props {
  open: boolean
  vote: Vote | undefined
  onClose: () => void
  onVoted: (vote: Vote) => void
}

/** 투표 중 실험 카드의 "투표하기" — 다음 실험 투표(GET /api/votes/current, POST /api/votes/{id}) */
export function VoteModal({ open, vote, onClose, onVoted }: Props) {
  const { isMember } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [picked, setPicked] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const total = vote?.options.reduce((s, o) => s + o.votes, 0) ?? 0
  const selected = picked ?? vote?.myVote

  async function submit() {
    if (!vote || !selected) return
    if (!isMember) {
      navigate(`/login?returnTo=${encodeURIComponent('/lab')}`)
      return
    }
    setBusy(true)
    try {
      const next = await castVote(vote.id, selected)
      onVoted(next)
      toast.show({ title: '투표했어요', description: '결과는 마감 후 알림으로 알려 드려요', tone: 'success' })
      onClose()
    } catch (e) {
      toast.show({ title: '투표하지 못했어요', description: e instanceof Error ? e.message : undefined, tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      eyebrow="NEXT EXPERIMENT"
      title={vote?.title ?? '다음 실험 투표'}
      showClose
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button onClick={submit} loading={busy} disabled={!selected}>
            {isMember ? '투표하기' : '로그인하고 투표하기'}
          </Button>
        </>
      }
    >
      <div className={styles.list} role="radiogroup" aria-label="실험 선택">
        {vote?.options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected === o.id}
            className={cx(styles.option, selected === o.id && styles.selected)}
            onClick={() => setPicked(o.id)}
          >
            <span className={styles.title}>{o.title}</span>
            <ProgressBar value={o.votes} max={total || 1} size="sm" valueLabel={`${total ? Math.round((o.votes / total) * 100) : 0}%`} />
          </button>
        ))}
      </div>
    </Modal>
  )
}
