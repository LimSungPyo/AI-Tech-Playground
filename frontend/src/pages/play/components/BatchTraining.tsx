import { useCallback, useEffect, useRef, useState } from 'react'
import { trainBatch } from '../../../api'
import type { BatchTraining as Batch, Point } from '../../../api'
import { Badge, Button, EmptyState, GlassCard, LineChart, Mascot, ProgressBar, cx } from '../../../components'
import { fmtDelta } from '../lib'
import { MiniScene } from './MiniScene'
import { PlayHeader, TrialCounter } from './PlayHeader'
import styles from './BatchTraining.module.css'

const COUNT = 10
/** 미니 결과 한 칸이 채워지는 간격 */
const REVEAL_MS = 650

export interface BatchTrainingProps {
  experimentId: string
  code: string
  title: string
  missionId: string
  /** 묶음 시작 전 회차 · 성공률 */
  startTrial: number
  startRate: number
  /** 미니 리플레이에 찍을 먹이 위치(지금 미션 장면) */
  food?: Point
  /** 묶음 응답이 오기 전 말풍선(직전 회차 일지) */
  monologue?: string
  isMember: boolean
  /** 나가기 확인 중에는 진행을 멈춘다 */
  hold?: boolean
  /** 진행 상황을 부모에 알린다(나가기 확인용) */
  onProgress: (done: number, running: boolean, batch: Batch | null) => void
  /** ← 플레이로 */
  onBack: () => void
  /** 묶음 완료 후 플레이로 돌아가기 */
  onFinish: (batch: Batch) => void
  onError: (e: unknown, retry: () => void) => void
}

