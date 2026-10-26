// 마이 영역 숫자 · 날짜 표시 도우미
import type { CharacterId, DayMinutes } from '../../../api'

/** 222 → "3h 42m", 48 → "48m" */
export function formatMinutes(min: number, pad = false) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  return `${h}h ${pad ? String(m).padStart(2, '0') : m}m`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** "2026-10-17" 또는 ISO 문자열 → Date(로컬 날짜) */
export function toDate(value: string) {
  return value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
}

export const weekday = (value: string) => WEEKDAYS[toDate(value).getDay()]

/** "10.17" */
export function formatMonthDay(value: string) {
  const d = toDate(value)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** "2026.10.17" */
export function formatFullDate(value: string) {
  const d = toDate(value)
  return `${d.getFullYear()}.${formatMonthDay(value)}`
}

/** "14:20" */
export function formatTime(value: string) {
  const d = toDate(value)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 오늘이면 "오늘 14:20", 일주일 안이면 "3일 전", 그 밖은 "10.08" */
export function formatRelative(value: string, now = new Date()) {
  const d = toDate(value)
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  if (days <= 0) return `오늘 ${formatTime(value)}`
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  return formatMonthDay(value)
}

/** 날짜 키("2026-10-17") */
export function dateKey(value: string) {
  return value.slice(0, 10)
}

/** 학습한 날이 이어진 가장 긴 기록 */
export function longestStreak(days: DayMinutes[]) {
  let best = 0
  let run = 0
  for (const d of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    run = d.minutes > 0 ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

export const sumMinutes = (days: DayMinutes[]) => days.reduce((s, d) => s + d.minutes, 0)

/** 캐릭터 카드 · 썸네일 배경(캐릭터 고유색 — 토큰 예외) */
export const CHARACTER_TINT: Record<CharacterId, string> = {
  wormy: '#fbe1e6',
  drosi: '#fdf0cf',
  parrot: '#d3f0dd',
  hawk: '#f4e6d6',
  owl: '#ece8f6',
  octo: '#fde4dc',
  ants: '#f6e4e0',
  memo: '#eceef2',
  mappy: '#efecee',
}

/** 오늘부터 그 날까지 남은 날 수(D-day) */
export function daysUntil(value: string, now = new Date()) {
  return Math.ceil((toDate(value).getTime() - now.getTime()) / 86_400_000)
}
