import type { ReactNode } from 'react'
import { Character, Mascot, cx } from '../../../components'
import type { Point, Scene } from '../../../api'
import styles from './GameCanvas.module.css'

export interface GameCanvasProps {
  scene: Scene
  /** 이번 회차 경로(보라) */
  path?: Point[]
  /** 1회차 경로(회색) */
  firstPath?: Point[]
  /** 0 ~ path.length − 1 */
  progress: number
  /** grid = #001 2D 탑뷰, petri = #000 페트리 접시 */
  variant?: 'grid' | 'petri'
  label: string
  legend: string
  /** 게임 위에 얹는 것(WHY 카드, 배너, 연결 끊김 등) */
  children?: ReactNode
  dimmed?: boolean
}

// 페트리 접시는 원 안에 들어오도록 좌표를 가운데로 모은다
const toDish = (p: Point): Point => ({ x: 50 + (p.x - 50) * 0.82, y: 50 + (p.y - 50) * 0.82 })

function interpolate(path: Point[], progress: number): Point | undefined {
  if (!path.length) return undefined
  const i = Math.min(path.length - 1, Math.floor(progress))
  const t = progress - i
  const a = path[i]
  const b = path[Math.min(path.length - 1, i + 1)]
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

const points = (pts: Point[]) => pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

export function GameCanvas({
  scene,
  path = [],
  firstPath = [],
  progress,
  variant = 'grid',
  label,
  legend,
  children,
  dimmed,
}: GameCanvasProps) {
  const petri = variant === 'petri'
  const map = petri ? toDish : (p: Point) => p
  const cur = path.map(map)
  const first = firstPath.map(map)
  const head = interpolate(cur, progress)
  const visited = head ? [...cur.slice(0, Math.floor(progress) + 1), head] : []
  const agent = head ?? map(scene.start)
  const food = map(scene.food)
  // 진행 방향으로 살짝 기울인다
  const prev = cur[Math.max(0, Math.floor(progress) - 1)]
  const tilt = head && prev ? Math.max(-18, Math.min(18, (head.x - prev.x) * 3)) : 0

  const field = (
    <div className={cx(styles.field, petri && styles.dish)} role="img" aria-label={`${label} — ${legend}`}>
      {petri && (
        <span className={styles.scent} style={{ left: `${food.x}%`, top: `${food.y}%` }} aria-hidden />
      )}
      {scene.obstacles.map((o, i) => (
        <span
          key={i}
          className={styles.obstacle}
          style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%` }}
        >
          {o.label && <span className={styles.obstacleLabel}>{o.label}</span>}
        </span>
      ))}
      <svg className={styles.paths} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {first.length > 1 && <polyline className={styles.first} points={points(first)} vectorEffect="non-scaling-stroke" />}
        {visited.length > 1 && <polyline className={styles.current} points={points(visited)} vectorEffect="non-scaling-stroke" />}
      </svg>
      <span className={cx(styles.food, petri && styles.foodPetri)} style={{ left: `${food.x}%`, top: `${food.y}%` }}>
        <span className={styles.foodLabel}>먹이</span>
      </span>
      <span
        className={styles.agent}
        style={{ left: `${agent.x}%`, top: `${agent.y}%`, transform: `translate(-50%, -50%) rotate(${tilt}deg)` }}
      >
        {petri ? <Character id="wormy" size={64} alt="웜이" /> : <Mascot expression="default" size={72} alt="드로시" />}
      </span>
    </div>
  )

  return (
    <div className={cx(styles.canvas, petri ? styles.petri : styles.grid, dimmed && styles.dimmed)}>
      <span className={styles.label}>{label}</span>
      {petri ? <div className={styles.dishWrap}>{field}</div> : field}
      <span className={styles.legend}>{legend}</span>
      {children}
    </div>
  )
}
