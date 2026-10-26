import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { getExperiment, getReport } from '../../api'
import type { ExperimentDetail, Point, Report, ReportSnapshot, TrialMetric } from '../../api/types'
import {
  Button,
  CHARACTERS,
  EmptyState,
  GlassCard,
  Icon,
  LineChart,
  Mascot,
  SegmentedControl,
  Skeleton,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { ReplayArena } from './components/ReplayArena'
import { ShareModal } from './components/ShareModal'
import { useReplay } from './components/useReplay'
import styles from './ReportPage.module.css'

type Metric = 'rate' | 'time' | 'collisions'

/** 차트 탭별 제목 · 값 · 축 */
const METRIC: Record<
  Metric,
  { tab: string; title: string; pick: (m: TrialMetric) => number; format: (y: number) => string; unit: string }
> = {
  rate: { tab: '성공률', title: '회차별 성공률', pick: (m) => m.successRate, format: (y) => `${y}%`, unit: '%' },
  time: { tab: '도달 시간', title: '회차별 평균 도달 시간', pick: (m) => m.timeSec, format: (y) => `${y}s`, unit: 's' },
  collisions: { tab: '충돌 수', title: '회차별 평균 충돌 수', pick: (m) => m.collisions, format: (y) => String(y), unit: '회' },
}

/** 0부터 최댓값을 덮는 깔끔한 눈금 4칸 */
function niceTicks(max: number) {
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw || 1))
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((k) => k >= raw) ?? raw
  return [0, 1, 2, 3, 4].map((i) => Math.round(i * step * 100) / 100)
}

/** "미션 1 · 먹이 찾기" → "먹이 찾기" */
const missionName = (title: string) => title.replace(/^미션\s*\d+\s*·\s*/, '')

/** 1회차 리플레이 길이(ms). 100회차는 평균 도달 시간 비율만큼 짧아진다 */
const BASE_REPLAY_MS = 6000

// W2 growth 담당 · 경로 /experiments/:id/report · B-08 성장 리포트 (60:10077)
export default function ReportPage() {
  const { id = '' } = useParams()
  const report = useApi((signal) => getReport(id, signal), [id])
  const exp = useApi((signal) => getExperiment(id, signal), [id])

  if (report.loading || exp.loading) {
    return (
      <div className={styles.page}>
        <Skeleton height={160} />
        <div className={styles.chartRow}>
          <Skeleton height={420} />
          <Skeleton height={420} />
        </div>
        <Skeleton height={360} />
      </div>
    )
  }
  if (!report.data || !exp.data) {
    const err = report.error ?? exp.error
    return (
      <EmptyState
        expression="confused"
        title="성장 리포트를 불러오지 못했어요"
        description={err?.message}
        action={<Button onClick={() => (report.error ? report.reload() : exp.reload())}>다시 시도</Button>}
      />
    )
  }
  return <ReportView report={report.data} exp={exp.data} />
}

const change = (a: number, b: number) => (a ? Math.round(((b - a) / a) * 100) : 0)

