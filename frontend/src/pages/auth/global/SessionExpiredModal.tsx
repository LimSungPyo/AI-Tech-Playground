import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { SESSION_EXPIRED_EVENT, isApiError } from '../../../api/client'
import type { AccountLockedData, InvalidPasswordData, User } from '../../../api/types'
import { getRememberedEmail } from '../../../auth/storage'
import { useAuth } from '../../../auth/useAuth'
import { Avatar, Button, Icon, Input, Modal, PasswordInput } from '../../../components'
import type { LockedState } from '../components/LoginForm'
import { MAX_LOGIN_ATTEMPTS, isEmail, rememberAccount } from '../lib'
import styles from './global.module.css'

export interface SessionExpiredModalProps {
  /** 다시 로그인한 뒤 호출(화면 데이터 다시 불러오기 등) */
  onRelogin?: (user: User) => void
}

/**
 * 08:M-01 세션 만료 · 다시 로그인. `window`의 `atp:session-expired`(SESSION_EXPIRED_EVENT)를 들으면 스스로 열린다.
 * 라우터 안(RootLayout 등)에 한 번만 마운트한다.
 */
export function SessionExpiredModal({ onRelogin }: SessionExpiredModalProps) {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // 이벤트 순간에는 AuthProvider가 user를 비우므로 마지막으로 본 사용자를 기억해 둔다
  const lastUser = useRef<User | null>(user)
  useEffect(() => {
    if (user) lastUser.current = user
  }, [user])

  const [open, setOpen] = useState(false)
  const [known, setKnown] = useState<{ email: string; nickname: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onExpired = () => {
      const u = lastUser.current
      const mail = u?.email ?? getRememberedEmail() ?? ''
      setKnown(mail ? { email: mail, nickname: u?.nickname ?? mail.split('@')[0] } : null)
      setEmail(mail)
      setPassword('')
      setError(undefined)
      setOpen(true)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const close = () => setOpen(false)
  const here = location.pathname + location.search

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) {
      setError('이메일 형식을 확인해 주세요.')
      return
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.')
      return
    }
    setSubmitting(true)
    setError(undefined)
    try {
      const remember = getRememberedEmail() !== null
      const next = await login(email.trim(), password, remember)
      rememberAccount(next, 'email', remember)
      setOpen(false)
      onRelogin?.(next)
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        const left = (err.data as InvalidPasswordData | undefined)?.remainingAttempts ?? MAX_LOGIN_ATTEMPTS - 1
        setError(`비밀번호가 맞지 않아요 · ${MAX_LOGIN_ATTEMPTS}번 중 ${MAX_LOGIN_ATTEMPTS - left}번 틀렸어요`)
      } else if (isApiError(err) && err.status === 423) {
        setOpen(false)
        navigate('/account/locked', { state: { email: email.trim(), unlockAt: (err.data as AccountLockedData | undefined)?.unlockAt } satisfies LockedState })
      } else {
        setError(isApiError(err) ? err.message : '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      centered
      closeOnBackdrop={false}
      className={styles.popup}
      media={<Avatar name={known?.nickname ?? '?'} size={72} className={styles.initial} />}
      title="다시 로그인해 주세요"
      description={'보안을 위해 7일이 지나 로그아웃됐어요.\n하던 실험은 그대로 저장돼 있어요.'}
    >
      <form className={styles.stack} onSubmit={submit} noValidate>
        {known ? (
          <span className={styles.emailChip}>{known.email}</span>
        ) : (
          <Input aria-label="이메일" type="email" autoComplete="email" placeholder="이메일" iconLeft={<Icon name="mail" size={16} />} value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
        <PasswordInput
          aria-label="비밀번호"
          placeholder="비밀번호"
          iconLeft={<Icon name="key" size={16} />}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(undefined)
          }}
          error={error}
          autoFocus
        />
        <Button type="submit" size="lg" block loading={submitting}>
          로그인하고 이어하기
        </Button>
        <div className={styles.links}>
          <button
            type="button"
            onClick={() => {
              close()
              navigate(`/login?${new URLSearchParams({ mode: 'form', returnTo: here })}`)
            }}
          >
            다른 계정
          </button>
          <button
            type="button"
            onClick={() => {
              close()
              navigate(known ? `/password/forgot?email=${encodeURIComponent(known.email)}` : '/password/forgot')
            }}
          >
            비밀번호 찾기
          </button>
        </div>
      </form>
    </Modal>
  )
}
