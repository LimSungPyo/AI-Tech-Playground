import { useMemo } from 'react'
import type { MascotExpression, Obstacle, Point } from '../../../api/types'
import { mascotSrc } from '../../../components'
import styles from './ReplayArena.module.css'

interface Props {
  path: Point[]
  /** 0~1 재생 진행 */
  t: number
  expression: MascotExpression
  label: string
  /** 먹이 위치(없으면 경로 끝) */
  goal?: Point
  /** 미션 장면의 장애물(v2 scene, 좌표 0~100) */
  obstacles?: Obstacle[]
}

const SIZE = 100
/** 세로 비율(0~100 좌표를 가로로 긴 판에 맞춘다) */
const H = 0.6

/** 폴리라인 위 비율 t 지점 */
function pointAt(path: Point[], t: number): Point {
  if (path.length === 0) return { x: 50, y: 50 }
  if (path.length === 1 || t <= 0) return path[0]
  const seg: number[] = []
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
    seg.push(d)
    total += d
  }
  let left = Math.min(1, t) * total
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i] || i === seg.length - 1) {
      const r = seg[i] ? Math.min(1, left / seg[i]) : 1
      return {
        x: path[i].x + (path[i + 1].x - path[i].x) * r,
        y: path[i].y + (path[i + 1].y - path[i].y) * r,
      }
    }
    left -= seg[i]
  }
  return path[path.length - 1]
}

/** 탑뷰 리플레이 한 칸: 지나온 길(점선 → 실선) + 먹이 + 드로시 */
export function ReplayArena({ path, t, expression, label, goal: goalProp, obstacles = [] }: Props) {
  const d = useMemo(() => path.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y * H}`).join(''), [path])
  const pos = pointAt(path, t)
  const start = path[0]
  const goal = goalProp ?? path[path.length - 1]
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE * H}`} className={styles.arena} role="img" aria-label={label}>
      {obstacles.map((o) => (
        <rect
          key={`${o.x}-${o.y}`}
          x={o.x}
          y={o.y * H}
          width={o.w}
          height={o.h * H}
          rx={0.8}
          className={styles.obstacle}
        />
      ))}
      <path d={d} className={styles.ghost} />
      <path d={d} className={styles.trail} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, t)} />
      {start && <circle cx={start.x} cy={start.y * H} r={1.2} className={styles.start} />}
      {goal && (
        <g transform={`translate(${goal.x} ${goal.y * H})`}>
          <circle r={3.4} className={styles.foodHalo} />
          <circle r={1.8} className={styles.food} />
        </g>
      )}
      <image href={mascotSrc(expression)} x={pos.x - 6} y={pos.y * H - 6} width={12} height={12} />
    </svg>
  )
}
