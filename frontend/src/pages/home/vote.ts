// 투표 · 실험 ↔ 캐릭터 변환(홈 D-09 모달 · 레이더 투표 카드에서 함께 쓴다)
import type { CharacterId, Vote } from '../../api/types'
import { CHARACTERS, CHARACTER_IDS } from '../../components'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 실험 id("003") → 캐릭터 */
export function characterOfExperiment(id: string): CharacterId | undefined {
  return CHARACTER_IDS.find((c) => CHARACTERS[c].experiment === `#${id}`)
}

/** 투표 결과 비율(0~100 정수) */
export function votePercents(vote: Vote) {
  const total = vote.options.reduce((s, o) => s + o.votes, 0)
  return { total, pct: (votes: number) => (total ? Math.round((votes / total) * 100) : 0) }
}

/** 마감: 일요일 23:59 */
export function formatDeadline(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${WEEKDAYS[d.getDay()]}요일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
