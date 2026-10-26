// 기억된 회원(07:M-01 기억된 회원 홈 · 07:M-02 기억된 계정 로그인 · 08:M-01 세션 만료).
// 이메일은 `atp.rememberedEmail`, 화면에 보일 닉네임 · 아바타 · 마지막 로그인 방법 · 멈춘 Trial은 `atp.rememberedProfile`에 둔다.
// 로그인 화면(pages/auth)과 홈(pages/home)이 모두 이 파일의 함수로 같은 키를 읽고 쓴다.
import type { CharacterId, SocialProvider, User } from '../api/types'
import { getRememberedEmail, setRememberedEmail } from './storage'

export const REMEMBERED_PROFILE_KEY = 'atp.rememberedProfile'

export type LoginMethod = SocialProvider | 'email'

/** 마지막으로 멈춘 실험 회차(07:M-01 "Trial 34에서 멈춰 있어요") */
export interface PausedTrial {
  experimentId: string
  code: string
  title: string
  trial: number
}

export interface RememberedProfile {
  email: string
  nickname: string
  avatar: CharacterId | null
  provider: LoginMethod
  /** User.lastPlayed에서 저장. 없으면 키가 빠진다 */
  pausedTrial?: PausedTrial
}

const fallback = (email: string): RememberedProfile => ({ email, nickname: email.split('@')[0], avatar: null, provider: 'email' })

/** 기억된 회원. 이메일이 없으면 null */
export function getRememberedProfile(): RememberedProfile | null {
  const email = getRememberedEmail()
  if (!email) return null
  try {
    const raw = window.localStorage.getItem(REMEMBERED_PROFILE_KEY)
    const saved = raw ? (JSON.parse(raw) as Partial<RememberedProfile>) : {}
    if (saved.email && saved.email !== email) return fallback(email)
    return {
      email,
      nickname: saved.nickname ?? email.split('@')[0],
      avatar: saved.avatar ?? null,
      provider: saved.provider ?? 'email',
      ...(saved.pausedTrial ? { pausedTrial: saved.pausedTrial } : {}),
    }
  } catch {
    return fallback(email)
  }
}

/** 로그인 성공 후 호출. remember가 false면 기억된 회원을 지운다 */
export function rememberAccount(user: User, provider: LoginMethod, remember: boolean) {
  if (!remember) {
    forgetAccount()
    return
  }
  setRememberedEmail(user.email)
  const profile: RememberedProfile = {
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    provider,
    ...(user.lastPlayed ? { pausedTrial: user.lastPlayed } : {}),
  }
  try {
    window.localStorage.setItem(REMEMBERED_PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // 저장소를 못 쓰면 이메일만 기억한다
  }
}

export function forgetAccount() {
  setRememberedEmail(null)
  try {
    window.localStorage.removeItem(REMEMBERED_PROFILE_KEY)
  } catch {
    // 무시
  }
}
