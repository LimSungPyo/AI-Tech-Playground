// 홈 · 레이더 화면에서 함께 쓰는 표시용 변환 함수
import type { ExperimentSummary, Level, RadarKeyword, SocialProvider, Source } from '../../api/types'

export const LEVEL_LABEL: Record<Level, string> = {
  intro: '입문',
  basic: '기초',
  advanced: '심화',
  frontier: '최전선',
}

/** 마지막 로그인 방법(07:M-01 "지난번엔 Google로 로그인했어요") */
export const PROVIDER_LABEL: Record<SocialProvider | 'email', string> = {
  google: 'Google',
  kakao: '카카오',
  github: 'GitHub',
  email: '이메일',
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 2026.10.17 금요일 */
export function formatToday(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${WEEKDAYS[d.getDay()]}요일`
}

/** 126 → 2h 06m */
export function formatMinutes(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

/** 마지막 플레이 시각: 오늘 14:20 · 어제 14:20 · 10.12 14:20 */
export function formatLastPlayed(iso: string, now = new Date()) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(now) - day(d)) / 86_400_000)
  if (diff === 0) return `오늘 ${hm}`
  if (diff === 1) return `어제 ${hm}`
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')} ${hm}`
}

/** 상대 날짜 표기(어제 · 오늘 · n일 전) */
export function relativeDay(iso: string, now = new Date()) {
  const d = new Date(iso)
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(now) - day(d)) / 86_400_000)
  if (diff <= 0) return '오늘'
  if (diff === 1) return '어제'
  return `${diff}일 전`
}

/** 남은 일수(올림). 지났으면 0 */
export function daysUntil(iso: string, now = new Date()) {
  const ms = new Date(iso).getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

/** +6 → +6%p, -4 → -4%p */
export const signedPct = (n: number, unit = '%') => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n))}${unit}`

/** ▲ 42% · ▼ 4% */
export const arrowPct = (n: number) => `${n >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(n))}%`

/** 연속 상승 주 수(마지막 주부터 거꾸로) */
export function risingWeeks(weeks: number[]) {
  let n = 0
  for (let i = weeks.length - 1; i > 0; i--) {
    if (weeks[i] > weeks[i - 1]) n++
    else break
  }
  return n
}

export type SourceKind = '논문' | '코드' | '커뮤니티' | '뉴스'

const KIND_LABEL: Record<NonNullable<Source['kind']>, SourceKind> = {
  paper: '논문',
  code: '코드',
  community: '커뮤니티',
  news: '뉴스',
}

/** 출처 종류 → CSS 클래스 이름(레이더 표 · 드로어) */
export const KIND_CLASS = { 논문: 'paper', 코드: 'code', 커뮤니티: 'community', 뉴스: 'news' } as const

/** 출처 종류. API의 kind를 쓰고, 없으면 URL로 고른다 */
export function sourceKind(source: Source): SourceKind {
  if (source.kind) return KIND_LABEL[source.kind]
  const { url } = source
  if (/github\.com|huggingface\.co|gitlab/.test(url)) return '코드'
  if (/ycombinator|reddit|twitter|x\.com|discord|forum/.test(url)) return '커뮤니티'
  return '논문'
}

/** 키워드의 출처 종류 목록(중복 제거, 논문 · 코드 · 커뮤니티 · 뉴스 순) */
export function sourceKinds(kw: RadarKeyword): SourceKind[] {
  const set = new Set(kw.sources.map(sourceKind))
  return (['논문', '코드', '커뮤니티', '뉴스'] as const).filter((k) => set.has(k))
}

/** 실험 상태 짧은 설명(레이더 "우리 실험" 열) */
export function experimentStatusLabel(exp: ExperimentSummary) {
  switch (exp.status) {
    case 'coming_soon':
      return '오픈 예정'
    case 'in_progress':
      return '진행 중'
    case 'open':
      return '열림'
    default:
      return ''
  }
}

/** "추천 점수 0.92 · 성공률 60% 돌파 · 해금 직후" → { score: 0.92, signals: [...] } */
export function parseReason(reason: string) {
  const parts = reason
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
  let score: number | undefined
  const signals: string[] = []
  for (const p of parts) {
    const m = /추천 점수\s*([\d.]+)/.exec(p)
    if (m) score = Number(m[1])
    else signals.push(p)
  }
  return { score, signals }
}

/** 이메일 가리기: hyewon@playground.ai → hy***@playground.ai */
export function maskEmail(email: string) {
  const [id, domain] = email.split('@')
  if (!domain) return email
  return `${id.slice(0, 2)}***@${domain}`
}

/** 세션 · 로컬 저장소 접근(사설 모드에서 throw 할 수 있어 감싼다) */
export function readStore(kind: 'local' | 'session', key: string): string | null {
  try {
    return (kind === 'local' ? window.localStorage : window.sessionStorage).getItem(key)
  } catch {
    return null
  }
}
export function writeStore(kind: 'local' | 'session', key: string, value: string | null) {
  try {
    const s = kind === 'local' ? window.localStorage : window.sessionStorage
    if (value === null) s.removeItem(key)
    else s.setItem(key, value)
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 기억한다
  }
}

/** prefers-reduced-motion */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
