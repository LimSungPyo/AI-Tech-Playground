import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { isApiError } from '../../api/client'
import type { AccountLockedData, InvalidPasswordData } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { Button, Icon, PasswordInput, useToast } from '../../components'
import { AuthCard } from './components/AuthCard'
import type { LockedState } from './components/LoginForm'
import { PROVIDER_LABEL, rememberAccount, safeReturnTo, useSocialLogin } from './lib'
import type { SocialConflictState } from './lib'
import a from './auth.module.css'
import styles from './SocialConflictPage.module.css'

// W2 auth 담당 · 경로 /account/social-conflict
// 07:M-05 소셜 계정 연결 충돌. 소셜 로그인 409 응답에서 state { email, provider, returnTo }로 들어온다
export default function SocialConflictPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const { login } = useAuth()
  const state = (location.state as SocialConflictState | null) ?? { provider: 'google' as const }
  const provider = state.provider
  const label = PROVIDER_LABEL[provider]
  const email = state.email ?? ''
  const returnTo = safeReturnTo(state.returnTo)

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const social = useSocialLogin({
    remember: true,
    returnTo,
    onSuccess: () => navigate(returnTo, { replace: true }),
    onError: setError,
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('기존 계정 비밀번호를 입력해 주세요.')
      return
    }
    setSubmitting(true)
    setError(undefined)
    try {
      // TODO(공통 변경 요청): 계정 연결 전용 API가 없어 기존 계정 비밀번호 확인(로그인)으로 대신한다
      const user = await login(email, password, true)
      rememberAccount(user, provider, true)
      toast.show({ title: `${label} 로그인을 연결했어요`, description: '이제 어느 쪽으로 로그인해도 같은 계정이에요.', tone: 'success' })
      navigate(returnTo, { replace: true })
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        const left = (err.data as InvalidPasswordData | undefined)?.remainingAttempts
        setError(`비밀번호가 맞지 않아요${left !== undefined ? ` · 남은 기회 ${left}번` : ''}`)
      } else if (isApiError(err) && err.status === 423) {
        navigate('/account/locked', { state: { email, unlockAt: (err.data as AccountLockedData | undefined)?.unlockAt } satisfies LockedState })
      } else {
        setError(isApiError(err) ? err.message : '연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard centered width={560}>
      <div className={styles.link} aria-hidden>
        <span className={styles.provider}>{provider === 'kakao' ? 'K' : 'G'}</span>
        <Icon name="arrow-right" size={20} className={styles.arrow} />
        <span className={styles.at}>@</span>
      </div>
      <h1 className={a.title}>이미 가입된 이메일이에요</h1>
      <p className={a.lead}>
        {email || '이 이메일'}은 이메일로 먼저 가입돼 있어요. 비밀번호를 한 번 확인하면 {label} 로그인을 같은 계정에 연결해 드려요.
      </p>
      <form className={styles.form} onSubmit={submit} noValidate>
        <PasswordInput
          label="기존 계정 비밀번호"
          placeholder="비밀번호 입력"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(undefined)
          }}
          error={error}
          autoFocus
        />
        <Button type="submit" size="lg" block loading={submitting} disabled={!email || social.pending !== null}>
          확인하고 {label} 연결하기
        </Button>
        <Button variant="secondary" size="lg" block loading={social.pending !== null} disabled={submitting} onClick={() => void social.start(provider)}>
          다른 {label} 계정으로
        </Button>
      </form>
      <p className={a.caption}>연결하면 실험 기록 · 캐릭터 · 도감이 하나의 계정으로 합쳐져요.</p>
    </AuthCard>
  )
}
