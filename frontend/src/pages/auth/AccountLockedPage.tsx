import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Button, Icon, useToast } from '../../components'
import { AuthCard } from './components/AuthCard'
import type { LockedState } from './components/LoginForm'
import { maskEmail, useCountdown, useSocialLogin } from './lib'
import a from './auth.module.css'
import styles from './AccountLockedPage.module.css'

const LOCK_SEC = 10 * 60

/** 잠금 해제까지 남은 초. 값이 없거나 이미 지난 시각(샘플 고정일)이면 지금부터 10분으로 본다 */
function secondsUntil(unlockAt: string | null | undefined) {
  const t = unlockAt ? Date.parse(unlockAt) : NaN
  const left = Math.ceil((t - Date.now()) / 1000)
  return Number.isFinite(left) && left > 0 ? Math.min(left, LOCK_SEC) : LOCK_SEC
}

// W2 auth 담당 · 경로 /account/locked
// 07:M-03 계정 잠김(5회 실패). 로그인 423 응답에서 state { email, unlockAt }로 들어온다(?email=&unlockAt=도 받음)
export default function AccountLockedPage() {
  const location = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const state = location.state as LockedState | null
  const email = state?.email ?? params.get('email') ?? ''
  const [initial] = useState(() => secondsUntil(state?.unlockAt ?? params.get('unlockAt')))
  const { left } = useCountdown(initial)
  const social = useSocialLogin({
    remember: true,
    onSuccess: () => navigate('/', { replace: true }),
    onError: (message) => toast.show({ title: '로그인하지 못했어요', description: message, tone: 'danger' }),
  })

  const unlocked = left === 0
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const emailQuery = email ? `?email=${encodeURIComponent(email)}` : ''

  return (
    <AuthCard centered>
      <div className={styles.icon} aria-hidden>
        <Icon name={unlocked ? 'check' : 'lock'} size={56} strokeWidth={2.2} />
      </div>
      <h1 className={a.title}>{unlocked ? '다시 로그인할 수 있어요' : '잠시 잠겼어요'}</h1>
      <p className={a.lead}>
        {unlocked
          ? '잠금이 풀렸어요. 비밀번호가 기억나지 않으면 재설정해 주세요.'
          : '비밀번호를 5번 잘못 입력해서 계정을 보호하고 있어요. 10분 뒤에 다시 시도하거나, 지금 비밀번호를 재설정하면 바로 풀려요.'}
      </p>
      {!unlocked && (
        <div className={styles.clock} role="timer" aria-label={`잠금 해제까지 ${mm}분 ${ss}초`}>
          <span className={styles.digit}>{mm}</span>
          <span className={styles.colon} aria-hidden>
            :
          </span>
          <span className={styles.digit}>{ss}</span>
        </div>
      )}
      <div className={a.actions}>
        {unlocked ? (
          <Button size="lg" block to={`/login?mode=form${email ? `&email=${encodeURIComponent(email)}` : ''}`}>
            다시 로그인하기
          </Button>
        ) : (
          <Button size="lg" block to={`/password/forgot${emailQuery}`}>
            비밀번호 재설정으로 바로 풀기
          </Button>
        )}
        <Button variant="secondary" size="lg" block loading={social.pending !== null} onClick={() => void social.start('google')}>
          Google로 로그인하기
        </Button>
      </div>
      {email && <p className={a.caption}>내가 시도한 게 아니라면 {maskEmail(email)}로 보낸 보안 알림을 확인하세요.</p>}
    </AuthCard>
  )
}
