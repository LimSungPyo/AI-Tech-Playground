import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { verifyEmail } from '../../api/auth'
import { isApiError } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { Button, EmptyState, Icon, OtpInput, useToast } from '../../components'
import { AuthCard } from './components/AuthCard'
import { OTP_VALID_SEC, RESEND_COOLDOWN_SEC, mmss, useCountdown } from './lib'
import a from './auth.module.css'
import styles from './VerifyEmailPage.module.css'

export interface SignupDoneState {
  importedGuestTrials: number
}

// W2 auth 담당 · 경로 /signup/verify?vid=<verificationId>&email=<email>
// E-01 이메일 인증 코드 → 성공하면 /signup/done
export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const vid = params.get('vid')
  const email = params.get('email') ?? ''
  const navigate = useNavigate()
  const { setToken } = useAuth()
  const toast = useToast()

  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const valid = useCountdown(OTP_VALID_SEC)
  const resend = useCountdown(RESEND_COOLDOWN_SEC)
  const expired = valid.left === 0

  if (!vid) {
    return (
      <AuthCard centered>
        <EmptyState
          expression="confused"
          title="인증할 가입 정보가 없어요"
          description="회원가입을 처음부터 다시 진행해 주세요."
          action={<Button to="/signup">회원가입으로</Button>}
        />
      </AuthCard>
    )
  }

  const submit = async (value = code) => {
    if (value.length !== 6 || submitting || expired) return
    setSubmitting(true)
    setError(undefined)
    try {
      const res = await verifyEmail(vid, value)
      setToken(res.token, res.user)
      navigate('/signup/done', { replace: true, state: { importedGuestTrials: res.importedGuestTrials } satisfies SignupDoneState })
    } catch (e) {
      if (isApiError(e) && e.code === 'INVALID_CODE') {
        const d = (e.data ?? {}) as { attempts?: number; maxAttempts?: number }
        const count = d.attempts !== undefined ? ` (${d.attempts}/${d.maxAttempts ?? 5})` : ''
        setError(`코드가 맞지 않아요${count} · 10분이 지나면 새 코드를 받아 주세요.`)
      } else {
        setError(isApiError(e) ? e.message : '확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
      setCode('')
    } finally {
      setSubmitting(false)
    }
  }

  const resendCode = () => {
    // TODO(공통 변경 요청): 재전송 전용 API가 없어 타이머만 다시 시작한다
    valid.restart(OTP_VALID_SEC)
    resend.restart(RESEND_COOLDOWN_SEC)
    setError(undefined)
    setCode('')
    toast.show({ title: '새 코드를 보냈어요', description: `${email} 메일함을 확인해 주세요.`, tone: 'success' })
  }

  return (
    <AuthCard centered width={540}>
      <p className={styles.step}>회원가입 1 / 3</p>
      <div className={styles.icon} aria-hidden>
        <Icon name="mail" size={64} strokeWidth={1.6} />
      </div>
      <h1 className={`${a.title} ${styles.title}`}>메일로 보낸 6자리를 입력해 주세요</h1>
      <p className={styles.email}>{email}</p>
      <div className={styles.otp}>
        <OtpInput value={code} onChange={setCode} onComplete={(v) => void submit(v)} error={!!error} disabled={submitting || expired} autoFocus />
      </div>
      <div className={a.row}>
        <span className={styles.timer} aria-live="polite">
          {expired ? '코드 유효 시간이 지났어요' : `남은 시간 ${mmss(valid.left)}`}
        </span>
        <button type="button" className={a.link} onClick={resendCode} disabled={resend.left > 0}>
          {resend.left > 0 ? `코드 다시 받기 (${resend.left}초)` : '코드 다시 받기'}
        </button>
      </div>
      <Button size="lg" block loading={submitting} disabled={code.length !== 6 || expired} onClick={() => void submit()}>
        확인
      </Button>
      {(error || expired) && (
        <div className={a.noticeDanger} role="alert">
          <strong>{expired ? '시간 초과' : '오류'}</strong>
          {expired ? '10분이 지나 코드가 만료됐어요. 새 코드를 받아 주세요.' : error}
        </div>
      )}
    </AuthCard>
  )
}
