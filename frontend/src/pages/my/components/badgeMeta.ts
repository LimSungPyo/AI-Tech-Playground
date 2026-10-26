// 배지 카탈로그 메타(카테고리 · 색 · 관련 실험). 배지 목록 자체는 /api/me/badges에서 받는다.
export type BadgeCategory = 'play' | 'understand' | 'steady' | 'expand'

export const BADGE_CATEGORIES: { id: BadgeCategory; title: string; description: string }[] = [
  { id: 'play', title: '실험', description: '직접 해보며 얻는 배지' },
  { id: 'understand', title: '이해', description: '원리를 들여다볼 때 얻는 배지' },
  { id: 'steady', title: '꾸준함', description: '조금씩, 자주' },
  { id: 'expand', title: '협업 · 확장', description: '새 기술과 팀' },
]

interface BadgeMeta {
  category: BadgeCategory
  /** 원 배경색(토큰 변수) */
  color: string
  experimentId?: string
}

export const BADGE_META: Record<string, BadgeMeta> = {
  'first-clear': { category: 'play', color: 'var(--color-accent-warning)', experimentId: '001' },
  prophet: { category: 'play', color: 'var(--color-accent-indigo)', experimentId: '001' },
  'hundred-trials': { category: 'play', color: 'var(--color-accent-indigo)' },
  'why-explorer': { category: 'understand', color: 'var(--color-accent-yellow)', experimentId: '001' },
  'reveal-witness': { category: 'understand', color: 'var(--color-glass-dark)', experimentId: '000' },
  'card-collector': { category: 'understand', color: 'var(--color-accent-indigo)' },
  'connectome-intro': { category: 'steady', color: 'var(--color-accent-pink)', experimentId: '000' },
  'streak-7': { category: 'steady', color: 'var(--color-accent-success)' },
  'streak-30': { category: 'steady', color: 'var(--color-accent-success)' },
  'team-leader': { category: 'expand', color: 'var(--color-accent-indigo)' },
  'rag-detective': { category: 'expand', color: 'var(--color-accent-indigo)', experimentId: '002' },
  creator: { category: 'expand', color: 'var(--color-accent-indigo)' },
}

export const badgeMeta = (id: string): BadgeMeta =>
  BADGE_META[id] ?? { category: 'expand', color: 'var(--color-accent-indigo)' }
