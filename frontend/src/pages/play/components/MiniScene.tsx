import type { Point } from '../../../api'
import { cx } from '../../../components'
import styles from './MiniScene.module.css'

export interface MiniSceneProps {
  /** 0~100 좌표 경로. 없으면 출발 → 먹이 곡선 */
  path?: Point[]
  /** 경로를 어디까지 그릴지(0~1). 실패한 회차는 중간에서 멈춘다 */
  reach?: number
  tone?: 'success' | 'fail' | 'muted'
  obstacle?: boolean
  waiting?: boolean
  className?: string
}

const START = { x: 16, y: 72 }
const FOOD = { x: 86, y: 22 }
const CURVE: Point[] = Array.from({ length: 12 }, (_, i) => {
  const t = i / 11
  return { x: START.x + (FOOD.x - START.x) * t, y: START.y + (FOOD.y - START.y) * (3 * t * t - 2 * t * t * t) }
})

/** 작은 장면 썸네일(미니 리플레이 · 미션 카드) */
export function MiniScene({ path, reach = 1, tone = 'success', obstacle, waiting, className }: MiniSceneProps) {
  const base = path?.length ? path : CURVE
  const n = Math.max(2, Math.round(base.length * reach))
  const pts = base.slice(0, n)
  const end = pts[pts.length - 1]
  return (
    <div className={cx(styles.scene, className)} aria-hidden>
      {waiting ? (
        <span className={styles.waiting}>WAITING</span>
      ) : (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.svg}>
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            className={cx(styles.path, styles[tone])}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {!waiting && obstacle && <span className={styles.obstacle} />}
      <span className={styles.food} style={{ left: `${FOOD.x}%`, top: `${FOOD.y}%` }} />
      {!waiting && <span className={styles.agent} style={{ left: `${end.x}%`, top: `${end.y}%` }} />}
    </div>
  )
}
