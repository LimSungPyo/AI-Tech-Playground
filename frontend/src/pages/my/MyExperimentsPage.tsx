import { useState } from 'react'
import {
  getExperiment,
  getHistory,
  getMyCharacters,
  getMyExperiments,
  getTechDrop,
  type ExperimentSummary,
} from '../../api'
import {
  Badge,
  Button,
  Character,
  EmptyState,
  GlassCard,
  Icon,
  Input,
  ProgressBar,
  SegmentedControl,
  Select,
  Skeleton,
  Sparkline,
  useToast,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { CHARACTER_TINT, daysUntil, formatMonthDay, formatRelative, toDate } from './components/format'
import { PageTitle } from './components/PageTitle'
import my from './components/my.module.css'
import styles from './MyExperimentsPage.module.css'

type Tab = 'all' | 'progress' | 'done' | 'notify'
type Sort = 'recent' | 'rate' | 'code'

const SORTS = [
  { value: 'recent', label: '최근 플레이 순' },
  { value: 'rate', label: '성공률 순' },
  { value: 'code', label: '번호 순' },
]

const isDone = (e: ExperimentSummary) => !!e.progress && e.progress.trial >= e.progress.maxTrial

// W2 my 담당 · 경로 /my/experiments · C-03 내 실험
export default function MyExperimentsPage() {
  const exps = useApi((s) => getMyExperiments(s), [])
  const history = useApi((s) => getHistory(s), [])
  const chars = useApi((s) => getMyCharacters(s), [])
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('all')
  const [sort, setSort] = useState<Sort>('recent')
  const [q, setQ] = useState('')
  // 알림 끄기(구독 해제 API가 없어 화면에서만 뺀다)
  const [muted, setMuted] = useState<string[]>([])

  // 실험별 마지막 플레이 시각(학습 기록 로그에서)
  const lastPlayed = (() => {
    const map = new Map<string, string>()
    for (const log of history.data?.logs ?? []) {
      const prev = map.get(log.experimentId)
      if (!prev || toDate(log.date) > toDate(prev)) map.set(log.experimentId, log.date)
    }
    return map
  })()

  const all = exps.data ?? []
  const played = all.filter((e) => e.progress)
  const notify = all.filter((e) => e.status === 'coming_soon' && !muted.includes(e.id))
  const inProgress = played.filter((e) => !isDone(e))
  const done = played.filter(isDone)

  const list = (() => {
    const base = tab === 'progress' ? inProgress : tab === 'done' ? done : tab === 'notify' ? [] : played
    const keyword = q.trim().toLowerCase()
    const filtered = keyword
      ? base.filter((e) => e.title.toLowerCase().includes(keyword) || e.code.includes(keyword) || e.id.includes(keyword))
      : base
    return [...filtered].sort((a, b) => {
      if (sort === 'rate') return (b.progress?.successRate ?? 0) - (a.progress?.successRate ?? 0)
      if (sort === 'code') return a.id.localeCompare(b.id)
      const ta = lastPlayed.get(a.id) ?? ''
      const tb = lastPlayed.get(b.id) ?? ''
      return tb.localeCompare(ta)
    })
  })()

  if (exps.error) {
    return (
      <EmptyState
        expression="confused"
        title="내 실험을 불러오지 못했어요"
        description={exps.error.message}
        action={<Button onClick={exps.reload}>다시 시도</Button>}
      />
    )
  }

  const masters = new Set((chars.data ?? []).filter((c) => c.state === 'master').map((c) => c.experimentId))

  return (
    <div className={my.page}>
      <PageTitle
        title="내 실험"
        sub={exps.data ? `참여한 실험 ${played.length}개 · 오픈 알림 ${notify.length}개` : ' '}
        right={<Button to="/lab">실험실에서 새 실험 찾기</Button>}
      />

      <div className={styles.toolbar}>
        <SegmentedControl<Tab>
          label="실험 상태"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'all', label: `전체 ${played.length}` },
            { value: 'progress', label: `진행 중 ${inProgress.length}` },
            { value: 'done', label: `완료 ${done.length}` },
            { value: 'notify', label: `알림 신청 ${notify.length}` },
          ]}
        />
        <div className={styles.tools}>
          <Select
            aria-label="정렬"
            options={SORTS}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className={styles.sort}
          />
          <Input
            aria-label="실험 검색"
            placeholder="실험 이름 · 번호 검색"
            iconLeft={<Icon name="search" size={16} />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={styles.search}
          />
        </div>
      </div>

      {exps.loading ? (
        [0, 1, 2].map((i) => <Skeleton key={i} height={170} />)
      ) : tab !== 'notify' && played.length === 0 ? (
        <EmptyState
          expression="sleep"
          title="아직 참여한 실험이 없어요"
          description="드로시와 함께 첫 실험을 시작해 볼까요?"
          action={<Button to="/lab">첫 실험 하러 가기</Button>}
        />
      ) : tab !== 'notify' && list.length === 0 ? (
        <EmptyState compact expression="confused" title="조건에 맞는 실험이 없어요" />
      ) : (
        tab !== 'notify' &&
        list.map((e) => (
          <ExperimentRow key={e.id} exp={e} lastPlayedAt={lastPlayed.get(e.id)} mastered={masters.has(e.id)} />
        ))
      )}

      {(tab === 'all' || tab === 'notify') && notify.length > 0 && (
        <GlassCard radius="lg">
          <div className={my.cardHead}>
            <h2 className={my.cardTitle}>오픈 알림 신청한 실험</h2>
            <span className={my.caption}>열리면 알림 + 이메일</span>
          </div>
          <ul className={styles.notifyList}>
            {notify.map((e) => (
              <NotifyRow
                key={e.id}
                exp={e}
                onMute={() => {
                  setMuted((m) => [...m, e.id])
                  toast.show({ title: '오픈 알림을 껐어요', description: `${e.code} · ${e.title}` })
                }}
              />
            ))}
          </ul>
        </GlassCard>
      )}
      {tab === 'notify' && notify.length === 0 && !exps.loading && (
        <EmptyState compact expression="sleep" title="알림 신청한 실험이 없어요" action={<Button to="/lab">실험실 둘러보기</Button>} />
      )}
    </div>
  )
}

