// 콘텐츠 `app/api/content.py`
import { api } from './client'
import type {
  CarouselSlide,
  DexEntry,
  RadarKeyword,
  RadarWeek,
  TeamMission,
  TeamMissionResult,
  TechCard,
  TechDrop,
  TreeNode,
  Vote,
} from './types'

const enc = encodeURIComponent

export const getCards = (signal?: AbortSignal) => api.get<TechCard[]>('/cards', undefined, signal)
export const getCard = (id: string, signal?: AbortSignal) => api.get<TechCard>(`/cards/${enc(id)}`, undefined, signal)
export const getTree = (signal?: AbortSignal) => api.get<{ nodes: TreeNode[] }>('/tree', undefined, signal)
export const getDex = (signal?: AbortSignal) => api.get<DexEntry[]>('/dex', undefined, signal)
/** week(YYYY-MM-DD, v2)를 주면 그 주 레이더. 없는 주면 404 RADAR_WEEK_NOT_FOUND */
export const getRadar = (signal?: AbortSignal, week?: string) => api.get<RadarWeek>('/radar', { week }, signal)
export const getRadarKeyword = (keywordId: string, signal?: AbortSignal) =>
  api.get<RadarKeyword>(`/radar/${enc(keywordId)}`, undefined, signal)
/** 000~004 */
export const getCarousel = (signal?: AbortSignal) =>
  api.get<{ slides: CarouselSlide[] }>('/home/carousel', undefined, signal)
export const getCurrentVote = (signal?: AbortSignal) => api.get<Vote>('/votes/current', undefined, signal)
export const castVote = (voteId: string, optionId: string) => api.post<Vote>(`/votes/${enc(voteId)}`, { optionId })
export const getTechDrop = (code: string, signal?: AbortSignal) =>
  api.get<TechDrop>(`/tech-drops/${enc(code)}`, undefined, signal)
export const subscribeTechDrop = (code: string) =>
  api.post<{ subscribed: true }>(`/tech-drops/${enc(code)}/subscribe`)
/** v2 · 오픈 알림 해제 */
export const unsubscribeTechDrop = (code: string) =>
  api.del<{ subscribed: false }>(`/tech-drops/${enc(code)}/subscribe`)
export const getTeamMission = (id: string, signal?: AbortSignal) =>
  api.get<TeamMission>(`/team-missions/${enc(id)}`, undefined, signal)
export const getTeamMissionResult = (id: string, signal?: AbortSignal) =>
  api.get<TeamMissionResult>(`/team-missions/${enc(id)}/result`, undefined, signal)
