import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { adminLogin, adminOtp } from '../../api'
import { isApiError } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { Button, Icon, Input, Logo, OtpInput, PasswordInput } from '../../components'
import { AuthShell } from './components/AuthShell'
import { blockedState } from './components/blocked'
import authStyles from './components/AuthShell.module.css'
import styles from './AdminLoginPage.module.css'

// W2 admin 담당 · 경로 /admin/login — F-01 관리자 로그인 (2단계 인증)
export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setToken, setAdminToken } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpId, setOtpId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ipVerified, setIpVerified] = useState(false)

  const verify = async (id: string, value: string) => {
    setBusy(true)
    setError(null)
    try {
      const res = await adminOtp(id, value)
      setIpVerified(res.ipVerified)
      // 관리자 재인증 토큰(sessionStorage) + 회원 토큰도 관리자 토큰으로 바꿔 me.role = admin을 받는다
      setAdminToken(res.adminToken)
      setToken(res.adminToken)
      window.setTimeout(() => navigate('/admin', { replace: true }), 600)
    } catch (e) {
      setBusy(false)
      if (isApiError(e) && e.code === 'IP_BLOCKED') {
        navigate('/admin/blocked', { replace: true, state: blockedState(e, email) })
        return
      }
      setCode('')
      setError(isApiError(e) ? e.message : '인증 코드를 확인하지 못했어요.')
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (otpId) {
      if (code.length === 6) await verify(otpId, code)
      else setError('Authenticator 앱의 6자리를 입력해 주세요.')
      return
    }
    if (!email.trim() || !password) {
      setError('관리자 이메일과 비밀번호를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await adminLogin(email.trim(), password)
      setOtpId(res.otpId)
    } catch (err) {
      setError(isApiError(err) ? err.message : '로그인하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell label="관리자 로그인">
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.brand}>
          <Logo size={36} />
          <span className={authStyles.adminBadge}>ADMIN CONSOLE</span>
        </div>
        <h1 className={authStyles.title}>관리자 로그인</h1>

        <Input
          label="관리자 이메일"
          type="email"
          autoComplete="username"
          placeholder="admin.hyewon@playground.ai"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          success={otpId !== null}
          disabled={otpId !== null}
          autoFocus
        />
        <PasswordInput
          label="비밀번호"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          success={otpId !== null}
          disabled={otpId !== null}
        />

        <div className={authStyles.otpBox} aria-disabled={otpId === null}>
          <span className={authStyles.otpLabel}>2단계 인증 · Authenticator 앱의 6자리</span>
          <OtpInput
            label="Authenticator 6자리"
            value={code}
            onChange={setCode}
            onComplete={(v) => otpId && void verify(otpId, v)}
            error={Boolean(error) && otpId !== null}
            disabled={otpId === null || busy}
            autoFocus={otpId !== null}
          />
          {ipVerified && (
            <span className={styles.ip} role="status">
              <Icon name="check" size={14} /> 허용된 IP · 사내 VPN 확인됨
            </span>
          )}
        </div>

        {error && (
          <p className={authStyles.error} role="alert">
            {error}
          </p>
        )}

        <Button type="submit" variant="dark" size="lg" block pill={false} loading={busy}>
          로그인
        </Button>

        <ul className={authStyles.guide}>
          <li>· 허용된 IP · 사내 VPN에서만 접속할 수 있어요</li>
          <li>· 5회 실패 시 계정 잠금 + 슈퍼관리자에게 알림</li>
          <li>· 8시간 동안 활동이 없으면 자동 로그아웃</li>
        </ul>
      </form>
    </AuthShell>
  )
}
