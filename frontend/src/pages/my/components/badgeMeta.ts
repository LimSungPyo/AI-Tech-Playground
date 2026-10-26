// 배지 표시 메타. 배지 목록 · 카테고리 · 진행률 · 관련 실험은 /api/me/badges(v2)에서 받고,
// 여기에는 API에 없는 카테고리 설명 · 원 색만 둔다.
import type { Badge } from '../../../api'

export type BadgeCategory = 'play' | 'understand' | 'steady' | 'expand'

/** title은 API Badge.category 값과 같다 */
export const BADGE_CATEGORIES: { id: BadgeCategory; title: string; description: string }[] = [
  { id: 'play', title: '실험', description: '직접 해보며 얻는 배지' },
  { id: 'understand', title: '이해', description: '원리를 들여다볼 때 얻는 배지' },
  { id: 'steady', title: '꾸준함', description: '조금씩, 자주' },
  { id: 'expand', title: '협업 · 확장', description: '새 기술과 팀' },
]

interface BadgeMeta {
  /** category가 없는 응답일 때 쓰는 기본 카테고리 */
  category: BadgeCategory
  /** 원 배경색(토큰 변수) */
  color: string
}

export const BADGE_META: Record<string, BadgeMeta> = {
  'first-clear': { category: 'play', color: 'var(--color-accent-warning)' },
  prophet: { category: 'play', color: 'var(--color-accent-indigo)' },
  'hundred-trials': { category: 'play', color: 'var(--color-accent-indigo)' },
  'why-explorer': { category: 'understand', color: 'var(--color-accent-yellow)' },
  'reveal-witness': { category: 'understand', color: 'var(--color-glass-dark)' },
  'card-collector': { category: 'understand', color: 'var(--color-accent-indigo)' },
  'connectome-intro': { category: 'steady', color: 'var(--color-accent-pink)' },
  'streak-7': { category: 'steady', color: 'var(--color-accent-success)' },
  'streak-30': { category: 'steady', color: 'var(--color-accent-success)' },
  'team-leader': { category: 'expand', color: 'var(--color-accent-indigo)' },
  'rag-detective': { category: 'expand', color: 'var(--color-accent-indigo)' },
  creator: { category: 'expand', color: 'var(--color-accent-indigo)' },
}

export const badgeMeta = (id: string): BadgeMeta =>
  BADGE_META[id] ?? { category: 'expand', color: 'var(--color-accent-indigo)' }

/** API category 문자열 → 카테고리 id */
export const badgeCategory = (b: Badge): BadgeCategory =>
  BADGE_CATEGORIES.find((c) => c.title === b.category)?.id ?? badgeMeta(b.id).category