function ExperimentRow({ exp, lastPlayedAt, mastered }: { exp: ExperimentSummary; lastPlayedAt?: string; mastered: boolean }) {
  const detail = useApi((s) => getExperiment(exp.id, s), [exp.id])
  const p = exp.progress!
  const done = isDone(exp)
  const first = detail.data?.stats.firstTrialRate
  const gain = first !== undefined ? Math.round(p.successRate - first) : undefined
  const cardId = detail.data?.cardId

  return (
    <GlassCard radius="lg" className={styles.row}>
      <span className={styles.thumb} style={{ background: CHARACTER_TINT[exp.character] }}>
        <Character id={exp.character} size={100} />
      </span>

      <div className={styles.body}>
        <div className={styles.codeRow}>
          <span className={styles.code}>{exp.code}</span>
          <Badge tone={done ? 'success' : 'indigo'}>{done ? '완료' : '진행 중'}</Badge>
        </div>
        <h2 className={styles.title}>{exp.title}</h2>
        <div className={styles.progress}>
          <ProgressBar value={p.trial} max={p.maxTrial} size="sm" tone={done ? 'success' : 'indigo'} className={styles.bar} />
          <span className={my.caption}>
            Trial {p.trial} / {p.maxTrial}
          </span>
        </div>
        <dl className={styles.meta}>
          <div>
            <dt>성공률</dt>
            <dd>{Math.round(p.successRate)}%</dd>
          </div>
          <div>
            <dt>1회차 대비</dt>
            <dd className={styles.gain}>{gain === undefined ? '—' : `${gain >= 0 ? '+' : ''}${gain}%p`}</dd>
          </div>
          <div>
            <dt>마지막 플레이</dt>
            <dd>
              {lastPlayedAt
                ? done
                  ? `${formatMonthDay(lastPlayedAt)}${mastered ? ' · 마스터' : ''}`
                  : formatRelative(lastPlayedAt)
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className={styles.trend} aria-hidden>
        {first !== undefined && <Sparkline values={trendValues(first, p.successRate, p.trial)} width={160} height={48} tone={done ? 'success' : 'indigo'} />}
      </div>

      <div className={styles.actions}>
        {done ? (
          <>
            <Button size="sm" block to={`/experiments/${exp.id}/report`}>
              리포트
            </Button>
            <Button variant="secondary" size="sm" block to={`/experiments/${exp.id}`}>
              다시 하기
            </Button>
            {mastered && (
              <Button variant="secondary" size="sm" block to="/dex">
                도감 카드
              </Button>
            )}
          </>
        ) : (
          <>
            <Button size="sm" block to={`/experiments/${exp.id}/play`}>
              이어하기
            </Button>
            {p.trial >= 10 && (
              <Button variant="secondary" size="sm" block to={`/experiments/${exp.id}/report`}>
                리포트
              </Button>
            )}
            {cardId && (
              <Button variant="secondary" size="sm" block to={`/cards/${cardId}`}>
                기술 카드
              </Button>
            )}
          </>
        )}
      </div>
    </GlassCard>
  )
}

/** 1회차 → 현재 성공률 사이의 완만한 학습 곡선(추세 표시용) */
function trendValues(first: number, now: number, trials: number) {
  const n = Math.max(4, Math.min(12, trials))
  return Array.from({ length: n }, (_, i) => first + (now - first) * (1 - Math.pow(1 - i / (n - 1), 2)))
}

function NotifyRow({ exp, onMute }: { exp: ExperimentSummary; onMute: () => void }) {
  const drop = useApi((s) => getTechDrop(exp.id, s), [exp.id])
  const dDay = drop.data ? daysUntil(drop.data.openAt) : undefined
  return (
    <li className={styles.notify}>
      <Character id={exp.character} size={56} />
      <div className={styles.notifyBody}>
        <p className={styles.notifyTitle}>
          {exp.code} · {exp.title}
        </p>
        <p className={styles.notifyState}>{drop.data?.subscribed === false ? exp.unlockCondition : '알림 받는 중'}</p>
      </div>
      {dDay !== undefined ? (
        <Badge tone="dark" mono>
          {dDay > 0 ? `D-${dDay}` : 'OPEN'}
        </Badge>
      ) : (
        exp.unlockCondition && <span className={my.caption}>{exp.unlockCondition}</span>
      )}
      <button type="button" className={styles.mute} onClick={onMute}>
        알림 끄기
      </button>
    </li>
  )
}
