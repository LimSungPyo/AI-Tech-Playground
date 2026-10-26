// 알림 · 문의 `app/api/support.py`
import { api } from './client'
import type { Inquiry, InquiryRequest, Notification, Ok, SystemStatus } from './types'

export const getNotifications = (signal?: AbortSignal) =>
  api.get<Notification[]>('/notifications', undefined, signal)
export const readAllNotifications = () => api.post<Ok>('/notifications/read-all')
export const getInquiries = (signal?: AbortSignal) => api.get<Inquiry[]>('/inquiries', undefined, signal)

/** 첨부가 있으면 multipart, 없으면 JSON으로 보낸다 */
export function createInquiry({ files, ...fields }: InquiryRequest) {
  if (files && files.length > 0) {
    const form = new FormData()
    form.set('category', fields.category)
    form.set('title', fields.title)
    form.set('body', fields.body)
    if (fields.notify !== undefined) form.set('notify', String(fields.notify))
    if (fields.experimentId) form.set('experimentId', fields.experimentId)
    if (fields.trial !== undefined) form.set('trial', String(fields.trial))
    for (const f of files) form.append('files', f)
    return api.post<Inquiry>('/inquiries', form)
  }
  return api.post<Inquiry>('/inquiries', fields)
}

/** 항상 maintenance:false */
export const getSystemStatus = (signal?: AbortSignal) => api.get<SystemStatus>('/system/status', undefined, signal)
