import { useState } from 'react'
import { useNavigate } from 'react-router'
import { getDashboard, getMyCharacters, isApiError, withdraw } from '../../../api'
import { setStoredToken } from '../../../auth/storage'
import { useAuth } from '../../../auth/useAuth'
import { Button, Checkbox, Mascot, Modal, PasswordInput, Radio, Skeleton, useToast } from '../../../components'
import { useApi } from '../../../hooks/useApi'
import styles from './WithdrawFlow.module.css'

export type WithdrawStep = 1 | 2 | 3

const REASONS = ['어려워서', '시간이 없어서', '원하는 실험이 없어서', '기타']
const GRACE_DAYS = 30

function formatDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

/**
 * 회원 탈퇴 흐름 E-08(안내 · 사유) → E-09(본인 확인, 08:M-05) → E-10(완료).
 * 단계는 부모가 `?withdraw=1|2|3` 쿼리로 넘기고, onStep으로 바꾼다(null = 닫기).
 */
export function WithdrawFlow({ step, onStep }: { step: WithdrawStep | null; onStep: (s: WithdrawStep | null) => void }) {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const open = step !== null
  const dash = useApi(open ? (s) => getDashboard(s) : null, [open])
  const chars = useApi(open ? (s) => getMyCharacters(s) : null, [open])

  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ until: string; days: number }>()

  // 완료 결과 없이 3단계로 들어오면 1단계부터
  const current: WithdrawStep | null = step === 3 && !done ? 1 : step

  const stats = dash.data?.stats
  const charCount = chars.data?.filter((c) => c.obtained).length

  const submit = async () => {
    setSubmitting(true)
    setError(undefined)
    try {
      const res = await withdraw(password, reason)
      // 토큰은 바로 지운다. 화면 상태(user)는 "홈으로"에서 정리해 가드가 완료 화면을 가로채지 않게 한다
      setStoredToken(null)
      setDone({ until: formatDate(new Date(Date.now() + res.graceDays * 86_400_000)), days: res.graceDays })
      onStep(3)
    } catch (e) {
      if (isApiError(e) && (e.status === 400 || e.status === 401)) setError('비밀번호가 맞지 않아요')
      else toast.show({ title: '탈퇴를 진행하지 못했어요', description: '잠시 뒤 다시 시도해 주세요', tone: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  const goHome = () => {
    setToken(null)
    navigate('/', { replace: true })
  }

  const close = () => {
    if (current === 3) goHome()
    else onStep(null)
  }

  return (
    <>
      <Modal
        open={current === 1}
        onClose={close}
        size="lg"
        title="정말 떠나시나요?"
        description={`탈퇴하면 ${GRACE_DAYS}일 뒤에 아래 기록이 모두 사라져요. ${GRACE_DAYS}일 안에 로그인하면 복구할 수 있어요.`}
        footer={
          <div className={styles.actions}>
            <Button variant="secondary" size="lg" block onClick={close}>
              계속 이용할게요
            </Button>
            <Button variant="danger" size="lg" block onClick={() => onStep(2)}>
              다음
            </Button>
          </div>
        }
      >
        {stats && charCount !== undefined ? (
          <ul className={styles.stats}>
            <li>
              <strong>{stats.experiments}개</strong>
              <span>실험 기록</span>
            </li>
            <li>
              <strong>{charCount}명</strong>
              <span>캐릭터</span>
            </li>
            <li>
              <strong>{stats.cards}장</strong>
              <span>도감 카드</span>
            </li>
            <li>
              <strong>{stats.badges}개</strong>
              <span>배지</span>
            </li>
          </ul>
        ) : (
          <Skeleton height={64} />
        )}
        <fieldset className={styles.reasons}>
          <legend className={styles.legend}>떠나는 이유를 알려 주세요 (선택)</legend>
          {REASONS.map((r) => (
            <Radio key={r} name="withdraw-reason" label={r} checked={reason === r} onChange={() => setReason(r)} />
          ))}
        </fieldset>
      </Modal>

      <Modal
        open={current === 2}
        onClose={close}
        size="md"
        media={
          <span className={styles.alertIcon} aria-hidden>
            !
          </span>
        }
        title="정말 탈퇴할까요?"
        description={`아래 기록이 모두 사라지고 되돌릴 수 없어요. ${GRACE_DAYS}일 안에 다시 로그인하면 탈퇴가 취소돼요.`}
        footer={
          <div className={styles.actions}>
            <Button variant="secondary" size="lg" block onClick={close}>
              취소
            </Button>
            <Button
              variant="danger"
              size="lg"
              block
              disabled={!password || !agree}
              loading={submitting}
              onClick={submit}
            >
              탈퇴하기
            </Button>
          </div>
        }
      >
        {stats ? (
          <ul className={styles.records}>
            <li>· 실험 기록 {stats.trials}회 · 리플레이</li>
            <li>
              · 기술 카드 {stats.cards}장 · 배지 {stats.badges}개
            </li>
            <li>· 랭킹 기록 · 공유 링크</li>
          </ul>
        ) : (
          <Skeleton height={88} />
        )}
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault()
            if (password && agree) void submit()
          }}
        >
          <PasswordInput
            label="확인을 위해 비밀번호를 입력하세요"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(undefined)
            }}
            error={error}
            autoComplete="current-password"
          />
          <Checkbox
            className={styles.agree}
            label={`${GRACE_DAYS}일 뒤 모든 기록이 완전히 삭제되는 것에 동의해요`}
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
        </form>
      </Modal>

      <Modal
        open={current === 3}
        onClose={close}
        size="md"
        centered
        media={<Mascot expression="sleep" size={136} />}
        title={`${done?.days ?? GRACE_DAYS}일 동안 기다릴게요`}
        description={`탈퇴가 접수됐어요. ${done?.until ?? ''}까지 같은 계정으로 로그인하면 모든 기록을 되살릴 수 있어요.`}
        footer={
          <Button variant="secondary" size="lg" block onClick={goHome}>
            홈으로
          </Button>
        }
      />
    </>
  )
}
