import { useId } from 'react'
import { cx } from '../cx'
import styles from './charts.module.css'
import { useWidth } from './useWidth'

export interface ChartPoint {
  x: number
  y: number
}

export interface LineChartProps {
  /** 주 곡선(인디고, 영역 채움) */
  data: ChartPoint[]
  /** 비교 곡선(회색 점선) */
  compare?: ChartPoint[]
  /** 이벤트 마커(세로 점선 + 라벨) */
  events?: { x: number; label: string }[]
  height?: number
  /** 기본: 데이터 범위 */
  xDomain?: [number, number]
  /** 기본 [0, 100] */
  yDomain?: [number, number]
  /** 가로 눈금 값 */
  yTicks?: number[]
  xTicks?: number[]
  formatX?: (x: number) => string
  formatY?: (y: number) => string
  /** 마지막 점 강조 */
  showLastDot?: boolean
  /** 축 · 눈금 숨김(카드 안 미니 곡선) */
  bare?: boolean
  /** 스크린리더용 요약 */
  label?: string
  className?: string
}

const PAD = { top: 16, right: 16, bottom: 28, left: 40 }
const BARE = { top: 6, right: 4, bottom: 4, left: 4 }

/** 성장 곡선(Trial → 성공률). 영역 채움 + 이벤트 마커 */
export function LineChart({
  data,
  compare,
  events = [],
  height = 220,
  xDomain,
  yDomain = [0, 100],
  yTicks = [0, 50, 100],
  xTicks,
  formatX = (x) => String(x),
  formatY = (y) => `${y}%`,
  showLastDot = true,
  bare,
  label,
  className,
}: LineChartProps) {
  const gid = useId()
  const [ref, width] = useWidth<HTMLDivElement>()
  const pad = bare ? BARE : PAD
  const all = [...data, ...(compare ?? [])]
  const x0 = xDomain?.[0] ?? Math.min(...all.map((p) => p.x), 0)
  const x1 = xDomain?.[1] ?? Math.max(...all.map((p) => p.x), 1)
  const [y0, y1] = yDomain
  const iw = Math.max(1, width - pad.left - pad.right)
  const ih = Math.max(1, height - pad.top - pad.bottom)
  const sx = (x: number) => pad.left + ((x - x0) / (x1 - x0 || 1)) * iw
  const sy = (y: number) => pad.top + ih - ((y - y0) / (y1 - y0 || 1)) * ih
  const line = (pts: ChartPoint[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('')
  const area = data.length
    ? `${line(data)}L${sx(data[data.length - 1].x).toFixed(1)},${sy(y0)}L${sx(data[0].x).toFixed(1)},${sy(y0)}Z`
    : ''
  const last = data[data.length - 1]
  const ticksX = xTicks ?? (data.length ? [x0, x1] : [])

  return (
    <div ref={ref} className={cx(styles.chart, className)}>
      <svg width={width} height={height} role="img" aria-label={label ?? '성장 곡선'}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-indigo)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--color-accent-indigo)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {!bare &&
          yTicks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={sy(t)} y2={sy(t)} className={styles.grid} />
              <text x={pad.left - 8} y={sy(t)} className={styles.tickY}>
                {formatY(t)}
              </text>
            </g>
          ))}
        {!bare &&
          ticksX.map((t) => (
            <text key={t} x={sx(t)} y={height - 8} className={styles.tickX}>
              {formatX(t)}
            </text>
          ))}
        {events.map((ev) => (
          <g key={`${ev.x}-${ev.label}`}>
            <line x1={sx(ev.x)} x2={sx(ev.x)} y1={pad.top} y2={pad.top + ih} className={styles.event} />
            <text x={sx(ev.x) + 4} y={pad.top + 10} className={styles.eventLabel}>
              {ev.label}
            </text>
          </g>
        ))}
        {data.length > 0 && <path d={area} fill={`url(#${gid})`} />}
        {compare && compare.length > 0 && <path d={line(compare)} className={styles.compare} />}
        {data.length > 0 && <path d={line(data)} className={styles.line} />}
        {showLastDot && last && <circle cx={sx(last.x)} cy={sy(last.y)} r={5} className={styles.dot} />}
      </svg>
    </div>
  )
}