/** B-06 ×10 훈련 — 10개 회차를 빠르게 돌리며 미니 결과가 차례로 채워진다 */
export function BatchTraining(p: BatchTrainingProps) {
  const { experimentId, missionId, startTrial, startRate, onProgress, onError } = p
  const [batch, setBatch] = useState<Batch | null>(null)
  const [revealed, setRevealed] = useState(0)
  const [paused, setPaused] = useState(false)
  const started = useRef(false)

  const start = useCallback(
    function retry() {
      trainBatch(experimentId, missionId, COUNT)
        .then(setBatch)
        .catch((e: unknown) => onError(e, retry))
    },
    [experimentId, missionId, onError],
  )

  useEffect(() => {
    if (started.current) return
    started.current = true
    start()
  }, [start])

  const total = batch?.trials.length ?? COUNT
  const running = revealed < total

  useEffect(() => {
    if (!batch || paused || p.hold || !running) return
    const t = window.setTimeout(() => setRevealed((n) => n + 1), REVEAL_MS)
    return () => window.clearTimeout(t)
  }, [batch, paused, p.hold, running, revealed])

  useEffect(() => {
    onProgress(revealed, running, batch)
  }, [revealed, running, batch, onProgress])

  const from = batch?.fromTrial ?? startTrial + 1
  const to = batch?.toTrial ?? startTrial + COUNT
  const shown = batch?.trials.slice(0, revealed) ?? []
  const nowRate = shown.length ? shown[shown.length - 1].successRate : startRate
  const changes = batch?.connections ?? []
  const monologue = batch?.journal ?? p.monologue
  const maxChange = Math.max(0.01, ...changes.map((c) => Math.abs(c.delta)))

  return (
    <div className={styles.wrap}>
      <PlayHeader code={p.code} title={p.title} backLabel="플레이로" onBack={p.onBack}>
        {running ? (
          <span className={styles.live}>
            <span className={styles.liveDot} aria-hidden />
            ×10 훈련 중
          </span>
        ) : (
          <Badge tone="success">×10 훈련 완료</Badge>
        )}
        <TrialCounter value={`${from} – ${to}`} />
        {running && (
          <>
            <Button variant="secondary" onClick={() => setPaused((v) => !v)} disabled={!batch}>
              {paused ? '다시 진행' : '일시정지'}
            </Button>
            <Button variant="secondary" onClick={() => setRevealed(total)} disabled={!batch}>
              결과만 보기
            </Button>
          </>
        )}
      </PlayHeader>

      <div className={styles.grid}>
        <section className={styles.main}>
          <div className={styles.progressHead}>
            <h2 className={styles.h2}>{running ? '10개 회차를 빠르게 돌리는 중' : '10개 회차 훈련을 마쳤어요'}</h2>
            <span className={styles.count}>
              {revealed} / {total} 완료
            </span>
          </div>
          <ProgressBar value={revealed} max={total} size="sm" />

          <ol className={styles.tiles}>
            {Array.from({ length: total }, (_, i) => {
              const trial = from + i
              const item = batch?.trials[i]
              const done = i < revealed
              const current = i === revealed && running
              const success = item?.success ?? true
              return (
                <li key={trial} className={cx(styles.tile, current && styles.tileCurrent)}>
                  <MiniScene
                    path={item?.path}
                    food={p.food}
                    tone={success ? 'success' : 'fail'}
                    reach={done ? (success ? 1 : 0.7) : 0.55}
                    obstacle={done && !success}
                    waiting={!done && !current}
                  />
                  <span className={styles.tileFoot}>
                    <strong>T{trial}</strong>
                    {done && item ? (
                      <Badge tone={success ? 'success' : 'danger'}>{success ? (item.timeSec !== undefined ? `성공 · ${item.timeSec}s` : '성공') : '실패'}</Badge>
                    ) : current ? (
                      <Badge tone="indigo">진행 중</Badge>
                    ) : (
                      <Badge tone="neutral">대기</Badge>
                    )}
                  </span>
                </li>
              )
            })}
          </ol>

          {!running && batch && (
            <GlassCard className={styles.done} padding="md">
              <span>
                Trial {batch.fromTrial}–{batch.toTrial} 훈련이 저장됐어요. 성공률 {Math.round(startRate)}% → {Math.round(nowRate)}%
              </span>
              <span className={styles.doneActions}>
                {p.isMember && (
                  <Button variant="secondary" to={`/experiments/${experimentId}/report`}>
                    성장 리포트 보기
                  </Button>
                )}
                <Button onClick={() => p.onFinish(batch)}>플레이로 돌아가기</Button>
              </span>
            </GlassCard>
          )}
        </section>

        <aside className={styles.side}>
          <GlassCard padding="md">
            <h3 className={styles.h3}>실시간 성공률</h3>
            <div className={styles.rate}>
              <span className={styles.rateFrom}>{Math.round(startRate)}%</span>
              <span className={styles.rateArrow}>→</span>
              <strong className={styles.rateNow}>{Math.round(nowRate)}%</strong>
              <Badge tone="success" className={styles.rateDelta}>
                {fmtDelta(nowRate - startRate, '%p')}
              </Badge>
            </div>
            <LineChart
              bare
              height={64}
              showLastDot={false}
              data={[{ x: startTrial, y: startRate }, ...shown.map((t) => ({ x: t.trial, y: t.successRate }))]}
              xDomain={[startTrial, to]}
              yDomain={[Math.max(0, Math.min(startRate, nowRate) - 10), Math.min(100, Math.max(startRate, nowRate) + 5)]}
              label="묶음 성공률 추세"
            />
          </GlassCard>

          <GlassCard padding="md">
            <h3 className={styles.h3}>가장 많이 바뀐 연결 TOP 5</h3>
            <p className={styles.caption}>보상을 받을 때마다 감각 → 운동 연결의 세기가 바뀌어요.</p>
            {changes.length ? (
              <ul className={styles.changes}>
                {changes.map((c) => (
                  <li key={`${c.from}-${c.to}`}>
                    <span>{c.label}</span>
                    <span className={styles.changeTrack}>
                      <span
                        className={c.delta >= 0 ? styles.changePlus : styles.changeMinus}
                        style={{ width: `${(Math.abs(c.delta) / maxChange) * 100}%` }}
                      />
                    </span>
                    <span className={c.delta >= 0 ? styles.plus : styles.minus}>
                      {c.delta >= 0 ? '+' : ''}
                      {c.delta.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact expression="neuron" title="훈련 결과가 오면 연결 변화를 보여 줄게요" />
            )}
          </GlassCard>

          <GlassCard padding="md" className={styles.talk}>
            <Mascot expression="training" size={112} alt="" float={running} />
            {monologue && <p className={styles.bubble}>"{monologue}"</p>}
          </GlassCard>
        </aside>
      </div>
    </div>
  )
}
