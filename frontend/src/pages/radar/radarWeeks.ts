// 레이더 주차 표기: 기준 주(월요일)에서 n주 전 날짜를 MM.DD로
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const p = (n: number) => String(n).padStart(2, '0')

function addDays(iso: string, days: number) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d
}

/** "2026-10-13" → "10.13" (offsetWeeks만큼 앞/뒤) */
export function weekLabel(iso: string, offsetWeeks = 0) {
  const d = addDays(iso, offsetWeeks * 7)
  return `${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

/** "2026-10-13T09:00:00+09:00" → "2026.10.13 (월)" */
export function updatedLabel(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} (${WEEKDAYS[d.getDay()]})`
}

/** 4주 막대 라벨: 마지막이 기준 주 */
export function weekLabels(iso: string, count: number) {
  return Array.from({ length: count }, (_, i) => weekLabel(iso, i - (count - 1)))
}
