import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { getExperiment, getReport, runTrial } from '../../api'
import type { ExperimentDetail, Report, ReportSnapshot, TrialResult } from '../../api/types'
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

  // 리포트에는 경로가 없어 trial을 한 번 실행해 path(최근) · firstPath(1회차)를 받는다
  const trial = useApi<TrialResult>(
    () => runTrial(exp.id, { missionId: exp.missions[0]?.id ?? 'm1', speed: 1 }),
    [exp.id],
  )
  const durations = [BASE_REPLAY_MS, (BASE_REPLAY_MS * after.timeSec) / (before.timeSec || 1)]
  const replay = useReplay(durations)

  const firstSuccess = report.events[0]?.trial
  const cleared = exp.missions.find((m) => m.status === 'cleared') ?? exp.missions[0]
  const shareData = useMemo(
    () => ({
      code: exp.code,
      character: exp.character,
      characterName: name,
      missionTitle: cleared?.title ?? exp.title,
      stats: [
        { label: '최종 성공률', value: `${Math.round(after.successRate)}%` },
        ...(firstSuccess ? [{ label: '첫 성공', value: `${firstSuccess}번째 훈련` }] : []),
        { label: '훈련', value: `${after.trial}회` },
      ],
    }),
    [exp.code, exp.character, exp.title, name, cleared?.title, after.successRate, after.trial, firstSuccess],
  )

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
    path: TrialResult['path']
  }[] = [
    {
      snap: before,
      title: '엉뚱한 움직임',
      expression: 'confused',
      path: trial.data?.firstPath ?? [],
    },
    {
      snap: after,
      title: '능숙한 행동',
      expression: 'champion',
      path: trial.data?.path ?? [],
    },
  ]
  const threshold = cleared?.successThreshold ?? 60

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
            <h2 className={styles.cardTitle}>회차별 성공률</h2>
            <SegmentedControl<Metric>
              size="sm"
              value={metric}
              onChange={setMetric}
              items={[
                { value: 'rate', label: '성공률' },
                {
                  value: 'time',
                  label: <span title="곧 열려요">도달 시간</span>,
                  disabled: true,
                },
                {
                  value: 'collisions',
                  label: <span title="곧 열려요">충돌 수</span>,
                  disabled: true,
                },
              ]}
            />
          </div>
          <LineChart
            data={report.curve.map((c) => ({ x: c.trial, y: c.successRate }))}
            events={report.events.map((e) => ({
              x: e.trial,
              label: `T${e.trial}`,
            }))}
            height={320}
            xDomain={[1, after.trial]}
            xTicks={[1, 25, 50, 75, 100].filter((t) => t <= after.trial)}
            yTicks={[0, 25, 50, 75, 100]}
            formatX={(x) => (x === 1 ? 'Trial 1' : String(x))}
            label={`회차별 성공률 ${Math.round(before.successRate)}%에서 ${Math.round(after.successRate)}%`}
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
              {trial.loading ? (
                <Skeleton height={300} />
              ) : r.path.length ? (
                <ReplayArena
                  path={r.path}
                  t={replay.progress[i]}
                  expression={r.expression}
                  label={`Trial ${r.snap.trial} 리플레이`}
                  goal={trial.data?.path[trial.data.path.length - 1]}
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
          disabled={!trial.data || replay.playing}
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
