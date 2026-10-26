// 인증 `app/api/auth.py`
import { api } from './client'
import type {
  AuthResult,
  LoginRequest,
  Ok,
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

export const mergeGuestTrials = (trials: number) => api.post<{ merged: number }>('/auth/guest/merge', { trials })
