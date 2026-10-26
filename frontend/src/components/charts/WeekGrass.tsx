import { cx } from '../cx'
import styles from './charts.module.css'

export interface GrassDay {
  /** 요일 라벨(토, 일, …) */
  day: string
  minutes: number
}

export interface WeekGrassProps {
  days: GrassDay[]
  /** 오늘(강조 라벨) 인덱스. 기본 마지막 */
  todayIndex?: number
  /** 이 분 이상이면 가장 진한 칸 */
  maxMinutes?: number
  size?: number
  className?: string
}

/** 학습량 → 0~4단계 */
function grassLevel(minutes: number, maxMinutes = 40) {
  if (minutes <= 0) return 0
  return Math.min(4, Math.ceil((minutes / maxMinutes) * 4))
}

/** 이번 주 7칸 잔디(B-02 "이번 주") */
export function WeekGrass({ days, todayIndex, maxMinutes = 40, size = 32, className }: WeekGrassProps) {
  const today = todayIndex ?? days.length - 1
  return (
    <ul className={cx(styles.grass, className)} aria-label="이번 주 학습 기록">
      {days.map((d, i) => (
        <li key={`${d.day}-${i}`} className={styles.grassDay}>
          <span
            className={cx(styles.cell, styles[`lv${grassLevel(d.minutes, maxMinutes)}`])}
            style={{ width: size, height: size }}
            title={`${d.day} · ${d.minutes}분`}
          />
          <span className={cx(styles.grassLabel, i === today && styles.today)}>{d.day}</span>
          <span className="sr-only">{d.minutes}분</span>
        </li>
      ))}
    </ul>
  )
}
