// 관리자 `app/api/admin.py` (prefix /api/admin)
import { api } from './client'
import type {
  AdminAnalytics,
  AdminAudit,
  AdminCards,
  AdminDashboard,
  AdminHome,
  AdminInquiries,
  AdminInquiryAnswer,
  AdminLoginResult,
  AdminModules,
  AdminNotificationRequest,
  AdminOtpResult,
  AdminRadar,
  AdminSentNotifications,
  AdminUserAction,
  AdminUsers,
  ModuleStage,
  ModulePublishRequest,
  Ok,
  RadarDecision,
  TechCard,
} from './types'

const enc = encodeURIComponent

export const adminLogin = (email: string, password: string) =>
  api.post<AdminLoginResult>('/admin/login', { email, password }, { silent401: true })
/** code `999999`면 403 IP_BLOCKED (data: IpBlockedData · v2) */
export const adminOtp = (otpId: string, code: string) =>
  api.post<AdminOtpResult>('/admin/otp', { otpId, code }, { silent401: true })
export const getAdminDashboard = (signal?: AbortSignal) =>
  api.get<AdminDashboard>('/admin/dashboard', undefined, signal)
export const getAdminRadar = (signal?: AbortSignal) => api.get<AdminRadar>('/admin/radar', undefined, signal)
/** merged(v2)면 mergeInto에 합칠 후보 id */
export const decideRadar = (id: string, decision: RadarDecision, mergeInto?: string) =>
  api.post<Ok>(`/admin/radar/${enc(id)}/decision`, { decision, mergeInto })
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

// ── v2 ──
/** F-04 카드 목록(9장 · 검토 단계) */
export const getAdminCards = (signal?: AbortSignal) => api.get<AdminCards>('/admin/cards', undefined, signal)
/** F-05 파이프라인 단계 변경 */
export const changeModuleStage = (id: string, stage: ModuleStage) =>
  api.put<Ok>(`/admin/modules/${enc(id)}/stage`, { stage })
/** F-10 문의 답변 보내기 */
export const answerAdminInquiry = (id: string, body: AdminInquiryAnswer) =>
  api.post<Ok & { answeredAt: string }>(`/admin/inquiries/${enc(id)}/answer`, body)
/** F-12 최근 발송 */
export const getAdminSentNotifications = (signal?: AbortSignal) =>
  api.get<AdminSentNotifications>('/admin/notifications', undefined, signal)
/** F-13 관리자 초대 */
export const inviteAdmin = (email: string, role: string) =>
  api.post<Ok & { invited: { id: string; name: string; role: string } }>('/admin/admins', { email, role })
