import type { RefObject } from 'react'
import { getDashboard } from '../../../api'
import type { MeHome } from '../../../api/types'
import { Button, Popover, Skeleton, cx } from '../../../components'
import { useApi } from '../../../hooks/useApi'
import styles from './StreakPopover.module.css'

interface Props {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  streakDays: number
  days: MeHome['week']['days']
  onContinue: () => void
}

/** 달력에서 최고 연속 기록과 이번 달 학습일 수를 센다 */
function summarize(calendar: { date: string; minutes: number }[]) {
  let best = 0
  let run = 0
  for (const c of calendar) {
    run = c.minutes > 0 ? run + 1 : 0
    best = Math.max(best, run)
  }
  const last = calendar[calendar.length - 1]?.date.slice(0, 7)
  const month = calendar.filter((c) => c.date.startsWith(last ?? '') && c.minutes > 0).length
  return { best, month }
}

/** D-03 연속 학습 팝오버 */
export function StreakPopover({ open, onClose, anchorRef, streakDays, days, onContinue }: Props) {
  const dash = useApi(open ? (s) => getDashboard(s) : null, [open])
  const stats = dash.data ? summarize(dash.data.streak.calendar) : null
  const today = days.length - 1
  const todayDone = (days[today]?.minutes ?? 0) > 0
  // 오늘 기록 전이면 오늘 칸은 점선. 연속 기록 안의 0분 날은 "쉬는 날 보호권"(◆)
  const marks = days.map((d, i) => {
    if (i === today && !todayDone) return 'today'
    if (d.minutes > 0) return 'done'
    return i >= today - streakDays ? 'shield' : 'miss'
  })
  const shieldDay = days.find((_, i) => marks[i] === 'shield')?.day
  const nextStreak = streakDays + 1

  return (
    <Popover open={open} onClose={onClose} anchorRef={anchorRef} placement="bottom-end" width={380} dim label="연속 학습 기록">
      <div className={styles.root}>
        <p className={styles.head}>
          <span className={styles.big}>{streakDays}</span>
          <span className={styles.unit}>일 연속</span>
        </p>
        <ol className={styles.week}>
          {days.map((d, i) => (
            <li key={`${d.day}-${i}`} className={styles.day}>
              <span className={cx(styles.mark, styles[marks[i]])} aria-label={`${d.day} ${d.minutes}분`}>
                {marks[i] === 'done' ? '✓' : marks[i] === 'shield' ? '◆' : ''}
              </span>
              <span className={cx(styles.dayLabel, i === today && styles.todayLabel)}>{d.day}</span>
            </li>
          ))}
        </ol>
        <div className={styles.tip}>
          <strong>
            {todayDone ? `오늘도 학습했어요! ${streakDays}일째 이어가는 중이에요.` : `오늘 1번만 훈련하면 ${nextStreak}일 연속 배지를 받아요!`}
          </strong>
          {shieldDay && <span>◆ {shieldDay}요일은 "쉬는 날 보호권"을 써서 기록이 이어졌어요.</span>}
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>최고 기록</span>
            {stats ? <strong>{stats.best}일</strong> : <Skeleton height={22} width={48} />}
          </div>
          <div className={styles.stat}>
            <span>이번 달</span>
            {stats ? <strong>{stats.month}일</strong> : <Skeleton height={22} width={48} />}
          </div>
        </div>
        <Button
          block
          onClick={() => {
            onClose()
            onContinue()
          }}
        >
          오늘 학습하기 → 이어하기
        </Button>
      </div>
    </Popover>
  )
}
