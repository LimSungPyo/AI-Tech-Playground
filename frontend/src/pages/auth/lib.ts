// 인증 화면 공용 도우미(W2 auth 폴더 전용)
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { socialLogin } from '../../api/auth'
import { isApiError } from '../../api/client'
import type { SocialProvider, User } from '../../api/types'
import { rememberAccount } from '../../auth/remembered'
import { getGuestTrials } from '../../auth/storage'
import { useAuth } from '../../auth/useAuth'

/** 게스트 체험 무료 횟수(#001 3회) */
export const GUEST_TRIAL_LIMIT = 3
/** 비밀번호 5회 실패 시 잠금 */
export const MAX_LOGIN_ATTEMPTS = 5
/** 메일 재전송 간격(초) */
export const RESEND_COOLDOWN_SEC = 60
/** 가입 인증 코드 유효 시간(초) */
export const OTP_VALID_SEC = 10 * 60

export const PROVIDER_LABEL: Record<SocialProvider | 'email', string> = {
  google: 'Google',
  kakao: '카카오',
  github: 'GitHub',
  email: '이메일',
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/** hyewon@playground.ai → hy***@playground.ai */
export function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 2)}***@${domain}`
}

/** 외부 주소로 튀지 않게 앱 안 경로만 받는다 */
export function safeReturnTo(raw: string | null | undefined, fallback = '/') {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}

export function guestTrialsLeft() {
  return Math.max(0, GUEST_TRIAL_LIMIT - getGuestTrials())
}

// ── 기억된 회원(07:M-01 · M-02) ──
// 공용 헬퍼(src/auth/remembered.ts)로 옮겼다. 홈(W2 hub)도 같은 키를 읽는다.
export { forgetAccount, getRememberedProfile, rememberAccount } from '../../auth/remembered'
export type { RememberedProfile } from '../../auth/remembered'

// ── 소셜 로그인 ──
/** 개발 확인용: `?socialCode=conflict`면 백엔드 샘플이 409를 돌려준다 */
function sampleSocialCode() {
  return new URLSearchParams(window.location.search).get('socialCode') ?? 'sample'
}

export interface SocialConflictState {
  email?: string
  provider: SocialProvider
  returnTo?: string
}

/**
 * 소셜 로그인 버튼 동작. 성공하면 onSuccess, 409 SOCIAL_CONFLICT면 `/account/social-conflict`로 보낸다.
 * onLeave는 다른 화면으로 넘어가기 직전에 부른다(팝업 닫기).
 */
export function useSocialLogin(opts: {
  remember: boolean
  returnTo?: string
  onSuccess: (user: User) => void
  onLeave?: () => void
  onError?: (message: string) => void
}) {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState<SocialProvider | null>(null)
  const { remember, returnTo, onSuccess, onLeave, onError } = opts

  const start = useCallback(
    async (provider: SocialProvider) => {
      setPending(provider)
      try {
        const res = await socialLogin(provider, sampleSocialCode())
        rememberAccount(res.user, provider, remember)
        setToken(res.token, res.user)
        onSuccess(res.user)
      } catch (e) {
        if (isApiError(e) && e.status === 409) {
          const data = (e.data ?? {}) as { email?: string }
          onLeave?.()
          navigate('/account/social-conflict', { state: { email: data.email, provider, returnTo } satisfies SocialConflictState })
        } else {
          onError?.(isApiError(e) ? e.message : '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.')
        }
      } finally {
        setPending(null)
      }
    },
    [navigate, onError, onLeave, onSuccess, remember, returnTo, setToken],
  )

  return { start, pending }
}

// ── 타이머 ──
/** 초 단위 카운트다운. restart(sec)로 다시 시작 */
export function useCountdown(initialSec: number) {
  const [endAt, setEndAt] = useState(() => Date.now() + initialSec * 1000)
  const [now, setNow] = useState(() => Date.now())
  const left = Math.max(0, Math.ceil((endAt - now) / 1000))

  useEffect(() => {
    if (left <= 0) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [left, endAt])

  const restart = useCallback((sec: number) => {
    const t = Date.now()
    setNow(t)
    setEndAt(t + sec * 1000)
  }, [])

  return { left, restart }
}

export const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

/** 미디어 쿼리 구독(768px 이하 바텀시트 전환 등) */
export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const on = () => setMatch(mql.matches)
    mql.addEventListener('change', on)
    return () => mql.removeEventListener('change', on)
  }, [query])
  return match
}

// ── 비밀번호 규칙(A-01 · M-04) ──
export interface PasswordRule {
  label: string
  ok: boolean
}

export function passwordRules(pw: string, email?: string): PasswordRule[] {
  const rules: PasswordRule[] = [
    { label: '8자 이상', ok: pw.length >= 8 },
    { label: '숫자 포함', ok: /\d/.test(pw) },
    { label: '특수문자 포함', ok: /[^A-Za-z0-9]/.test(pw) },
  ]
  if (email !== undefined) {
    const local = email.split('@')[0]
    rules.push({ label: '이메일과 다름', ok: pw.length > 0 && (!local || !pw.toLowerCase().includes(local.toLowerCase())) })
  }
  return rules
}

export function passwordStrength(rules: PasswordRule[]): { score: number; label: string } {
  const score = rules.filter((r) => r.ok).length
  const label = score <= 1 ? '약함' : score === rules.length ? '강함' : '보통'
  return { score, label }
}
