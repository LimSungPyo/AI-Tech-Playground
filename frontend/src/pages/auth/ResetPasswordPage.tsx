import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { resetPassword } from '../../api/auth'
import { isApiError } from '../../api/client'
import { Button, EmptyState, Icon, PasswordInput, cx, useToast } from '../../components'
import { AuthCard, StepChips } from './components/AuthCard'
import { passwordRules } from './lib'
import a from './auth.module.css'
import styles from './ResetPasswordPage.module.css'

// W2 auth 담당 · 경로 /password/reset?token=<재설정 토큰>(메일 링크)&email=
// 07:M-04 새 비밀번호 설정 → 성공하면 /login
export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const email = params.get('email') ?? ''
  const navigate = useNavigate()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  if (!token) {
    return (
      <AuthCard centered>
        <EmptyState
          expression="confused"
          title="재설정 링크가 올바르지 않아요"
          description="메일의 링크가 만료됐거나 잘렸을 수 있어요. 새 링크를 받아 주세요."
          action={<Button to="/password/forgot">재설정 링크 다시 받기</Button>}
        />
      </AuthCard>
    )
  }

  const rules = passwordRules(password)
  const rulesOk = rules.every((r) => r.ok)
  const match = confirm.length > 0 && confirm === password

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError(undefined)
    if (!rulesOk || !match) return
    setSubmitting(true)
    try {
      await resetPassword(token, password)
      toast.show({ title: '비밀번호를 바꿨어요', description: '새 비밀번호로 로그인해 주세요.', tone: 'success' })
      navigate(`/login?${new URLSearchParams(email ? { mode: 'form', email } : { mode: 'form' })}`, { replace: true })
    } catch (err) {
      setError(isApiError(err) ? err.message : '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard width={520}>
      <StepChips steps={['이메일', '메일 확인', '새 비밀번호']} current={2} align="center" />
      <h1 className={cx(a.title, styles.center)}>새 비밀번호를 정해 주세요</h1>
      <form className={styles.form} onSubmit={submit} noValidate>
        <PasswordInput
          label="새 비밀번호"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={submitted && !rulesOk ? '비밀번호 규칙을 모두 채워 주세요.' : undefined}
          autoFocus
        />
        <ul className={cx(a.rules, styles.rules)} aria-label="비밀번호 규칙">
          {rules.map((r) => (
            <li key={r.label} className={cx(r.ok && a.ruleOk)}>
              {r.ok ? <Icon name="check" size={12} strokeWidth={3} /> : '·'} {r.label.replace(' 포함', '')}
            </li>
          ))}
        </ul>
        <PasswordInput
          label="새 비밀번호 확인"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          success={match}
          error={(confirm && !match) || (submitted && !confirm) ? '비밀번호가 서로 달라요.' : undefined}
          hint={match ? <span className={a.ruleOk}>일치해요</span> : undefined}
        />
        {error && (
          <p className={a.noticeDanger} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block loading={submitting}>
          변경하고 로그인
        </Button>
      </form>
      <p className={cx(a.caption, styles.center)}>변경하면 다른 기기의 로그인은 모두 해제돼요.</p>
    </AuthCard>
  )
}
