import { useEffect, useState } from 'react'
import { Button, Icon, Mascot, Modal, ProgressBar } from '../../../components'
import styles from './PlayDialogs.module.css'

// ── 0-03 4회째 · 저장 유도 모달 (auth의 GuestSaveModal이 생기기 전까지 쓰는 같은 디자인) ──
export interface GuestSaveGateProps {
  open: boolean
  onClose: () => void
  /** 지금까지 한 체험 회차 */
  trials: number
  /** 현재 성공률(0~100). 모르면 숨긴다 */
  successRate?: number
  characterName: string
  returnTo: string
}

export function GuestSaveGate({ open, onClose, trials, successRate, characterName, returnTo }: GuestSaveGateProps) {
  const q = `?returnTo=${encodeURIComponent(returnTo)}`
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      centered
      className={styles.modal}
      media={<Mascot expression="champion" size={120} alt="" />}
      eyebrow={<span className={styles.guestEyebrow}>GUEST · {trials} / {trials}회 완료</span>}
      title={<span className={styles.bigTitle}>{characterName}의 성장을 저장할까요?</span>}
      description={`게스트 체험은 ${trials}회까지예요. 로그인하면 지금까지의 Trial 1~${trials} 기록이 그대로 옮겨지고, Trial ${trials + 1}부터 이어서 훈련할 수 있어요.`}
    >
      <div className={styles.stats}>
        <span className={styles.stat}>
          <small>체험 회차</small>
          <strong>{trials}회</strong>
        </span>
        {successRate !== undefined && (
          <span className={styles.stat}>
            <small>현재 성공률</small>
            <strong>{Math.round(successRate)}%</strong>
          </span>
        )}
        <span className={styles.stat}>
          <small>저장될 리플레이</small>
          <strong>{trials}개</strong>
        </span>
      </div>
      <div className={styles.actions}>
        <Button size="lg" block to={`/signup${q}`}>
          가입하고 저장하기 (1분)
        </Button>
        <Button size="lg" block variant="secondary" to={`/login${q}`}>
          이미 계정이 있어요 · 로그인
        </Button>
        <Button variant="ghost" size="sm" to="/">
          저장 안 하고 홈으로
        </Button>
      </div>
    </Modal>
  )
}

// ── 07:M-08 플레이 중 세션 만료 ──
export interface SessionExpiredModalProps {
  open: boolean
  trial: number
  step?: number
  returnTo: string
}

export function SessionExpiredModal({ open, trial, step, returnTo }: SessionExpiredModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => {}}
      closeOnBackdrop={false}
      closeOnEsc={false}
      role="alertdialog"
      size="lg"
      centered
      className={styles.modal}
      media={<Mascot expression="confused" size={104} alt="" />}
      title={<span className={styles.bigTitle}>로그인이 만료됐어요</span>}
      description="보안을 위해 30일이 지나면 다시 로그인해야 해요."
    >
      <p className={styles.saved}>
        <Icon name="check" size={16} />
        진행 중이던 기록은 안전하게 저장했어요 · Trial {trial}
        {step !== undefined && ` · STEP ${step}`}
      </p>
      <div className={styles.actions}>
        <Button size="lg" block to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
          다시 로그인하고 이어하기
        </Button>
        <Button size="lg" block variant="secondary" to="/">
          홈으로
        </Button>
      </div>
    </Modal>
  )
}

// ── E-04 훈련 중 나가기 확인 ──
export interface LeaveTrainingModalProps {
  open: boolean
  done: number
  total: number
  onStay: () => void
  onLeave: () => void
}

export function LeaveTrainingModal({ open, done, total, onStay, onLeave }: LeaveTrainingModalProps) {
  return (
    <Modal
      open={open}
      onClose={onStay}
      size="lg"
      centered
      className={styles.modal}
      media={<Mascot expression="training" size={96} alt="" />}
      title={<span className={styles.bigTitle}>훈련을 멈추고 나갈까요?</span>}
      description={`×10 훈련 중 ${done} / ${total}회가 끝났어요. 지금 나가면 완료된 ${done}회만 저장되고, 나머지 ${total - done}회는 취소돼요.`}
    >
      <ProgressBar value={done} max={total} className={styles.progress} />
      <div className={styles.actions}>
        <Button size="lg" block onClick={onStay}>
          계속 훈련하기
        </Button>
        <Button size="lg" block variant="secondary" onClick={onLeave}>
          {done}회 저장하고 나가기
        </Button>
      </div>
    </Modal>
  )
}

// ── E-05 연결 끊김 — 게임 위 배너 + 자동 재시도(3초, 최대 5회) ──
const RETRY_SEC = 3
export const MAX_RETRY = 5

export interface ConnectionLostProps {
  /** 몇 번째 시도인지(1부터) */
  attempt: number
  onRetry: () => void
}

export function ConnectionLost({ attempt, onRetry }: ConnectionLostProps) {
  const auto = attempt <= MAX_RETRY
  const [left, setLeft] = useState(RETRY_SEC)
  // attempt가 바뀌면 카운트다운을 다시 센다(렌더 중 이전 값 비교)
  const [seen, setSeen] = useState(attempt)
  if (seen !== attempt) {
    setSeen(attempt)
    setLeft(RETRY_SEC)
  }

  useEffect(() => {
    if (!auto) return
    if (left <= 0) {
      onRetry()
      return
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [auto, left, onRetry])

  return (
    <>
      <div className={styles.lost} role="alert">
        <Mascot expression="confused" size={44} alt="" />
        <span className={styles.lostText}>
          <strong>연결이 불안정해요</strong>
          <small>
            {auto ? `${Math.max(left, 0)}초 후 다시 연결할게요 (${attempt} / ${MAX_RETRY})` : '자동 재연결을 멈췄어요'} · 훈련은 잠시 멈췄어요
          </small>
        </span>
        <button type="button" className={styles.retry} onClick={onRetry}>
          지금 다시 시도
        </button>
      </div>
      <p className={styles.offline}>오프라인에서도 지난 리플레이와 기술 카드는 볼 수 있어요</p>
    </>
  )
}
