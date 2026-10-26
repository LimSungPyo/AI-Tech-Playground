import { useState } from 'react'
import { useNavigate } from 'react-router'
import { getDashboard, getHistory, type DayMinutes, type MeHistory } from '../../api'
import {
  BarMini,
  Badge,
  CHARACTERS,
  Button,
  Character,
  Chip,
  EmptyState,
  GlassCard,
  Icon,
  Mascot,
  SegmentedControl,
  Skeleton,
  type BadgeTone,
  useToast,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import {
  dateKey,
  formatFullDate,
  formatMinutes,
  formatMonthDay,
  formatTime,
  sumMinutes,
  weekday,
} from './components/format'
import { Grass, GrassLegend } from './components/Grass'
import { PageTitle } from './components/PageTitle'
import my from './components/my.module.css'
import styles from './MyHistoryPage.module.css'

type Period = 'week' | 'month' | 'all'
type Kind = 'train' | 'why' | 'achieve'
type LogFilter = 'all' | Kind

const KIND: Record<Kind, { label: string; tone: BadgeTone }> = {
  train: { label: '훈련', tone: 'indigo' },
  why: { label: 'WHY?', tone: 'why' },
  achieve: { label: '달성', tone: 'success' },
}

/** 로그 문장으로 종류를 나눈다(API에 kind가 없어서) */
function kindOf(text: string): Kind {
  if (/WHY\?|근거/.test(text)) return 'why'
  if (/달성|첫 성공|배지|마스터/.test(text)) return 'achieve'
  return 'train'
}

/** 실험 id → 캐릭터 */
const characterOf = (experimentId: string) =>
  Object.values(CHARACTERS).find((c) => c.experiment === `#${experimentId}`)?.id ?? 'drosi'

// W2 my 담당 · 경로 /my/history · C-06 학습 기록
export default function MyHistoryPage() {
  const history = useApi((s) => getHistory(s), [])
  const dash = useApi((s) => getDashboard(s), [])
  const toast = useToast()
  const [period, setPeriod] = useState<Period>('week')
  const [filter, setFilter] = useState<LogFilter>('all')

  if (history.error) {
    return (
      <EmptyState
        expression="confused"
        title="학습 기록을 불러오지 못했어요"
        description={history.error.message}
        action={<Button onClick={history.reload}>다시 시도</Button>}
      />
    )
  }

  const h = history.data
  const calendar = dash.data?.streak.calendar ?? []
  const week = h?.days ?? []
  // 기간별 날짜 범위: 이번 주 = /me/history, 이번 달 = 최근 5주, 전체 = 대시보드 잔디 전체
  const days = period === 'week' ? week : period === 'month' ? calendar.slice(-35) : calendar
  const range = days.length > 0 ? `${formatFullDate(days[0].date)} – ${formatMonthDay(days[days.length - 1].date)}` : ''
  const periodLabel = period === 'week' ? '이번 주' : period === 'month' ? '이번 달' : '전체'

  const exportCsv = () => {
    if (!h) return
    const rows = [
      ['date', 'minutes'],
      ...days.map((d) => [d.date, String(d.minutes)]),
      [],
      ['datetime', 'experiment', 'kind', 'text'],
      ...h.logs.map((l) => [l.date, `#${l.experimentId}`, KIND[kindOf(l.text)].label, l.text]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `learning-history-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.show({ title: 'CSV 파일을 내려받았어요', tone: 'success' })
  }

  return (
    <div className={my.page}>
      <PageTitle
        title="학습 기록"
        sub={range ? `${range} · ${periodLabel}` : ' '}
        right={
          <>
            <SegmentedControl<Period>
              label="기간"
              value={period}
              onChange={setPeriod}
              items={[
                { value: 'week', label: '이번 주' },
                { value: 'month', label: '이번 달' },
                { value: 'all', label: '전체' },
              ]}
            />
            <Button variant="secondary" onClick={exportCsv} disabled={!h} iconLeft={<Icon name="download" size={16} />}>
              CSV 내보내기
            </Button>
          </>
        }
      />

      {!h ? (
        <>
          <div className={styles.stats}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={110} />
            ))}
          </div>
          <Skeleton height={300} />
          <Skeleton height={400} />
        </>
      ) : (
        <>
          <Stats days={days} logs={h.logs} calendar={calendar} period={period} />

          <div className={styles.row}>
            <GlassCard radius="lg" className={styles.chart}>
              <div className={my.cardHead}>
                <h2 className={my.cardTitle}>{period === 'week' ? '요일별 학습 시간' : `${periodLabel} 학습 잔디`}</h2>
                {period === 'week' ? (
                  <span className={styles.legend}>
                    <span className={styles.legendBar} aria-hidden /> 학습 시간
                  </span>
                ) : (
                  <GrassLegend />
                )}
              </div>
              {period === 'week' ? (
                <BarMini
                  height={240}
                  label="요일별 학습 시간"
                  data={week.map((d) => ({ label: `${weekday(d.date)} ${formatMinutes(d.minutes)}`, value: d.minutes }))}
                />
              ) : (
                <Grass days={days} size={period === 'month' ? 28 : 18} monthLabels />
              )}
            </GlassCard>

            <WeeklySummary week={week} logs={h.logs} />
          </div>

          <GlassCard radius="lg">
            <div className={my.cardHead}>
              <h2 className={my.cardTitle}>활동 타임라인</h2>
              <div className={styles.filters}>
                {(['all', 'train', 'why', 'achieve'] as const).map((f) => (
                  <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
                    {f === 'all' ? '전체' : KIND[f].label}
                  </Chip>
                ))}
              </div>
            </div>
            <Timeline logs={h.logs} filter={filter} />
          </GlassCard>
        </>
      )}
    </div>
  )
}

function Stats({
  days,
  logs,
  calendar,
  period,
}: {
  days: DayMinutes[]
  logs: MeHistory['logs']
  calendar: DayMinutes[]
  period: Period
}) {
  const total = sumMinutes(days)
  const keys = new Set(days.map((d) => d.date))
  const inRange = logs.filter((l) => keys.has(dateKey(l.date)))
  const whyLogs = inRange.filter((l) => kindOf(l.text) === 'why')
  const active = days.filter((d) => d.minutes > 0)
  const best = active.reduce<DayMinutes | undefined>((b, d) => (!b || d.minutes > b.minutes ? d : b), undefined)

  // 지난주 대비: 잔디 캘린더에서 이번 주 바로 앞 7일
  let compare = ''
  if (period === 'week' && days.length > 0) {
    const firstIdx = calendar.findIndex((d) => d.date === days[0].date)
    if (firstIdx >= 7) {
      const diff = total - sumMinutes(calendar.slice(firstIdx - 7, firstIdx))
      compare = `지난주 대비 ${diff >= 0 ? '+' : '−'}${formatMinutes(Math.abs(diff))}`
    }
  }

  return (
    <div className={styles.stats}>
      <StatCard label="학습 시간" value={formatMinutes(total, true)} caption={compare || `하루 평균 ${formatMinutes(total / Math.max(days.length, 1))}`} />
      <StatCard label="학습한 날" value={`${active.length}일`} caption={`${days.length}일 중`} />
      <StatCard label="기록된 활동" value={`${inRange.length}건`} caption={`WHY? 확인 ${whyLogs.length}건 포함`} />
      <StatCard
        label="가장 많이 한 날"
        value={best ? formatMinutes(best.minutes) : '—'}
        caption={best ? `${formatMonthDay(best.date)} ${weekday(best.date)}요일` : '아직 기록이 없어요'}
      />
    </div>
  )
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <GlassCard padding="md" className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      <span className={styles.statCaption}>{caption}</span>
    </GlassCard>
  )
}

/** 이번 주 기록으로 만든 요약 카드(AI 주간 요약 자리) */
function WeeklySummary({ week, logs }: { week: DayMinutes[]; logs: MeHistory['logs'] }) {
  const total = sumMinutes(week)
  const best = week.reduce<DayMinutes | undefined>((b, d) => (!b || d.minutes > b.minutes ? d : b), undefined)
  const whyCount = logs.filter((l) => kindOf(l.text) === 'why').length
  const latest = logs[0]
  return (
    <GlassCard radius="lg" className={styles.summary}>
      <div className={styles.summaryHead}>
        <Mascot expression="scientist" size={52} />
        <div>
          <h2 className={styles.summaryTitle}>AI 해설 · 주간 요약</h2>
          <p className={my.caption}>매주 월요일 자동 생성</p>
        </div>
      </div>
      {total === 0 ? (
        <p className={styles.summaryText}>이번 주에는 아직 학습 기록이 없어요. 짧게라도 한 번 훈련해 볼까요?</p>
      ) : (
        <p className={styles.summaryText}>
          이번 주에는 {formatMinutes(total)} 동안 학습했어요.
          {best && ` 가장 많이 한 날은 ${weekday(best.date)}요일(${formatMinutes(best.minutes)})이었고,`}
          {whyCount > 0 ? ` WHY?로 선택 근거를 ${whyCount}번 확인했어요.` : ' 다음엔 WHY?로 선택 근거도 들여다봐요.'}
        </p>
      )}
      {latest && (
        <div className={styles.next}>
          <p className={styles.nextLabel}>다음 주 제안</p>
          <p>#{latest.experimentId} 실험을 이어서 해 보세요. 마지막 기록: {latest.text}</p>
        </div>
      )}
    </GlassCard>
  )
}

function Timeline({ logs, filter }: { logs: MeHistory['logs']; filter: LogFilter }) {
  const navigate = useNavigate()
  const items = logs.filter((l) => filter === 'all' || kindOf(l.text) === filter)
  if (items.length === 0) {
    return <EmptyState compact expression="sleep" title="이 조건의 활동이 없어요" />
  }
  // 날짜별로 묶기(최신 순)
  const groups = new Map<string, typeof items>()
  for (const l of [...items].sort((a, b) => b.date.localeCompare(a.date))) {
    const k = dateKey(l.date)
    groups.set(k, [...(groups.get(k) ?? []), l])
  }
  return (
    <div className={styles.timeline}>
      {[...groups].map(([day, list]) => (
        <section key={day}>
          <h3 className={styles.day}>
            {formatMonthDay(day)} {weekday(day)}
          </h3>
          <ul className={styles.logs}>
            {list.map((l) => {
              const kind = KIND[kindOf(l.text)]
              return (
                <li key={`${l.date}-${l.text}`}>
                  <button type="button" className={styles.log} onClick={() => navigate(`/experiments/${l.experimentId}/report`)}>
                    <span className={styles.time}>{formatTime(l.date)}</span>
                    <Badge tone={kind.tone} className={styles.kind}>
                      {kind.label}
                    </Badge>
                    <Character id={characterOf(l.experimentId)} size={32} />
                    <span className={styles.text}>{l.text}</span>
                    <Icon name="chevron-right" size={16} className={styles.chev} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
