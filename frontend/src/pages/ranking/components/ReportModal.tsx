import { useState } from 'react'
import { isApiError, reportNickname } from '../../../api'
import type { RankingRow } from '../../../api'
import { Button, cx, Modal, Textarea, useToast } from '../../../components'
import styles from './ReportModal.module.css'

const REASONS = ['욕설 · 비하 표현', '개인정보 노출', '사칭 (운영자 · 다른 사람)', '광고 · 홍보', '기타']

interface Props {
  row: RankingRow | undefined
  /** 대상 위치. 예: "#001 미션 1" */
  board: string
  onClose: () => void
}

/** H-06 닉네임 신고 (POST /api/ranking/report) */
export function ReportModal({ row, board, onClose }: Props) {
  return (
    <Modal open={!!row} onClose={onClose} size="md" title="닉네임 신고" showClose className={styles.modal}>
      {row && <ReportForm key={row.nickname} row={row} board={board} onClose={onClose} />}
    </Modal>
  )
}

function ReportForm({ row, board, onClose }: { row: RankingRow; board: string; onClose: () => void }) {
  const toast = useToast()
  const [reason, setReason] = useState(REASONS[0])
  const [detail, setDetail] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    setSending(true)
    try {
      await reportNickname(row.nickname, detail.trim() ? `${reason} · ${detail.trim()}` : reason)
      toast.show({ title: '신고를 접수했어요', description: '운영팀이 확인한 뒤 알림으로 알려드려요.', tone: 'success' })
      onClose()
    } catch (e) {
      toast.show({ title: '신고하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.target}>
        <span className={styles.rank}>{row.rank}위</span>
        <strong className={styles.nick}>{row.nickname}</strong>
        <span className={styles.board}>{board}</span>
      </div>

      <fieldset className={styles.reasons}>
        <legend className={styles.legend}>신고 사유</legend>
        {REASONS.map((r) => (
          <label key={r} className={cx(styles.option, reason === r && styles.optionOn)}>
            <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
            <span className={styles.dot} aria-hidden />
            {r}
          </label>
        ))}
      </fieldset>

      <Textarea
        aria-label="추가 설명"
        placeholder="추가 설명 (선택)"
        rows={2}
        maxLength={200}
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />

      <p className={styles.note}>
        신고는 익명이에요. 운영팀이 확인하면 해당 닉네임은 랭킹에서 가려지고(관리자 F-10 신고 큐), 결과는 알림으로 알려드려요.
      </p>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
        <Button variant="danger" loading={sending} onClick={submit}>
          신고하기
        </Button>
      </div>
    </div>
  )
}
