// 관리자 `app/api/admin.py` (prefix /api/admin)
import { api } from './client'
import type {
  AdminAnalytics,
  AdminAudit,
  AdminDashboard,
  AdminHome,
  AdminInquiries,
  AdminLoginResult,
  AdminModules,
  AdminNotificationRequest,
  AdminOtpResult,
  AdminRadar,
  AdminUserAction,
  AdminUsers,
  ModulePublishRequest,
  Ok,
  TechCard,
} from './types'

const enc = encodeURIComponent

export const adminLogin = (email: string, password: string) =>
  api.post<AdminLoginResult>('/admin/login', { email, password }, { silent401: true })
/** code `999999`면 403 IP_BLOCKED */
export const adminOtp = (otpId: string, code: string) =>
  api.post<AdminOtpResult>('/admin/otp', { otpId, code }, { silent401: true })
export const getAdminDashboard = (signal?: AbortSignal) =>
  api.get<AdminDashboard>('/admin/dashboard', undefined, signal)
export const getAdminRadar = (signal?: AbortSignal) => api.get<AdminRadar>('/admin/radar', undefined, signal)
export const decideRadar = (id: string, decision: 'approved' | 'rejected') =>
  api.post<Ok>(`/admin/radar/${enc(id)}/decision`, { decision })
export const getAdminCard = (id: string, signal?: AbortSignal) =>
  api.get<TechCard>(`/admin/cards/${enc(id)}`, undefined, signal)
export const saveAdminCard = (card: TechCard) => api.put<TechCard>(`/admin/cards/${enc(card.id)}`, card)
export const getAdminModules = (signal?: AbortSignal) => api.get<AdminModules>('/admin/modules', undefined, signal)
export const publishModule = (id: string, body: ModulePublishRequest) =>
  api.put<Ok>(`/admin/modules/${enc(id)}/publish`, body)
export const getAdminHome = (signal?: AbortSignal) => api.get<AdminHome>('/admin/home', undefined, signal)
export const saveAdminHome = (body: AdminHome) => api.put<AdminHome>('/admin/home', body)
export const getAdminUsers = (q?: string, signal?: AbortSignal) =>
  api.get<AdminUsers>('/admin/users', { q }, signal)
export const adminUserAction = (id: string, action: AdminUserAction, reason: string) =>
  api.post<Ok>(`/admin/users/${enc(id)}/action`, { action, reason })
export const getAdminInquiries = (signal?: AbortSignal) =>
  api.get<AdminInquiries>('/admin/inquiries', undefined, signal)
export const getAdminAnalytics = (signal?: AbortSignal) =>
  api.get<AdminAnalytics>('/admin/analytics', undefined, signal)
export const sendAdminNotification = (body: AdminNotificationRequest) =>
  api.post<Ok & { scheduled: true }>('/admin/notifications', body)
export const getAdminAudit = (signal?: AbortSignal) => api.get<AdminAudit>('/admin/audit', undefined, signal)
