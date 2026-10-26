// 사용자 · 온보딩 `app/api/users.py`
import { api } from './client'
import type {
  Badge,
  CharacterId,
  DexEntry,
  ExperimentSummary,
  ExportResult,
  HistoryPeriod,
  MeDashboard,
  MeHistory,
  MeHome,
  MeSettings,
  Ok,
  OnboardingRequest,
  PartnerRecommendation,
  ProfileRequest,
  SocialConnectResult,
  SocialProvider,
  User,
  WithdrawResult,
} from './types'

export const getHome = (signal?: AbortSignal) => api.get<MeHome>('/me/home', undefined, signal)
export const saveOnboarding = (body: OnboardingRequest) => api.put<User>('/me/onboarding', body)
export const getPartnerRecommendation = (signal?: AbortSignal) =>
  api.get<PartnerRecommendation>('/me/partner-recommendation', undefined, signal)
export const setPartner = (character: CharacterId) => api.put<User>('/me/partner', { character })
export const getDashboard = (signal?: AbortSignal) => api.get<MeDashboard>('/me/dashboard', undefined, signal)
export const getMyExperiments = (signal?: AbortSignal) =>
  api.get<ExperimentSummary[]>('/me/experiments', undefined, signal)
export const getMyCharacters = (signal?: AbortSignal) => api.get<DexEntry[]>('/me/characters', undefined, signal)
export const getMyBadges = (signal?: AbortSignal) => api.get<Badge[]>('/me/badges', undefined, signal)
/** period는 v2(기본 week) */
export const getHistory = (signal?: AbortSignal, period?: HistoryPeriod) =>
  api.get<MeHistory>('/me/history', { period }, signal)
export const getSettings = (signal?: AbortSignal) => api.get<MeSettings>('/me/settings', undefined, signal)
export const saveSettings = (body: MeSettings) => api.put<MeSettings>('/me/settings', body)
export const updateProfile = (body: ProfileRequest) => api.put<User>('/me/profile', body)
/** 현재 비밀번호가 틀린 401은 세션 만료가 아니므로 silent401 */
export const changePassword = (current: string, next: string) =>
  api.put<Ok>('/me/password', { current, next }, { silent401: true })
export const withdraw = (password: string, reason: string) =>
  api.post<WithdrawResult>('/me/withdraw', { password, reason }, { silent401: true })

// ── v2 ──
/** C-05 대표 배지 저장. 얻지 못한 배지면 400 BADGE_NOT_OBTAINED */
export const setFeaturedBadge = (badgeId: string) =>
  api.put<Ok & { featuredBadgeId: string }>('/me/badges/featured', { badgeId })
/** C-07 소셜 계정 연결 · 해제 */
export const connectSocial = (provider: SocialProvider, code: string) =>
  api.post<SocialConnectResult>(`/me/social/${provider}`, { code })
export const disconnectSocial = (provider: SocialProvider) => api.del<SocialConnectResult>(`/me/social/${provider}`)
/** C-07 이메일 변경(새 이메일로 인증 메일). 비밀번호가 틀리면 401 — 세션 만료가 아니므로 silent401 */
export const changeEmail = (email: string, password: string) =>
  api.put<Ok & { email: string; verificationRequired: boolean }>('/me/email', { email, password }, { silent401: true })
/** C-07 데이터 내려받기 요청(완료되면 메일) */
export const requestDataExport = () => api.post<ExportResult>('/me/export')
/** C-07 학습 기록(experiments) · 전체(all) 초기화. 비밀번호가 틀리면 401(silent401) */
export const resetRecords = (password: string, scope: 'experiments' | 'all' = 'experiments') =>
  api.post<Ok>('/me/reset', { password, scope }, { silent401: true })
