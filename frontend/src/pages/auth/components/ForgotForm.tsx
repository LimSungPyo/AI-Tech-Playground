import { useState } from 'react'
import type { FormEvent } from 'react'
import { forgotPassword } from '../../../api/auth'
import { isApiError } from '../../../api/client'
import { Button, Icon, Input } from '../../../components'
import { isEmail } from '../lib'
import styles from './LoginForm.module.css'

interface ForgotFormProps {
  /** page = 0-05 라벨 있는 입력 · popup = 08:L-04 아이콘 입력 */
  variant: 'page' | 'popup'
  defaultEmail?: string
  onSent: (email: string, expiresInMin: number) => void
}

/** 비밀번호 재설정 링크 요청 폼. 가입 여부와 상관없이 같은 "메일을 보냈어요"로 이어진다 */
export function ForgotForm({ variant, defaultEmail = '', onSent }: ForgotFormProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) {
      setError('이메일 형식을 확인해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      const res = await forgotPassword(email.trim())
      onSent(email.trim(), res.expiresInMin)
    } catch (err) {
      setError(isApiError(err) ? err.message : '메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const page = variant === 'page'
  return (
    <form className={page ? `${styles.form} ${styles.page}` : styles.form} onSubmit={submit} noValidate>
      <Input
        label={page ? '이메일' : undefined}
        aria-label={page ? undefined : '이메일'}
        type="email"
        autoComplete="email"
        placeholder={page ? 'you@example.com' : '가입한 이메일'}
        iconLeft={page ? undefined : <Icon name="mail" size={16} />}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setError(undefined)
        }}
        error={error}
        autoFocus
      />
      <Button type="submit" size="lg" block loading={submitting}>
        재설정 링크 보내기
      </Button>
    </form>
  )
}
