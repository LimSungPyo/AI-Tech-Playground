import type { DayMinutes } from '../../../api'
import { cx } from '../../../components'
import { formatMonthDay, toDate } from './format'
import styles from './Grass.module.css'

/** 학습량 → 0~4단계(WeekGrass와 같은 기준) */
function grassLevel(minutes: number, maxMinutes = 40) {
  if (minutes <= 0) return 0
  return Math.min(4, Math.ceil((minutes / maxMinutes) * 4))
}

interface GrassProps {
  days: DayMinutes[]
  /** 칸 크기(px) */
  size?: number
  /** 위에 월 라벨 */
  monthLabels?: boolean
  className?: string
}

/** 주 단위 열(일→토)로 쌓는 잔디 캘린더(C-02 학습 잔디 · C-06 월간/연간) */
export function Grass({ days, size = 20, monthLabels, className }: GrassProps) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  // 첫 날의 요일만큼 앞을 비워 열 = 한 주가 되게 한다
  const lead = sorted.length > 0 ? toDate(sorted[0].date).getDay() : 0
  const cells: (DayMinutes | null)[] = [...Array<null>(lead).fill(null), ...sorted]
  const weeks: (DayMinutes | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className={cx(styles.wrap, className)} style={{ ['--cell' as string]: `${size}px` }}>
      {monthLabels && (
        <div className={styles.months} aria-hidden>
          {weeks.map((w, i) => {
            const first = w.find((d) => d && toDate(d.date).getDate() <= 7)
            return (
              <span key={i} className={styles.month}>
                {first ? `${toDate(first.date).getMonth() + 1}월` : ''}
              </span>
            )
          })}
        </div>
      )}
      <div className={styles.grid} role="img" aria-label={`학습 잔디 ${sorted.length}일`}>
        {weeks.map((w, i) => (
          <div key={i} className={styles.week}>
            {Array.from({ length: 7 }, (_, j) => {
              const d = w[j]
              if (!d) return <span key={j} className={styles.empty} />
              return (
                <span
                  key={j}
                  className={cx(styles.cell, styles[`lv${grassLevel(d.minutes)}`])}
                  title={`${formatMonthDay(d.date)} · ${d.minutes}분`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/** 적음 ▢▢▢▢ 많음 */
export function GrassLegend() {
  return (
    <span className={styles.legend}>
      적음
      {[0, 1, 2, 4].map((lv) => (
        <span key={lv} className={cx(styles.legendCell, styles[`lv${lv}`])} aria-hidden />
      ))}
      많음
    </span>
  )
}
