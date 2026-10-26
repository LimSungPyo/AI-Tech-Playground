// 실험 요약 → 화면 표시(난이도 이름, 카드 상태, 버튼)로 바꾸는 W2 growth 공용 도우미
import type { BadgeTone } from '../../components'
import type { ExperimentSummary, Level } from '../../api/types'

export const LEVEL_LABEL: Record<Level, string> = {
  intro: '입문',
  basic: '기초',
  advanced: '심화',
  frontier: '최전선',
}

export const LEVELS: Level[] = ['intro', 'basic', 'advanced', 'frontier']

/** 실험실 카드에서 쓰는 상태. API status를 화면 상태(완료 · 투표 중 등)로 나눈다 */
export type CardState = 'in_progress' | 'done' | 'open' | 'coming_soon' | 'voting' | 'locked'

export const STATE_LABEL: Record<CardState, string> = {
  in_progress: '진행 중',
  done: '완료',
  open: '열림',
  coming_soon: '오픈 예정',
  voting: '투표 중',
  locked: '잠김',
}

export const STATE_TONE: Record<CardState, BadgeTone> = {
  in_progress: 'solid',
  done: 'success',
  open: 'indigo',
  coming_soon: 'dark',
  voting: 'warning',
  locked: 'neutral',
}

/**
 * 비회원은 진행 기록이 없으므로 진행 중 · 완료를 "열림"으로 본다.
 * coming_soon 가운데 오픈 투표가 걸린 실험(v2 `vote`, #003)은 "투표 중"으로 나눈다.
 */
export function cardState(exp: ExperimentSummary, isMember: boolean): CardState {
  if (exp.status === 'locked') return 'locked'
  if (exp.status === 'coming_soon') return exp.vote ? 'voting' : 'coming_soon'
  if (!isMember) return 'open'
  if (exp.status === 'in_progress') return 'in_progress'
  if (exp.progress && exp.progress.trial >= exp.progress.maxTrial) return 'done'
  return 'open'
}

/** 썸네일 배경: 캐릭터 고유색을 옅게(캐릭터 고유색은 토큰 예외) */
export const thumbBg = (color: string) => `color-mix(in srgb, ${color} 22%, var(--color-bg-cream))`

export const pct = (n: number) => `${Math.round(n)}%`
