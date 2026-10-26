// 플레이 화면 공용 도우미. 게임 장면 고르기·뉴런 이름처럼 화면 설계에 속한 값과 게스트 기록 저장을 모은다.
import { isApiError } from '../../api'
import type { CurvePoint, ExperimentDetail, Scene } from '../../api'

// ── 게스트 체험 ──
export const GUEST_LIMIT = 3
const GUEST_KEY = 'atp.guestTrials'

export function getGuestTrials() {
  try {
    const n = Number(localStorage.getItem(GUEST_KEY) ?? 0)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function setGuestTrials(n: number) {
  try {
    localStorage.setItem(GUEST_KEY, String(n))
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 센다
  }
}

/** "11 – 30회" → "11–30회"(큰 숫자 칸에서 띄어쓰기를 줄인다) */
export const compactRange = (option: string) => option.replace(/\s*[–-]\s*/g, '–')

// ── 보상 규칙 "+1.0 먹이에 도착" → 값 · 설명 · 색 ──
export interface RewardRule {
  value: string
  label: string
  tone: 'plus' | 'minus' | 'neutral'
  /** 이번 미션에서 새로 생긴 규칙(백엔드가 "(NEW)"로 표시) */
  isNew: boolean
}

export function parseTip(tip: string): RewardRule | null {
  const m = tip.match(/^([+\-−]\s?\d+(?:\.\d+)?)\s+(.+)$/)
  if (!m) return null
  const value = m[1].replace(/\s/g, '')
  const num = Number(value.replace('−', '-'))
  const tone = Math.abs(num) < 0.05 ? 'neutral' : num > 0 ? 'plus' : 'minus'
  const isNew = /\(NEW\)\s*$/.test(m[2])
  return { value, label: m[2].replace(/\s*\(NEW\)\s*$/, ''), tone, isNew }
}

// ── 게임 장면(먹이 · 장애물 위치, 0~100 좌표) — 미션 · 실험 응답의 scene을 쓴다. 둘 다 없을 때만 빈 장면 ──
const EMPTY_SCENE: Scene = { start: { x: 14, y: 85 }, food: { x: 82, y: 20 }, obstacles: [] }

export const sceneFor = (experiment: ExperimentDetail, missionId: string): Scene =>
  experiment.missions.find((m) => m.id === missionId)?.scene ?? experiment.scene ?? EMPTY_SCENE

// ── 뉴런 이름(브리핑의 감각 → 뉴런 매핑과 같은 이름) ──
const SENSE: Record<string, string> = {
  S1: '냄새·왼쪽',
  S2: '냄새·오른쪽',
  S3: '냄새·정면',
  S4: '시야·가까움',
  S5: '시야·멀리',
  S6: '배고픔',
}
const MOTOR: Record<string, string> = { M1: '왼쪽', M2: '오른쪽', M3: '직진', M4: '멈춤' }

export function neuronName(id: string) {
  if (SENSE[id]) return `${id} ${SENSE[id]}`
  if (MOTOR[id]) return `${id} ${MOTOR[id]}`
  if (id.startsWith('I')) return `${id} 중간 뉴런`
  return id
}

// ── 곡선 합치기(회차 기준 중복 제거) ──
export function mergeCurve(...lists: CurvePoint[][]) {
  const map = new Map<number, number>()
  for (const list of lists) for (const p of list) map.set(p.trial, p.successRate)
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([trial, successRate]) => ({ trial, successRate }))
}

// ── 한국어 조사 "로/으로" ──
export function withRo(word: string) {
  const c = word.charCodeAt(word.length - 1)
  if (c < 0xac00 || c > 0xd7a3) return `${word}로`
  const jong = (c - 0xac00) % 28
  return `${word}${jong === 0 || jong === 8 ? '로' : '으로'}`
}

export const fmtDelta = (n: number, unit = '') => `${n > 0 ? '+' : ''}${Math.round(n * 10) / 10}${unit}`

// ── 오류 분류: 연결 끊김(E-05) · 세션 만료(07:M-08) · 그 밖 ──
export type ErrorKind = 'network' | 'session' | 'other'

export function errorKind(e: unknown): ErrorKind {
  if (isApiError(e)) {
    if (e.status === 0) return 'network'
    if (e.status === 401) return 'session'
  }
  return 'other'
}
