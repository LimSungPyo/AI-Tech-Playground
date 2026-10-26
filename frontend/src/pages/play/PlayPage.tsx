import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { getExperiment, getReport, getWhy, runTrial } from '../../api'
import type { BatchTraining as Batch, CurvePoint, ExperimentDetail, Level, TrialResult } from '../../api'
import { useAuth } from '../../auth/useAuth'
import {
  Badge,
  Button,
  Character,
  EmptyState,
  GlassCard,
  Icon,
  LineChart,
  Mascot,
  SegmentedControl,
  Skeleton,
  Stat,
  cx,
  useToast,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { GuestSaveModal, LoginPopup } from '../auth/global'
import { BatchTraining } from './components/BatchTraining'
import { GameCanvas } from './components/GameCanvas'
import { NeuralNet } from './components/NeuralNet'
import { ConnectionLost, LeaveTrainingModal, SessionExpiredModal } from './components/PlayDialogs'
import { PlayHeader, TrialCounter } from './components/PlayHeader'
import { WhyCard } from './components/WhyCard'
import { WhyDrawer } from './components/WhyDrawer'
import { GUEST_LIMIT, errorKind, fmtDelta, getGuestTrials, mergeCurve, sceneFor, setGuestTrials } from './lib'
import { usePlayback } from './usePlayback'
import styles from './PlayPage.module.css'

const LEVEL_LABEL: Record<Level, string> = { intro: '입문', basic: '기초', advanced: '심화', frontier: '최전선' }

// W2 play 담당 · 경로 /experiments/:id/play — B-04 플레이 · G-03 #000 웜이 · 0-02 게스트 체험
export default function PlayPage() {
  const { id = '001' } = useParams()
  const [sp] = useSearchParams()
  const { data, error, loading, reload } = useApi((signal) => getExperiment(id, signal), [id])
  const missionId = sp.get('mission') ?? 'm1'

  if (loading && !data) {
    return (
      <div className={styles.page}>
        <Skeleton height={56} />
        <div className={styles.layout}>
          <Skeleton height={560} />
          <Skeleton height={560} />
        </div>
      </div>
    )
  }
  if (error || !data) {
    return (
      <EmptyState
        expression="confused"
        title={error?.status === 404 ? '실험을 찾을 수 없어요' : '실험을 불러오지 못했어요'}
        description={error?.message}
        action={
          error?.status === 404 ? (
            <Button to="/lab">실험실로</Button>
          ) : (
            <Button onClick={reload} iconLeft={<Icon name="refresh" size={16} />}>
              다시 시도
            </Button>
          )
        }
      />
    )
  }
  // 실험 · 미션이 바뀌면 플레이 상태를 처음부터
  return <PlayView key={`${id}-${missionId}`} experiment={data} missionId={missionId} />
}

interface JournalEntry {
  trial: number
  text: string
  success: boolean
  timeSec: number
}

interface NetError {
  attempt: number
  retry: () => void
}

function PlayView({ experiment, missionId }: { experiment: ExperimentDetail; missionId: string }) {
  const id = experiment.id
  const worm = id === '000'
  const scene = sceneFor(experiment, missionId)
  const { isMember, user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [sp, setSp] = useSearchParams()
  const returnTo = location.pathname + location.search
  const startTrial = experiment.progress?.trial ?? 0
  const mission = experiment.missions.find((m) => m.id === missionId)

  // ── 회차 상태 ──
  const [pending, setPending] = useState<TrialResult | null>(null) // 재생 중(끝나면 반영)
  const [result, setResult] = useState<TrialResult | null>(null)
  const [prevResult, setPrevResult] = useState<TrialResult | null>(null)
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [batchCurve, setBatchCurve] = useState<CurvePoint[]>([])
  const [lastTrial, setLastTrial] = useState(experiment.progress?.trial ?? 0)
  const [speed, setSpeed] = useState(1)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [guestTrials, setGuestCount] = useState(getGuestTrials)

  // ── 오버레이 상태 ──
  const [whyOpen, setWhyOpen] = useState(sp.get('why') === 'last')
  const [guestGate, setGuestGate] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [net, setNet] = useState<NetError | null>(null)
  const [training, setTraining] = useState(false)
  const [trainState, setTrainState] = useState({ done: 0, running: false })
  const [leaveAsk, setLeaveAsk] = useState(false)

  // 처음 들어왔을 때 곡선 · 지표는 리포트의 회차별 지표에서 지금 회차까지만 잘라 쓴다(GET만, 회차는 늘지 않는다)
  const history = useApi(isMember && !worm && startTrial > 0 ? (signal) => getReport(id, signal) : null, [id, isMember])
  const past = history.data?.metrics?.filter((m) => m.trial <= startTrial) ?? []
  const lastPast = past.length ? past[past.length - 1] : undefined

  const shown = pending ?? result
  const path = shown?.path ?? []
  const curve = mergeCurve(past, result?.curve ?? [], batchCurve)
  const currentRate = curve.length ? curve[curve.length - 1].successRate : (experiment.progress?.successRate ?? 0)
  const rateDelta = curve.length > 1 ? curve[curve.length - 1].successRate - curve[curve.length - 2].successRate : undefined

  // 처음 들어왔을 때 WHY 카드는 마지막 회차 설명으로 채운다(GET만, 회차는 늘지 않는다)
  const firstWhy = useApi(
    lastTrial > 0 ? (signal) => getWhy(id, experiment.progress?.trial ?? lastTrial, 'beginner', signal) : null,
    [id],
  )
  const why = result?.why ?? firstWhy.data
  const whyTrial = result?.trial ?? experiment.progress?.trial ?? lastTrial
  const expired = sessionExpired || firstWhy.error?.status === 401

  const handleError = useCallback(
    (e: unknown, retry: () => void) => {
      const kind = errorKind(e)
      if (kind === 'network') setNet((prev) => ({ attempt: (prev?.attempt ?? 0) + 1, retry }))
      else if (kind === 'session') setSessionExpired(true)
      else toast.show({ title: '요청을 처리하지 못했어요', description: e instanceof Error ? e.message : undefined, tone: 'danger' })
    },
    [toast],
  )

  const checkClear = (before: number, after: number) => {
    if (!isMember || !mission || before >= mission.successThreshold || after < mission.successThreshold) return
    toast.show({
      title: '미션 성공 기준을 넘었어요!',
      description: `성공률 ${Math.round(after)}% · 기준 ${mission.successThreshold}%`,
      tone: 'success',
      action: { label: '결과 보기', onClick: () => navigate(`/experiments/${id}/missions/${missionId}/clear`) },
      duration: 0,
    })
  }

  // ── 재생 ──
  const commit = () => {
    const r = pending
    if (!r) return
    const before = currentRate
    setPrevResult(result)
    setResult(r)
    setPending(null)
    setJournal((j) => [...j, { trial: r.trial, text: r.journal, success: r.success, timeSec: r.timeSec }])
    const after = r.curve.length ? r.curve[r.curve.length - 1].successRate : before
    checkClear(before, after)
  }
  const pb = usePlayback(path.length, speed, commit)
  const step = path.length ? Math.round(pb.progress) : undefined

  const runOnce = () => {
    if (busyRef.current || pending) return
    if (!isMember) {
      const n = getGuestTrials()
      if (n >= GUEST_LIMIT) {
        setGuestCount(n)
        setGuestGate(true)
        return
      }
    }
    busyRef.current = true
    setBusy(true)
    runTrial(id, { missionId, speed })
      .then((r) => {
        setNet(null)
        if (!isMember) {
          const n = getGuestTrials() + 1
          setGuestTrials(n)
          setGuestCount(n)
        }
        setLastTrial(r.trial)
        setPending(r)
        pb.restart(r.path.length)
      })
      .catch((e: unknown) => handleError(e, runOnce))
      .finally(() => {
        busyRef.current = false
        setBusy(false)
      })
  }

  const replay = () => {
    if (!path.length) return
    pb.play()
  }

  // ── ×10 훈련 ──
  const batchRef = useRef<Batch | null>(null)
  const startTraining = () => {
    if (!isMember) {
      toast.show({
        title: '×10 훈련은 로그인하면 쓸 수 있어요',
        description: '게스트 체험은 1회 실행만 할 수 있어요.',
        action: { label: '로그인', onClick: () => setLoginOpen(true) },
      })
      return
    }
    pb.pause()
    setTrainState({ done: 0, running: true })
    batchRef.current = null
    setTraining(true)
  }
  const onTrainProgress = useCallback((done: number, running: boolean, batch: Batch | null) => {
    batchRef.current = batch
    if (batch) setNet(null)
    setTrainState({ done, running })
  }, [])
  const onTrainError = useCallback((e: unknown, retry: () => void) => handleError(e, retry), [handleError])

  const exitTraining = (batch: Batch | null, done: number) => {
    if (batch && done > 0) {
      const kept = batch.trials.slice(0, done)
      const before = currentRate
      setBatchCurve((c) => mergeCurve(c, kept))
      setLastTrial(kept[kept.length - 1].trial)
      checkClear(before, kept[kept.length - 1].successRate)
    }
    setNet(null)
    setTrainState({ done: 0, running: false })
    setTraining(false)
  }

  // 훈련 중 다른 화면으로 가려 하면 E-04
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => training && trainState.running && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (!(training && trainState.running)) return
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [training, trainState.running])

  const leaveOpen = blocker.state === 'blocked' || leaveAsk
  const stay = () => {
    if (blocker.state === 'blocked') blocker.reset()
    setLeaveAsk(false)
  }
  const leave = () => {
    const done = trainState.done
    exitTraining(batchRef.current, done)
    setLeaveAsk(false)
    if (blocker.state === 'blocked') blocker.proceed()
  }

  // ── WHY? ──
  const openWhy = () => {
    pb.pause()
    setWhyOpen(true)
  }
  const closeWhy = () => {
    setWhyOpen(false)
    if (sp.has('why')) {
      const next = new URLSearchParams(sp)
      next.delete('why')
      setSp(next, { replace: true })
    }
  }

  const missionItems = experiment.missions.slice(0, 2).map((m, i) => ({
    value: m.id,
    label: `미션 ${i + 1} · ${m.title}`,
    disabled: m.status === 'locked',
  }))
  const setMission = (m: string) => {
    const next = new URLSearchParams(sp)
    next.set('mission', m)
    setSp(next)
  }

  const neuronsShown = shown?.neurons
  // 이번 회차 지표: 실행한 회차가 없으면 리포트의 지금 회차 · 직전 회차 값
  const metric = result ?? lastPast
  const metricPrev = result ? (prevResult ?? lastPast) : past[past.length - 2]
  const guestLeft = Math.max(0, GUEST_LIMIT - guestTrials)

  if (training) {
    return (
      <div className={styles.page}>
        <BatchTraining
          experimentId={id}
          code={experiment.code}
          title={experiment.title}
          missionId={missionId}
          startTrial={lastTrial}
          startRate={currentRate}
          food={scene.food}
          monologue={result?.journal}
          isMember={isMember}
          hold={leaveOpen || !!net}
          onProgress={onTrainProgress}
          onBack={() => (trainState.running ? setLeaveAsk(true) : exitTraining(batchRef.current, trainState.done))}
          onFinish={(b) => exitTraining(b, b.trials.length)}
          onError={onTrainError}
        />
        {net && <ConnectionLost attempt={net.attempt} onRetry={net.retry} />}
        <LeaveTrainingModal open={leaveOpen} done={trainState.done} total={10} onStay={stay} onLeave={leave} />
        <SessionExpiredModal open={expired} trial={lastTrial} returnTo={returnTo} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PlayHeader code={experiment.code} title={experiment.title} backLabel="실험실" backTo="/lab">
        {missionItems.length > 1 && (
          <SegmentedControl items={missionItems} value={missionId} onChange={setMission} size="sm" label="미션" />
        )}
        <TrialCounter value={pending?.trial ?? lastTrial} max={experiment.progress?.maxTrial} />
        {!isMember && (
          <span className={styles.guestChip}>
            게스트 체험 <strong>{Math.min(guestTrials, GUEST_LIMIT)} / {GUEST_LIMIT}회</strong>
          </span>
        )}
        {worm ? (
          <span className={styles.levelTag}>
            {LEVEL_LABEL[experiment.level]} · {experiment.durationMin}분
          </span>
        ) : (
          <>
            <Button variant="secondary" to={`/cards/${experiment.cardId}`}>
              기술 카드
            </Button>
            <Button variant="secondary" to={`/experiments/${id}/report`}>
              리포트 보기
            </Button>
          </>
        )}
      </PlayHeader>

      <div className={styles.layout}>
        <div className={styles.stage}>
          <GameCanvas
            scene={scene}
            path={path}
            firstPath={shown?.firstPath}
            progress={pb.progress}
            variant={worm ? 'petri' : 'grid'}
            label={worm ? 'PETRI DISH · 화학 주성 (냄새 진한 쪽으로)' : 'GAME CANVAS · 2D 탑뷰'}
            legend={worm ? '— 보라: 이번 회차   — 회색: 1회차' : '— 보라 점선: 이번 회차 경로   — 회색 점선: 1회차 경로'}
            dimmed={!!net}
          >
            {!isMember && (
              <div className={styles.guestBanner}>
                로그인하지 않으면 기록이 저장되지 않아요 · 남은 체험 {guestLeft}회
                <Button size="sm" onClick={() => setLoginOpen(true)}>
                  로그인
                </Button>
              </div>
            )}
            {!worm && why && !pending && <WhyCard why={why} trial={whyTrial} step={result ? step : undefined} onOpen={openWhy} />}
          </GameCanvas>
          {net && <ConnectionLost attempt={net.attempt} onRetry={net.retry} />}

          <div className={styles.controls}>
            <Button
              variant={worm ? 'dark' : 'secondary'}
              iconLeft={<Icon name="play" size={14} />}
              onClick={replay}
              disabled={!path.length || pb.playing}
            >
              재생
            </Button>
            {!worm && (
              <Button variant="secondary" onClick={pb.pause} disabled={!pb.playing}>
                일시정지
              </Button>
            )}
            <Button variant="secondary" onClick={runOnce} loading={busy} disabled={!!pending || !!net}>
              1회 실행
            </Button>
            <span className={styles.speedLabel}>속도</span>
            <div className={styles.speeds} role="radiogroup" aria-label="재생 속도">
              {(worm ? [1, 2] : [1, 2, 4]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={speed === s}
                  className={cx(styles.speed, speed === s && styles.speedOn)}
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
            <span className={styles.spacer} />
            <Button onClick={startTraining} disabled={busy || !!pending || !!net} iconLeft={<Icon name="close" size={14} />}>
              10회 훈련
            </Button>
            <Button
              variant="why"
              className={styles.whyBtn}
              iconLeft={worm ? undefined : <Mascot expression="why" size={26} alt="" />}
              onClick={openWhy}
              disabled={whyTrial <= 0}
            >
              WHY?
            </Button>
          </div>
        </div>

        <aside className={styles.side}>
          {worm ? (
            <WormSide
              neurons={neuronsShown}
              journal={journal}
              rate={currentRate}
              live={pb.playing}
              phase={pb.progress}
            />
          ) : (
            <>
              <GlassCard padding="md">
                <div className={styles.cardHead}>
                  <h2 className={styles.h2}>신경망 활성 상태</h2>
                  <Badge tone="solid" dot className={cx(!pb.playing && styles.liveIdle)}>
                    LIVE
                  </Badge>
                </div>
                <NeuralNet neurons={neuronsShown} path={why?.neuronPath} live={pb.playing} phase={pb.progress} />
                <div className={styles.layers}>
                  <span>감각 뉴런</span>
                  <span>중간 뉴런</span>
                  <span>운동 뉴런</span>
                </div>
                {why?.detail && <p className={styles.caption}>{why.detail}</p>}
              </GlassCard>

              <GlassCard padding="md">
                <h2 className={styles.h2}>이번 회차 지표</h2>
                <div className={styles.metrics}>
                  <Stat
                    size="sm"
                    label="성공률"
                    value={`${Math.round(currentRate)}%`}
                    delta={rateDelta !== undefined ? fmtDelta(rateDelta, '%p') : undefined}
                    trend={rateDelta === undefined ? undefined : rateDelta >= 0 ? 'up' : 'down'}
                  />
                  <Stat
                    size="sm"
                    label="도달 시간"
                    value={metric ? `${metric.timeSec}s` : '—'}
                    delta={metric && metricPrev ? fmtDelta(metric.timeSec - metricPrev.timeSec, 's') : undefined}
                    trend={metric && metricPrev ? (metric.timeSec <= metricPrev.timeSec ? 'up' : 'down') : undefined}
                  />
                  <Stat
                    size="sm"
                    label="충돌"
                    value={metric ? `${metric.collisions}회` : '—'}
                    delta={metric && metricPrev ? fmtDelta(metric.collisions - metricPrev.collisions) : undefined}
                    trend={metric && metricPrev ? (metric.collisions <= metricPrev.collisions ? 'up' : 'down') : undefined}
                  />
                </div>
              </GlassCard>

              <GlassCard padding="md">
                <div className={styles.cardHead}>
                  <h2 className={styles.h2}>학습 곡선 · 성공률</h2>
                  {curve.length > 1 && (
                    <span className={styles.mono}>
                      T{curve[0].trial} → T{curve[curve.length - 1].trial}
                    </span>
                  )}
                </div>
                {curve.length > 1 ? (
                  <LineChart
                    bare
                    height={120}
                    data={curve.map((c) => ({ x: c.trial, y: c.successRate }))}
                    label={`학습 곡선 T${curve[0].trial}부터 T${curve[curve.length - 1].trial}까지`}
                  />
                ) : (
                  <p className={styles.empty}>1회 실행을 누르면 회차별 성공률 곡선이 그려져요.</p>
                )}
              </GlassCard>

              <GlassCard padding="md">
                <div className={styles.cardHead}>
                  <h2 className={styles.h2}>성장 일지</h2>
                  <span className={styles.mono}>AI 해설</span>
                </div>
                {journal.length ? (
                  <ol className={styles.journal}>
                    {journal.slice(-4).map((j) => (
                      <li key={j.trial}>
                        <span className={styles.jTrial}>T{j.trial}</span>
                        {j.text}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={styles.empty}>회차가 끝날 때마다 AI 해설이 한 줄씩 기록해요.</p>
                )}
              </GlassCard>
            </>
          )}
        </aside>
      </div>

      {whyTrial > 0 && (
        <WhyDrawer
          open={whyOpen}
          onClose={closeWhy}
          experimentId={id}
          trial={whyTrial}
          step={result ? step : undefined}
          neurons={result?.neurons}
          defaultLevel={user?.skill ?? 'beginner'}
          cardId={experiment.cardId}
          onReplay={() => {
            closeWhy()
            if (path.length) pb.restart(path.length)
          }}
        />
      )}
      <GuestSaveModal open={guestGate} onClose={() => setGuestGate(false)} trials={guestTrials + 1} />
      <LoginPopup open={loginOpen} onClose={() => setLoginOpen(false)} />
      <SessionExpiredModal open={expired} trial={lastTrial} step={step} returnTo={returnTo} />
    </div>
  )
}

// ── G-03 #000 웜이 오른쪽 열 ──
const WORM_LABELS = ['감각 ASE · AWC', '중간 AIY · AIZ', '운동 SMD → 머리 방향']

function WormSide({
  neurons,
  journal,
  rate,
  live,
  phase,
}: {
  neurons?: TrialResult['neurons']
  journal: JournalEntry[]
  rate: number
  live: boolean
  phase: number
}) {
  // 302개 중 이번 행동에 쓰인 회로: 감각 2 · 중간 2 · 운동 1
  const circuit = neurons?.length
    ? [
        ...neurons.filter((n) => n.layer === 'sensory').slice(0, 2),
        ...neurons.filter((n) => n.layer === 'inter').slice(-2),
        ...neurons.filter((n) => n.layer === 'motor').slice(1, 2),
      ]
    : undefined
  const path = circuit ? [circuit[0].id, circuit[2].id, circuit[4].id] : undefined
  const reached = journal.filter((j) => j.success).length
  const avgTime = journal.length ? journal.reduce((s, j) => s + j.timeSec, 0) / journal.length : undefined

  return (
    <>
      <GlassCard padding="md">
        <h2 className={styles.h2}>302개 뉴런 중 이번 행동에 쓰인 회로</h2>
        <NeuralNet neurons={circuit} path={path} live={live} phase={phase} height={150} className={styles.circuit} />
        <div className={styles.layers}>
          {WORM_LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <p className={styles.caption}>
          실제 예쁜꼬마선충의 화학 주성 회로를 단순화했어요. 302개 뉴런 전체 연결은 반전 모드에서 볼 수 있어요.
        </p>
      </GlassCard>

      <GlassCard padding="md">
        <h2 className={styles.h2}>이번 회차</h2>
        <div className={styles.wormStats}>
          <span>
            <small>먹이 도달</small>
            <strong>{journal.length ? `${reached} / ${journal.length}` : '—'}</strong>
          </span>
          <span>
            <small>평균 시간</small>
            <strong>{avgTime !== undefined ? `${Math.round(avgTime)}s` : '—'}</strong>
          </span>
          <span>
            <small>꿈틀 효율</small>
            <strong>{Math.round(rate)}%</strong>
          </span>
        </div>
      </GlassCard>

      <GlassCard padding="md">
        <div className={styles.cardHead}>
          <h2 className={styles.h2}>웜이의 혼잣말</h2>
          <Character id="wormy" size={40} alt="" />
        </div>
        {journal.length ? (
          <ol className={styles.wormJournal}>
            {journal.slice(-3).map((j) => (
              <li key={j.trial}>
                T{j.trial} — {j.text}
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>1회 실행을 누르면 웜이가 한 줄씩 혼잣말을 남겨요.</p>
        )}
      </GlassCard>

      <p className={styles.wormHint}>성공률 85%가 되면 웜이 마스터 → 드로시(#001)를 추천해요</p>
    </>
  )
}
