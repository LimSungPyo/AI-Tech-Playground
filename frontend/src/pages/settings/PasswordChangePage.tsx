import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { changePassword, isApiError } from '../../api'
import { Button, Checkbox, Icon, PasswordInput, cx, useToast } from '../../components'
import { BackLink } from './components/BackLink'
import { useLocalPrefs } from './localPrefs'
import styles from './PasswordChangePage.module.css'

const STRENGTH_LABELS = ['', '약해요', '보통이에요', '괜찮아요', '안전해요']

// W2 my 담당 · 경로 /settings/password — H-09 비밀번호 변경
export default function PasswordChangePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [prefs, setPref] = useLocalPrefs()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [currentError, setCurrentError] = useState<string>()
  const [saving, setSaving] = useState(false)

  const rules = [
    { label: '8자 이상', ok: next.length >= 8 },
    { label: '영문 + 숫자', ok: /[A-Za-z]/.test(next) && /\d/.test(next) },
    { label: '특수문자 포함', ok: /[^A-Za-z0-9]/.test(next) },
    { label: '이전 비밀번호와 다름', ok: next.length > 0 && next !== current },
  ]
  const strength = next ? rules.filter((r) => r.ok).length : 0
  const mismatch = confirm.length > 0 && confirm !== next
  const canSubmit = current.length > 0 && strength === rules.length && confirm === next

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      await changePassword(current, next)
      toast.show({ title: '비밀번호를 바꿨어요. 보안 알림 메일을 보냈어요.', tone: 'success' })
      navigate('/settings')
    } catch (e) {
      if (isApiError(e) && (e.status === 400 || e.status === 401)) setCurrentError('현재 비밀번호가 맞지 않아요')
      else toast.show({ title: '비밀번호를 바꾸지 못했어요', description: '잠시 뒤 다시 시도해 주세요', tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <BackLink to="/settings">설정 · 계정 · 보안</BackLink>
      <h1 className={styles.title}>비밀번호 변경</h1>

      <div className={styles.layout}>
        <form
          className={styles.card}
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <PasswordInput
            label="현재 비밀번호"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value)
              setCurrentError(undefined)
            }}
            error={currentError}
            autoComplete="current-password"
          />

          <div className={styles.group}>
            <PasswordInput
              label="새 비밀번호"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
            <div className={styles.meter} aria-hidden>
              {rules.map((r, i) => (
                <span key={r.label} className={cx(styles.bar, i < strength && styles[`s${strength}`])} />
              ))}
            </div>
            {strength > 0 && (
              <p className={cx(styles.strength, styles[`t${strength}`])} aria-live="polite">
                {STRENGTH_LABELS[strength]}
              </p>
            )}
            <ul className={styles.rules}>
              {rules.map((r) => (
                <li key={r.label} className={cx(styles.rule, r.ok && styles.ruleOk)}>
                  <Icon name={r.ok ? 'check' : 'minus'} size={14} strokeWidth={3} />
                  {r.label}
                </li>
              ))}
            </ul>
          </div>

          <PasswordInput
            label="새 비밀번호 확인"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={mismatch ? '새 비밀번호와 달라요' : undefined}
            success={confirm.length > 0 && !mismatch}
            autoComplete="new-password"
          />

          <Checkbox
            className={styles.devices}
            label="다른 기기에서 모두 로그아웃 (현재 기기 제외)"
            checked={prefs.logoutOtherDevices}
            onChange={(e) => setPref('logoutOtherDevices', e.target.checked)}
          />

          <Button type="submit" size="lg" block disabled={!canSubmit} loading={saving}>
            비밀번호 변경
          </Button>
        </form>

        <aside className={styles.side}>
          <h2 className={styles.sideTitle}>소셜 로그인 계정이에요?</h2>
          <p className={styles.sideBody}>
            Google · 카카오로만 가입했다면 비밀번호가 없어요. 아래에서 비밀번호를 새로 만들 수 있어요.
          </p>
          <Link to="/password/forgot" className={styles.sideLink}>
            비밀번호 만들기 →
          </Link>
        </aside>
      </div>
    </div>
  )
}
