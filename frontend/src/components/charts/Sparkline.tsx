import { cx } from '../cx'
import styles from './charts.module.css'

export interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  /** 기본: 마지막 값이 처음보다 크면 success, 작으면 danger */
  tone?: 'indigo' | 'success' | 'danger'
  className?: string
  label?: string
}

/** 칩 · 표 안 작은 추이선(기술 레이더 주간 변화) */
export function Sparkline({ values, width = 64, height = 20, tone, className, label }: SparklineProps) {
  if (values.length < 2) return <svg width={width} height={height} className={className} aria-hidden />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const sx = (i: number) => 1 + (i / (values.length - 1)) * (width - 2)
  const sy = (v: number) => height - 2 - ((v - min) / (max - min || 1)) * (height - 4)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join('')
  const t = tone ?? (values[values.length - 1] >= values[0] ? 'success' : 'danger')
  return (
    <svg
      width={width}
      height={height}
      className={cx(styles.spark, styles[`spark-${t}`], className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={d} />
      <circle cx={sx(values.length - 1)} cy={sy(values[values.length - 1])} r={2} />
    </svg>
  )
}
