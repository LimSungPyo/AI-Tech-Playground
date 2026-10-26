// 플레이 화면 공용 도우미. 게임 장면 배치·뉴런 이름처럼 화면 설계에 속한 고정값과 게스트 기록 저장을 모은다.
import { isApiError } from '../../api'
import type { CurvePoint, NeuronActivation, Point } from '../../api'

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

// ── 브리핑 예측(내가 고른 보기) — 미션 성공 화면에서 정답 여부를 보여 줄 때 쓴다 ──
const predictionKey = (id: string, missionId: string) => `atp.prediction.${id}.${missionId}`

export function savePrediction(id: string, missionId: string, option: string) {
  try {
    localStorage.setItem(predictionKey(id, missionId), option)
  } catch {
    // 무시
  }
}

export function loadPrediction(id: string, missionId: string) {
  try {
    return localStorage.getItem(predictionKey(id, missionId))
  } catch {
    return null
  }
}

/** "11 – 30회" → [11, 30], "61회 이상" → [61, ∞] */
export function parseRange(option: string): [number, number] | null {
  const nums = option.match(/\d+/g)?.map(Number) ?? []
  if (nums.length >= 2) return [nums[0], nums[1]]
  if (nums.length === 1) return option.includes('이상') ? [nums[0], Infinity] : [nums[0], nums[0]]
  return null
}

// ── 보상 규칙 "+1.0 먹이에 도착" → 값 · 설명 · 색 ──
export interface RewardRule {
  value: string
  label: string
  tone: 'plus' | 'minus' | 'neutral'
}

export function parseTip(tip: string): RewardRule | null {
  const m = tip.match(/^([+\-−]\s?\d+(?:\.\d+)?)\s+(.+)$/)
  if (!m) return null
  const value = m[1].replace(/\s/g, '')
  const num = Number(value.replace('−', '-'))
  const tone = Math.abs(num) < 0.05 ? 'neutral' : num > 0 ? 'plus' : 'minus'
  return { value, label: m[2], tone }
}

// ── 게임 장면(먹이 · 장애물 위치) — 0~100 좌표. 백엔드가 장면을 주지 않아 화면 설계값을 쓴다 ──
export interface Obstacle {
  x: number
  y: number
  w: number
  h: number
  label?: string
}

export interface Scene {
  start: Point
  food: Point
  obstacles: Obstacle[]
}

const FLY_SCENE: Scene = {
  start: { x: 14, y: 85 },
  food: { x: 82, y: 20 },
  obstacles: [
    { x: 21.5, y: 19, w: 15, h: 5.5 },
    { x: 38.6, y: 26, w: 3.9, h: 34.5, label: '장애물' },
  ],
}

const WORM_SCENE: Scene = { start: { x: 14, y: 85 }, food: { x: 82, y: 20 }, obstacles: [] }

export const sceneFor = (experimentId: string): Scene => (experimentId === '000' ? WORM_SCENE : FLY_SCENE)

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

/**
 * ×10 훈련의 "가장 많이 바뀐 연결 TOP 5".
 * API에 연결 변화량이 없어 마지막 회차의 감각·운동 뉴런 활성도로 근사한다(공통 변경 요청에 적음).
 */
export function connectionChanges(neurons: NeuronActivation[]) {
  const sensory = neurons.filter((n) => n.layer === 'sensory')
  const motor = neurons.filter((n) => n.layer === 'motor')
  const pairs = sensory.flatMap((s) =>
    motor.map((m) => ({
      from: s.id,
      to: m.id,
      delta: Math.round((s.activation - 0.3) * m.activation * 50) / 100,
    })),
  )
  return pairs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5)
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
