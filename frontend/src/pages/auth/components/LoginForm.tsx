import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { isApiError } from '../../../api/client'
import type { AccountLockedData, InvalidPasswordData, User } from '../../../api/types'
import { useAuth } from '../../../auth/useAuth'
import { Button, Checkbox, Divider, Icon, Input, PasswordInput, cx } from '../../../components'
import { MAX_LOGIN_ATTEMPTS, isEmail, rememberAccount, useSocialLogin } from '../lib'
import { SocialButtons } from './SocialButtons'
import styles from './LoginForm.module.css'

export interface LockedState {
  email: string
  unlockAt?: string
}

export interface LoginFormProps {
  /** page = B-01 오른쪽 카드 · popup = L-01/L-02 · sheet = 08:M-06 모바일 바텀시트 */
  variant: 'page' | 'popup' | 'sheet'
  defaultEmail?: string
  /** 잠김 · 소셜 충돌 화면에서 돌아올 곳 */
  returnTo?: string
  onSuccess: (user: User) => void
  /** 다른 화면(잠김 · 소셜 충돌)으로 넘어가기 직전에 호출(팝업 닫기) */
  onLeave?: () => void
  /** 없으면 /signup 링크 */
  onSignup?: () => void
  /** 없으면 /password/forgot 링크 */
  onForgot?: () => void
  autoFocus?: boolean
}

/** 이메일 · 비밀번호 · 소셜 로그인 폼. 페이지 · 팝업 · 바텀시트가 같이 쓴다 */
export function LoginForm({ variant, defaultEmail = '', returnTo, onSuccess, onLeave, onSignup, onForgot, autoFocus }: LoginFormProps) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState<number | null>(null)
  const [emailError, setEmailError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()

  const social = useSocialLogin({ remember, returnTo, onSuccess, onLeave, onError: setFormError })
  const busy = submitting || social.pending !== null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(undefined)
    if (!isEmail(email)) {
      setEmailError('이메일 형식을 확인해 주세요.')
      return
    }
    if (!password) {
      setFormError('비밀번호를 입력해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      const user = await login(email.trim(), password, remember)
      rememberAccount(user, 'email', remember)
      onSuccess(user)
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        const remaining = (err.data as InvalidPasswordData | undefined)?.remainingAttempts ?? MAX_LOGIN_ATTEMPTS - 1
        setFailed(MAX_LOGIN_ATTEMPTS - remaining)
      } else if (isApiError(err) && err.status === 423) {
        onLeave?.()
        const data = err.data as AccountLockedData | undefined
        navigate('/account/locked', { state: { email: email.trim(), unlockAt: data?.unlockAt } satisfies LockedState })
      } else {
        setFormError(isApiError(err) ? err.message : '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const passwordError =
    failed === null
      ? undefined
      : variant === 'page'
        ? `비밀번호가 맞지 않아요. ${MAX_LOGIN_ATTEMPTS}회 틀리면 10분간 잠겨요. (${failed} / ${MAX_LOGIN_ATTEMPTS})`
        : `비밀번호가 맞지 않아요 · ${MAX_LOGIN_ATTEMPTS}번 중 ${failed}번 틀렸어요`

  const page = variant === 'page'
  const forgot = onForgot ? (
    <button type="button" className={styles.link} onClick={onForgot}>
      {page ? '비밀번호를 잊었나요?' : '비밀번호 찾기'}
    </button>
  ) : (
    <Link to={email && isEmail(email) ? `/password/forgot?email=${encodeURIComponent(email)}` : '/password/forgot'} className={styles.link} onClick={onLeave}>
      {page ? '비밀번호를 잊었나요?' : '비밀번호 찾기'}
    </Link>
  )
  const signup = onSignup ? (
    <button type="button" className={styles.link} onClick={onSignup}>
      회원가입
    </button>
  ) : (
    <Link to="/signup" className={styles.link} onClick={onLeave}>
      회원가입
    </Link>
  )
  const socialButtons = (
    <SocialButtons
      layout={page ? 'stack' : variant === 'popup' ? 'pill' : 'text'}
      onSelect={(p) => {
        setFormError(undefined)
        void social.start(p)
      }}
      pending={social.pending}
      disabled={submitting}
    />
  )

  return (
    <form className={cx(styles.form, styles[variant])} onSubmit={submit} noValidate>
      {page && (
        <>
          {socialButtons}
          <Divider label="또는 이메일로" />
        </>
      )}
      <Input
        label={page ? '이메일' : undefined}
        aria-label={page ? undefined : '이메일'}
        type="email"
        autoComplete="email"
        placeholder={page ? 'you@example.com' : '이메일'}
        iconLeft={page ? undefined : <Icon name="mail" size={16} />}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setEmailError(undefined)
        }}
        error={emailError}
        success={page && isEmail(email)}
        autoFocus={autoFocus && !defaultEmail}
      />
      <PasswordInput
        label={page ? '비밀번호' : undefined}
        aria-label={page ? undefined : '비밀번호'}
        placeholder={page ? '비밀번호' : '비밀번호'}
        iconLeft={page ? undefined : <Icon name="key" size={16} />}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          setFormError(undefined)
        }}
        error={passwordError}
        autoFocus={autoFocus && !!defaultEmail}
      />
      {variant !== 'sheet' && (
        <div className={styles.options}>
          <Checkbox label={page ? '로그인 상태 유지 (30일)' : '로그인 상태 유지'} checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          {forgot}
        </div>
      )}
      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" block loading={submitting} disabled={busy}>
        로그인
      </Button>
      {variant === 'popup' && <Divider label="또는" />}
      {!page && socialButtons}
      <p className={styles.footer}>
        {page ? '아직 계정이 없나요?' : '처음이에요?'} {signup}
      </p>
      {variant === 'popup' && failed !== null && (
        <p className={styles.lockNotice}>{MAX_LOGIN_ATTEMPTS}번 틀리면 10분 동안 로그인이 잠겨요</p>
      )}
    </form>
  )
}
