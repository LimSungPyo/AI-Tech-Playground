// 사용자 · 온보딩 `app/api/users.py`
import { api } from './client'
import type {
  Badge,
  CharacterId,
  DexEntry,
  ExperimentSummary,
  MeDashboard,
  MeHistory,
  MeHome,
  MeSettings,
  Ok,
  OnboardingRequest,
  PartnerRecommendation,
  ProfileRequest,
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
export const getHistory = (signal?: AbortSignal) => api.get<MeHistory>('/me/history', undefined, signal)
export const getSettings = (signal?: AbortSignal) => api.get<MeSettings>('/me/settings', undefined, signal)
export const saveSettings = (body: MeSettings) => api.put<MeSettings>('/me/settings', body)
export const updateProfile = (body: ProfileRequest) => api.put<User>('/me/profile', body)
/** 현재 비밀번호가 틀린 401은 세션 만료가 아니므로 silent401 */
export const changePassword = (current: string, next: string) =>
  api.put<Ok>('/me/password', { current, next }, { silent401: true })
export const withdraw = (password: string, reason: string) =>
  api.post<WithdrawResult>('/me/withdraw', { password, reason }, { silent401: true })