function ReportView({ report, exp }: { report: Report; exp: ExperimentDetail }) {
  const [metric, setMetric] = useState<Metric>('rate')
  const [shareOpen, setShareOpen] = useState(false)
  const name = CHARACTERS[exp.character].name
  const { before, after } = report

  const durations = [BASE_REPLAY_MS, (BASE_REPLAY_MS * after.timeSec) / (before.timeSec || 1)]
  const replay = useReplay(durations)

  const firstSuccess = report.events[0]?.trial
  const cleared = exp.missions.find((m) => m.status === 'cleared') ?? exp.missions[0]
  const prediction = report.prediction
  const shareTitle = report.missionTitle ? missionName(report.missionTitle) : (cleared?.title ?? exp.title)
  const shareData = useMemo(
    () => ({
      code: exp.code,
      character: exp.character,
      characterName: name,
      missionTitle: shareTitle,
      stats: [
        { label: '최종 성공률', value: `${Math.round(after.successRate)}%` },
        ...(firstSuccess ? [{ label: '첫 성공', value: `${firstSuccess}번째 훈련` }] : []),
        // 예측 기록이 없으면 훈련 횟수로 대신한다
        prediction
          ? { label: '예측', value: prediction.correct ? '적중 ✓' : '빗나감' }
          : { label: '훈련', value: `${after.trial}회` },
      ],
    }),
    [exp.code, exp.character, name, shareTitle, after.successRate, after.trial, firstSuccess, prediction],
  )

  // 차트: v2 metrics(회차별 3지표). 없으면 성공률 곡선만
  const metrics = report.metrics
  const m = METRIC[metric]
  const series = metrics?.length
    ? metrics.map((t) => ({ x: t.trial, y: m.pick(t) }))
    : report.curve.map((c) => ({ x: c.trial, y: c.successRate }))
  const yTicks = metric === 'rate' ? [0, 25, 50, 75, 100] : niceTicks(Math.max(...series.map((p) => p.y), 1))
  const yDomain: [number, number] = [0, yTicks[yTicks.length - 1]]

  const compare: { label: string; from: string; to: string; delta: string }[] = [
    {
      label: '성공률',
      from: `${Math.round(before.successRate)}%`,
      to: `${Math.round(after.successRate)}%`,
      delta: `+${Math.round(after.successRate - before.successRate)}%p`,
    },
    {
      label: '평균 도달 시간',
      from: `${before.timeSec}s`,
      to: `${after.timeSec}s`,
      delta: `${change(before.timeSec, after.timeSec)}%`,
    },
    {
      label: '평균 충돌 수',
      from: `${before.collisions}`,
      to: `${after.collisions}`,
      delta: `${change(before.collisions, after.collisions)}%`,
    },
  ]

  const replays: {
    snap: ReportSnapshot
    title: string
    expression: 'confused' | 'champion'
    path: Point[]
  }[] = [
    {
      snap: before,
      title: '엉뚱한 움직임',
      expression: 'confused',
      path: report.replay?.first ?? [],
    },
    {
      snap: after,
      title: '능숙한 행동',
      expression: 'champion',
      path: report.replay?.last ?? [],
    },
  ]
  const threshold = cleared?.successThreshold ?? 60
  const scene = cleared?.scene ?? exp.scene
  const hasReplay = replays.every((r) => r.path.length > 0)

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <span className={styles.eyebrow}>
            GROWTH REPORT · EXPERIMENT {exp.code} · TRIAL {before.trial} → {after.trial}
          </span>
          <h1 className={styles.title}>{name}가 이만큼 성장했어요</h1>
          <p className={styles.desc}>
            {after.trial}회 훈련 동안의 변화를 지표와 기록으로 확인하세요. 모든 수치는 실제 실험 로그에서 계산됩니다.
          </p>
          <p className={styles.summary}>{report.summary}</p>
        </div>
        <div className={styles.headSide}>
          <Mascot expression="happy" size={160} float />
          <Button variant="secondary" iconLeft={<Icon name="share" size={16} />} onClick={() => setShareOpen(true)}>
            공유하기
          </Button>
        </div>
      </header>

      <div className={styles.chartRow}>
        <GlassCard padding="lg" radius="lg" className={styles.chartCard}>
          <div className={styles.chartHead}>
            <h2 className={styles.cardTitle}>{m.title}</h2>
            <SegmentedControl<Metric>
              size="sm"
              value={metric}
              onChange={setMetric}
              items={(Object.keys(METRIC) as Metric[]).map((k) => ({
                value: k,
                label: METRIC[k].tab,
                disabled: k !== 'rate' && !metrics?.length,
              }))}
            />
          </div>
          <LineChart
            data={series}
            events={report.events.map((e) => ({
              x: e.trial,
              label: `T${e.trial}`,
            }))}
            height={320}
            xDomain={[1, after.trial]}
            xTicks={[1, 25, 50, 75, 100].filter((t) => t <= after.trial)}
            yTicks={yTicks}
            yDomain={yDomain}
            formatX={(x) => (x === 1 ? 'Trial 1' : String(x))}
            formatY={m.format}
            label={`${m.title} ${m.format(series[0]?.y ?? 0)}에서 ${m.format(series[series.length - 1]?.y ?? 0)}`}
          />
          <ul className={styles.legend}>
            {report.events.map((e) => (
              <li key={e.trial}>
                <span className={styles.legendDot} aria-hidden />
                <span className={styles.mono}>T{e.trial}</span> {e.label}
              </li>
            ))}
          </ul>
        </GlassCard>

        <div className={styles.compare}>
          {compare.map((c) => (
            <GlassCard key={c.label} padding="md" className={styles.compareCard}>
              <span className={styles.compareLabel}>{c.label}</span>
              <div className={styles.compareRow}>
                <span className={styles.from}>{c.from}</span>
                <Icon name="arrow-right" size={16} className={styles.arrow} />
                <span className={styles.to}>{c.to}</span>
                <span className={styles.delta}>{c.delta}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <section aria-labelledby="replay-title" className={styles.replaySection}>
        <span className={styles.eyebrow}>BEFORE / AFTER</span>
        <h2 id="replay-title" className={styles.sectionTitle}>
          나란히 재생해서 비교하기
        </h2>
        <div className={styles.replays}>
          {replays.map((r, i) => (
            <GlassCard key={r.snap.trial} padding="sm" radius="lg" className={styles.replayCard}>
              {r.path.length ? (
                <ReplayArena
                  path={r.path}
                  t={replay.progress[i]}
                  expression={r.expression}
                  label={`Trial ${r.snap.trial} 리플레이`}
                  goal={scene?.food}
                  obstacles={scene?.obstacles}
                />
              ) : (
                <EmptyState
                  compact
                  expression={r.expression}
                  title="REPLAY"
                  description="리플레이를 불러오지 못했어요"
                />
              )}
              <div className={styles.replayFoot}>
                <strong>
                  TRIAL {r.snap.trial} — {r.title}
                </strong>
                <span className={styles.mono}>
                  목표 도달 {r.snap.successRate >= threshold ? '성공' : '실패'} · {r.snap.timeSec}s · 충돌{' '}
                  {r.snap.collisions}회
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
        <Button
          variant="secondary"
          className={styles.playBtn}
          iconLeft={<Icon name="play" size={14} />}
          onClick={replay.play}
          disabled={!hasReplay || replay.playing}
        >
          {replay.progress[0] >= 1 ? '다시 재생' : '나란히 재생'}
        </Button>
      </section>

      <GlassCard padding="lg" radius="lg" className={styles.commentary}>
        <Mascot expression="scientist" size={104} alt="" />
        <div>
          <h2 className={styles.cardTitle}>AI 해설 에이전트 요약</h2>
          <p className={styles.commentaryText}>{report.commentary}</p>
        </div>
      </GlassCard>

      <div className={styles.actions}>
        <Button to="/dex" size="lg">
          AI 도감에 저장
        </Button>
        <Button to={`/experiments/${exp.id}/reveal`} variant="secondary" size="lg">
          기술 카드 보기
        </Button>
        <Button to={`/experiments/${exp.id}/play`} variant="secondary" size="lg">
          다시 플레이
        </Button>
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} experimentId={exp.id} data={shareData} />
    </div>
  )
}
