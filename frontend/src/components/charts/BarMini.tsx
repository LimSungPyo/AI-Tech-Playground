import { cx } from '../cx'
import styles from './charts.module.css'
import { useWidth } from './useWidth'

export interface BarDatum {
  label: string
  value: number
  /** 강조(진한 인디고). 생략하면 마지막 막대 */
  highlight?: boolean
}

export interface BarMiniProps {
  data: BarDatum[]
  height?: number
  /** 겹쳐 그릴 선(관리자 전환율 등). data와 같은 길이, 0~lineMax */
  line?: number[]
  lineMax?: number
  /** 막대 위 값 표시 */
  showValues?: boolean
  formatValue?: (v: number) => string
  label?: string
  className?: string
}

/** 작은 막대 차트(최근 7일 · 미션별 성공률). 막대 + 선 겹치기 가능 */
export function BarMini({
  data,
  height = 180,
  line,
  lineMax,
  showValues,
  formatValue = (v) => String(v),
  label,
  className,
}: BarMiniProps) {
  const [ref, width] = useWidth<HTMLDivElement>(400)
  const labelH = 22
  const topPad = showValues ? 18 : 6
  const ih = height - labelH - topPad
  const max = Math.max(...data.map((d) => d.value), 1)
  const slot = width / Math.max(data.length, 1)
  const bw = Math.min(56, slot * 0.62)
  const hasHighlight = data.some((d) => d.highlight)
  const lm = lineMax ?? Math.max(...(line ?? [1]), 1)
  const cx0 = (i: number) => slot * i + slot / 2
  const linePath = line?.map((v, i) => `${i ? 'L' : 'M'}${cx0(i).toFixed(1)},${(topPad + ih - (v / lm) * ih * 0.9).toFixed(1)}`).join('')

  return (
    <div ref={ref} className={cx(styles.chart, className)}>
      <svg width={width} height={height} role="img" aria-label={label ?? '막대 차트'}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * ih)
          const strong = hasHighlight ? d.highlight : i === data.length - 1
          return (
            <g key={`${d.label}-${i}`}>
              <rect
                x={cx0(i) - bw / 2}
                y={topPad + ih - h}
                width={bw}
                height={h}
                rx={8}
                className={strong ? styles.barStrong : styles.bar}
              />
              {showValues && (
                <text x={cx0(i)} y={topPad + ih - h - 6} className={styles.barValue}>
                  {formatValue(d.value)}
                </text>
              )}
              <text x={cx0(i)} y={height - 6} className={styles.barLabel}>
                {d.label}
              </text>
            </g>
          )
        })}
        {linePath && <path d={linePath} className={styles.overlay} />}
      </svg>
    </div>
  )
}
