import { useState } from 'react'
import { getAdminAnalytics } from '../../api'
import type { AdminAnalytics } from '../../api/types'
import { Button, CHARACTERS, EmptyState, Icon, LineChart, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import { FilterPills, LoadError, PageHead, Panel, PanelSkeleton } from './components/AdminUi'
import a from './components/admin.module.css'
import { characterOf, num } from './components/format'
import styles from './AdminAnalyticsPage.module.css'

type Tab = 'funnel' | 'experiments' | 'cohort' | 'why'

/** 단계별 전환율(앞 단계 대비 %) */
function withRates(funnel: AdminAnalytics['funnel']) {
  return funnel.map((f, i) => ({ ...f, rate: i === 0 ? null : Math.round((f.count / Math.max(funnel[i - 1].count, 1)) * 100) }))
}

function Funnel({ funnel }: { funnel: AdminAnalytics['funnel'] }) {
  const rows = withRates(funnel)
  const max = Math.max(...rows.map((r) => r.count), 1)
  const worst = rows.reduce<(typeof rows)[number] | null>((w, r) => (r.rate !== null && (w === null || r.rate < (w.rate ?? 101)) ? r : w), null)
  const worstIdx = worst ? rows.indexOf(worst) : -1
  return (
    <Panel title="가입 → 마스터 퍼널" right={worst && <span className={a.panelLink}>가장 큰 이탈: {worst.step}</span>}>
      <ul className={styles.funnel}>
        {rows.map((r, i) => (
          <li key={r.step}>
            <span className={styles.step}>{r.step}</span>
            <span className={styles.track}>
              <span className={cx(styles.fill, i === worstIdx && styles.fillWorst)} style={{ width: `${(r.count / max) * 100}%` }} />
            </span>
            <span className={styles.count}>{num(r.count)}</span>
            <span className={cx(styles.rate, r.rate !== null && r.rate < 50 && styles.rateLow)}>{r.rate === null ? '' : `${r.rate}%`}</span>
          </li>
        ))}
      </ul>
      {worst && worstIdx > 0 && (
        <p className={a.note}>
          <span className={a.noteTitle}>AI 인사이트</span>
          {rows[worstIdx - 1].step} → {worst.step} 전환이 {worst.rate}%로 가장 낮아요. 이 구간의 안내 · 저장 유도 시점을 A/B 테스트해 보는 걸
          추천해요.
        </p>
      )}
    </Panel>
  )
}

function Retention({ retention, height = 200 }: { retention: AdminAnalytics['retention']; height?: number }) {
  return (
    <Panel title="주차별 리텐션">
      <LineChart
        height={height}
        data={retention.map((r, i) => ({ x: i + 1, y: r.rate }))}
        xTicks={retention.map((_, i) => i + 1)}
        formatX={(x) => retention[x - 1]?.week ?? ''}
      />
      <p className={a.muted}>가입 주(W1)를 100%로 놓고, 이후 주마다 다시 실험한 사용자 비율이에요.</p>
    </Panel>
  )
}

function Experiments({ experiments }: { experiments: AdminAnalytics['experiments'] }) {
  return (
    <Panel title="실험별 요약">
      <div className={a.tableWrap}>
        <table className={a.table}>
          <thead>
            <tr>
              <th>실험</th>
              <th>플레이</th>
              <th>완료율</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((e) => {
              const c = characterOf(e.code)
              return (
                <tr key={e.code}>
                  <td className={a.strong}>
                    {e.code} {c ? CHARACTERS[c].name : ''}
                  </td>
                  <td className={a.num}>{num(e.plays)}</td>
                  <td className={a.num}>{e.clearRate}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/** 퍼널 · 실험별 · 리텐션을 CSV 파일로 내려받는다 */
function downloadCsv(d: AdminAnalytics) {
  const lines = [
    '구분,항목,값',
    ...d.funnel.map((f) => `퍼널,${f.step},${f.count}`),
    ...d.retention.map((r) => `리텐션,${r.week},${r.rate}`),
    ...d.experiments.map((e) => `실험 플레이,${e.code},${e.plays}`),
    ...d.experiments.map((e) => `실험 완료율,${e.code},${e.clearRate}`),
  ]
  const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// W2 admin 담당 · 경로 /admin/analytics — F-11 데이터 분석
export default function AdminAnalyticsPage() {
  const { data, error, reload } = useApi((signal) => getAdminAnalytics(signal), [])
  const [tab, setTab] = useState<Tab>('funnel')

  return (
    <>
      <PageHead title="데이터 분석 · 최근 30일" />
      <div className={styles.toolbar}>
        <FilterPills<Tab>
          label="분석 보기"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'funnel', label: '퍼널' },
            { value: 'experiments', label: '실험별' },
            { value: 'cohort', label: '코호트' },
            { value: 'why', label: 'WHY? 효과' },
          ]}
        />
        <Button variant="secondary" size="sm" pill={false} iconLeft={<Icon name="download" size={14} />} disabled={!data} onClick={() => data && downloadCsv(data)}>
          CSV
        </Button>
      </div>

      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data ? (
        <div className={a.grid2}>
          <PanelSkeleton height={360} />
          <PanelSkeleton height={240} />
        </div>
      ) : tab === 'funnel' ? (
        <div className={a.grid2}>
          <Funnel funnel={data.funnel} />
          <div className={a.stack}>
            <Retention retention={data.retention} />
            <Experiments experiments={data.experiments} />
          </div>
        </div>
      ) : tab === 'experiments' ? (
        <Experiments experiments={data.experiments} />
      ) : tab === 'cohort' ? (
        <Retention retention={data.retention} height={320} />
      ) : (
        <Panel>
          <EmptyState
            expression="why"
            title="WHY? 효과 분석은 준비 중이에요"
            description="WHY? 열람 횟수와 성공률 향상의 상관을 보려면 사용자별 열람 기록 집계가 필요해요."
            compact
          />
        </Panel>
      )}
    </>
  )
}
