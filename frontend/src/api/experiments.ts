// 실험 `app/api/experiments.py`
import { api } from './client'
import type {
  BatchTraining,
  ExperimentDetail,
  ExperimentQuery,
  ExperimentSummary,
  MissionBriefing,
  MissionClear,
  Ok,
  RankingRow,
  Report,
  ShareResult,
  SharedRecord,
  SkillLevel,
  TrialRequest,
  TrialResult,
  WhyExplanation,
} from './types'

const enc = encodeURIComponent

/** #000~#008 */
export const getExperiments = (query: ExperimentQuery = {}, signal?: AbortSignal) =>
  api.get<ExperimentSummary[]>('/experiments', { ...query }, signal)
export const getExperiment = (id: string, signal?: AbortSignal) =>
  api.get<ExperimentDetail>(`/experiments/${enc(id)}`, undefined, signal)
export const getBriefing = (id: string, missionId: string, signal?: AbortSignal) =>
  api.get<MissionBriefing>(`/experiments/${enc(id)}/missions/${enc(missionId)}/briefing`, undefined, signal)
export const predict = (id: string, missionId: string, option: string) =>
  api.post<Ok>(`/experiments/${enc(id)}/missions/${enc(missionId)}/predict`, { option })
/** 호출마다 trial +1인 척 샘플을 돌려준다 */
export const runTrial = (id: string, body: TrialRequest) => api.post<TrialResult>(`/experiments/${enc(id)}/trials`, body)
export const trainBatch = (id: string, missionId: string, count = 10) =>
  api.post<BatchTraining>(`/experiments/${enc(id)}/train-batch`, { missionId, count })
export const getWhy = (id: string, trial: number, level?: SkillLevel, signal?: AbortSignal) =>
  api.get<WhyExplanation>(`/experiments/${enc(id)}/trials/${trial}/why`, { level }, signal)
export const getMissionClear = (id: string, missionId: string, signal?: AbortSignal) =>
  api.get<MissionClear>(`/experiments/${enc(id)}/missions/${enc(missionId)}/clear`, undefined, signal)
export const getReport = (id: string, signal?: AbortSignal) =>
  api.get<Report>(`/experiments/${enc(id)}/report`, undefined, signal)
export const getRanking = (id: string, signal?: AbortSignal) =>
  api.get<RankingRow[]>(`/experiments/${enc(id)}/ranking`, undefined, signal)
export const reportNickname = (nickname: string, reason: string) =>
  api.post<Ok>('/ranking/report', { nickname, reason })
export const shareExperiment = (id: string) => api.post<ShareResult>(`/experiments/${enc(id)}/share`)
export const getShared = (shareId: string, signal?: AbortSignal) =>
  api.get<SharedRecord>(`/share/${enc(shareId)}`, undefined, signal)
