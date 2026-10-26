// 인증 `app/api/auth.py`
import { api } from './client'
import type {
  AuthResult,
  GuestMergeResult,
  LoginRequest,
  Ok,
  ResendResult,
  RestorePreview,
  SignupRequest,
  SignupResult,
  SocialProvider,
  User,
  VerifyEmailResult,
} from './types'

/** 401 INVALID_PASSWORD(data.remainingAttempts) · 423 ACCOUNT_LOCKED(data.unlockAt) */
export const login = (body: LoginRequest) => api.post<AuthResult>('/auth/login', body, { silent401: true })

/** 409 SOCIAL_CONFLICT 가능 */
export const socialLogin = (provider: SocialProvider, code: string) =>
  api.post<AuthResult>(`/auth/social/${provider}`, { code }, { silent401: true })

export const logout = () => api.post<Ok>('/auth/logout', undefined, { silent401: true })

/** 토큰 없으면 401 */
export const getMe = (signal?: AbortSignal) => api.get<User>('/auth/me', undefined, signal)

export const signup = (body: SignupRequest) => api.post<SignupResult>('/auth/signup', body)

/** code `000000`이면 400 INVALID_CODE */
export const verifyEmail = (verificationId: string, code: string) =>
  api.post<VerifyEmailResult>('/auth/verify-email', { verificationId, code })

export const forgotPassword = (email: string) =>
  api.post<Ok & { expiresInMin: number }>('/auth/password/forgot', { email })

export const resetPassword = (resetToken: string, password: string) =>
  api.post<Ok>('/auth/password/reset', { resetToken, password }, { silent401: true })

export const restoreAccount = (email: string) =>
  api.post<Ok & { deletionScheduledAt: string }>('/auth/restore', { email }, { silent401: true })

export const mergeGuestTrials = (trials: number) => api.post<GuestMergeResult>('/auth/guest/merge', { trials })

// ── v2 ──
/** E-01 인증 코드 다시 보내기 */
export const resendVerification = (verificationId: string) =>
  api.post<ResendResult>('/auth/verify-email/resend', { verificationId })

/** M-05 기존 이메일 계정 비밀번호로 소셜 계정 연결. 비밀번호 `wrong`이면 401 INVALID_PASSWORD */
export const linkSocial = (provider: SocialProvider, email: string, password: string) =>
  api.post<AuthResult>(`/auth/social/${provider}/link`, { email, password }, { silent401: true })

/** M-06 탈퇴 유예 계정 복구 미리보기(삭제 예정일 · 되살아날 기록 수) */
export const getRestorePreview = (email: string, signal?: AbortSignal) =>
  api.get<RestorePreview>('/auth/restore/preview', { email }, signal)
