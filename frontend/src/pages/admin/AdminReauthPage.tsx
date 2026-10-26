import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { adminLogin, adminOtp } from '../../api'
import { isApiError } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { Button, Icon, OtpInput, PasswordInput, Spinner } from '../../components'
import { AdminConsoleBadge, AuthShell } from './components/AuthShell'
import { blockedState } from './components/blocked'
import authStyles from './components/AuthShell.module.css'
import styles from './AdminReauthPage.module.css'

/** returnTo는 관리자 경로만 받는다(외부 이동 방지) */
function safeReturn(raw: string | null) {
  return raw && raw.startsWith('/admin') && !raw.startsWith('//') ? raw : '/admin'
}

// W2 admin 담당 · 경로 /admin/reauth — G-10 관리자 콘솔 진입 · 재인증
export default function AdminReauthPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = safeReturn(params.get('returnTo'))
  const { user, status, isAdmin, setAdminToken } = useAuth()
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'loading') {
    return (
      <AuthShell tone="light" label="관리자 재인증">
        <div className={styles.center}>
          <Spinner size="lg" />
        </div>
      </AuthShell>
    )
  }
  // 회원 로그인 없이 들어오면 관리자 로그인(F-01)으로, 관리자가 아니면 홈으로
  if (status !== 'member') return <Navigate to="/admin/login" replace />
  if (!isAdmin || !user) return <Navigate to="/" replace />

  const submit = async (value = code) => {
    if (!password) {
      setError('비밀번호를 입력해 주세요.')
      return
    }
    if (value.length !== 6) {
      setError('Authenticator 앱의 6자리를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { otpId } = await adminLogin(user.email, password)
      const res = await adminOtp(otpId, value)
      setAdminToken(res.adminToken)
      navigate(returnTo, { replace: true })
    } catch (e) {
      setBusy(false)
      if (isApiError(e) && e.code === 'IP_BLOCKED') {
        navigate('/admin/blocked', { replace: true, state: blockedState(e, user.email) })
        return
      }
      setCode('')
      setError(isApiError(e) ? e.message : '인증하지 못했어요. 다시 시도해 주세요.')
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit()
  }

  const cancel = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/', { replace: true })
  }

  return (
    <AuthShell tone="light" label="관리자 콘솔 재인증">
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.center}>
          <AdminConsoleBadge />
        </div>
        <h1 className={authStyles.title}>관리자 콘솔로 이동해요</h1>
        <p className={authStyles.desc}>사용자 화면과 관리자 화면은 따로 로그인돼요. 보안을 위해 한 번 더 확인할게요.</p>

        <ul className={styles.checks}>
          <li>
            <Icon name="check" size={14} /> 허용된 네트워크 · 사내 VPN
          </li>
          <li>
            <Icon name="check" size={14} /> 관리자 권한 · {user.nickname}
          </li>
        </ul>

        <PasswordInput
          label="비밀번호"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />

        <div className={styles.otp}>
          <span className={authStyles.otpLabelCenter}>Authenticator 앱의 6자리</span>
          <OtpInput
            label="Authenticator 6자리"
            value={code}
            onChange={setCode}
            onComplete={(v) => void submit(v)}
            error={Boolean(error)}
            disabled={busy}
          />
        </div>

        {error && (
          <p className={authStyles.error} role="alert">
            {error}
          </p>
        )}

        <div className={authStyles.buttons}>
          <Button variant="secondary" size="lg" pill={false} onClick={cancel}>
            취소
          </Button>
          <Button type="submit" variant="dark" size="lg" pill={false} loading={busy} iconRight={<Icon name="arrow-up-right" size={16} />}>
            인증하고 이동
          </Button>
        </div>

        <p className={authStyles.caption}>관리자 세션은 8시간 · 새 탭(admin.playground.ai)에서 열려요</p>
      </form>
    </AuthShell>
  )
}
