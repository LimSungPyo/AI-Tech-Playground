import { useMemo, useRef, useState } from 'react'
import { getCurrentVote, getDex, getExperiment, getExperiments, getTree } from '../../api'
import type { ExperimentSummary, Level } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import {
  Button,
  CHARACTERS,
  Chip,
  EmptyState,
  Icon,
  Input,
  Mascot,
  Popover,
  ProgressBar,
  Skeleton,
  cx,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { ExperimentCard } from './components/ExperimentCard'
import { cardCopy } from './components/cardCopy'
import { VoteModal } from './components/VoteModal'
import { LEVELS, LEVEL_LABEL, STATE_LABEL, cardState } from './experimentMeta'
import type { CardState } from './experimentMeta'
import styles from './LabPage.module.css'

type SortKey = 'recommended' | 'code' | 'progress'
const SORT_LABEL: Record<SortKey, string> = {
  recommended: '추천순',
  code: '번호순',
  progress: '진행률순',
}
const STATE_FILTERS: CardState[] = ['in_progress', 'done', 'open', 'coming_soon', 'locked']

const DAY = 24 * 60 * 60 * 1000
const RECOMMEND_ORDER: Record<CardState, number> = {
  in_progress: 0,
  done: 1,
  open: 1,
  coming_soon: 2,
  voting: 3,
  locked: 4,
}

// W2 growth 담당 · 경로 /lab · G-01 실험실 (79:10213)
export default function LabPage() {
  const { isMember } = useAuth()
  const list = useApi((signal) => getExperiments({}, signal), [])
  const tree = useApi((signal) => getTree(signal), [])
  const voteApi = useApi((signal) => getCurrentVote(signal), [])
  // 완료 카드의 "· 마스터" 표시용(도감 state)
  const dex = useApi(isMember ? (signal) => getDex(signal) : null, [isMember])

  const [stateFilter, setStateFilter] = useState<CardState | 'all'>('all')
  const [level, setLevel] = useState<Level | null>(null)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('recommended')
  const [sortOpen, setSortOpen] = useState(false)
  const [voteOpen, setVoteOpen] = useState(false)
  const sortRef = useRef<HTMLButtonElement>(null)
  const [now] = useState(() => Date.now())

  const all = useMemo(() => list.data ?? [], [list.data])
  const states = useMemo(() => new Map(all.map((e) => [e.id, cardState(e, isMember)])), [all, isMember])
  const countOf = (s: CardState) => all.filter((e) => states.get(e.id) === s).length

  // 이어하기 배너: 회원의 첫 진행 중 실험 + 그 실험의 열린 미션
  const continueExp = isMember ? all.find((e) => states.get(e.id) === 'in_progress') : undefined
  const continueDetail = useApi(continueExp ? (signal) => getExperiment(continueExp.id, signal) : null, [
    continueExp?.id,
  ])
  const openMission = continueDetail.data?.missions.find((m) => m.status === 'open')

  const vote = voteApi.data
  const dDay = (endsAt: string) => Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / DAY))
  const masters = useMemo(
    () => new Set(dex.data?.filter((d) => d.state === 'master').map((d) => d.experimentId)),
    [dex.data],
  )

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    const hit = (e: ExperimentSummary) =>
      !term ||
      [e.code, e.title, e.subtitle, CHARACTERS[e.character].name, ...e.tags].some((t) => t.toLowerCase().includes(term))
    const filtered = all.filter(
      (e) =>
        hit(e) &&
        (level === null || e.level === level) &&
        (stateFilter === 'all' ||
          states.get(e.id) === stateFilter ||
          // "오픈 예정" 필터는 투표 중도 함께 보여 준다
          (stateFilter === 'coming_soon' && states.get(e.id) === 'voting')),
    )
    if (sort === 'code') return [...filtered].sort((a, b) => a.id.localeCompare(b.id))
    if (sort === 'progress') {
      const rate = (e: ExperimentSummary) => (e.progress ? e.progress.trial / e.progress.maxTrial : -1)
      return [...filtered].sort((a, b) => rate(b) - rate(a))
    }
    // 추천순: 하던 실험 → 끝낸 실험 → 열린 실험 → 오픈 예정 → 투표 중 → 잠김
    return [...filtered].sort(
      (a, b) => RECOMMEND_ORDER[states.get(a.id) ?? 'open'] - RECOMMEND_ORDER[states.get(b.id) ?? 'open'],
    )
  }, [all, q, level, stateFilter, states, sort])

  const nodeFor = (expId: string) => tree.data?.nodes.find((n) => n.experimentId === expId)?.id
  const openCount = all.filter((e) => ['in_progress', 'done', 'open'].includes(states.get(e.id) ?? '')).length

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.titleBlock}>
          <span className={styles.eyebrow}>LAB</span>
          <h1 className={styles.title}>실험실</h1>
          {list.data ? (
            <p className={styles.sub}>
              실험 {all.length}개 · 열린 실험 {openCount} · 오픈 예정 {countOf('coming_soon')} · 투표 중{' '}
              {countOf('voting')}
            </p>
          ) : (
            <Skeleton shape="text" width={280} />
          )}
        </div>
        <Input
          className={styles.search}
          iconLeft={<Icon name="search" size={16} />}
          placeholder="실험 · 기술 · 캐릭터 검색"
          aria-label="실험 · 기술 · 캐릭터 검색"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </header>

      <div className={styles.filters}>
        <div className={styles.chips} role="group" aria-label="상태 필터">
          <Chip selected={stateFilter === 'all'} onClick={() => setStateFilter('all')} className={styles.chip}>
            전체 {all.length}
          </Chip>
          {STATE_FILTERS.map((s) => {
            // 비회원은 진행 기록이 없어 진행 중 · 완료 칩을 숨긴다
            if (!isMember && (s === 'in_progress' || s === 'done')) return null
            const n = countOf(s)
            return (
              <Chip
                key={s}
                selected={stateFilter === s}
                onClick={() => setStateFilter(stateFilter === s ? 'all' : s)}
                className={styles.chip}
              >
                {STATE_LABEL[s]}
                {n > 0 ? ` ${n}` : ''}
              </Chip>
            )
          })}
          <span className={styles.dot} aria-hidden>
            ·
          </span>
          {LEVELS.map((lv) => (
            <Chip
              key={lv}
              selected={level === lv}
              onClick={() => setLevel(level === lv ? null : lv)}
              className={styles.chip}
              aria-label={`난이도 ${LEVEL_LABEL[lv]}`}
            >
              {LEVEL_LABEL[lv]}
            </Chip>
          ))}
        </div>
        <button
          ref={sortRef}
          type="button"
          className={styles.sort}
          aria-haspopup="menu"
          aria-expanded={sortOpen}
          onClick={() => setSortOpen((o) => !o)}
        >
          정렬: {SORT_LABEL[sort]} <Icon name="chevron-down" size={14} />
        </button>
        <Popover
          open={sortOpen}
          onClose={() => setSortOpen(false)}
          anchorRef={sortRef}
          width={160}
          role="menu"
          label="정렬"
        >
          <ul className={styles.sortMenu}>
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <li key={k}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={sort === k}
                  className={cx(styles.sortItem, sort === k && styles.sortActive)}
                  onClick={() => {
                    setSort(k)
                    setSortOpen(false)
                  }}
                >
                  {SORT_LABEL[k]}
                  {sort === k && <Icon name="check" size={14} />}
                </button>
              </li>
            ))}
          </ul>
        </Popover>
      </div>

      {continueExp && continueExp.progress && (
        <section className={styles.banner} aria-label="이어하기">
          <Mascot expression="default" size={56} alt="" />
          <div className={styles.bannerText}>
            <p className={styles.bannerTitle}>
              이어하기 · {continueExp.code} {continueExp.title}
              {openMission ? ` · 미션 ${missionNo(openMission.id)} 열림` : ''}
            </p>
            <ProgressBar
              value={continueExp.progress.trial}
              max={continueExp.progress.maxTrial}
              size="sm"
              className={styles.bannerBar}
            />
          </div>
          <Button
            to={
              openMission
                ? `/experiments/${continueExp.id}/missions/${openMission.id}/briefing`
                : `/experiments/${continueExp.id}/play`
            }
            size="lg"
          >
            이어하기
          </Button>
        </section>
      )}

      {list.loading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} height={320} />
          ))}
        </div>
      )}
      {list.error && (
        <EmptyState
          expression="confused"
          title="실험 목록을 불러오지 못했어요"
          description={list.error.message}
          action={<Button onClick={list.reload}>다시 시도</Button>}
        />
      )}
      {list.data && shown.length === 0 && (
        <EmptyState
          expression="confused"
          title="조건에 맞는 실험이 없어요"
          description="검색어나 필터를 바꿔 보세요"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQ('')
                setLevel(null)
                setStateFilter('all')
              }}
            >
              필터 초기화
            </Button>
          }
        />
      )}
      {list.data && shown.length > 0 && (
        <div className={styles.grid}>
          {shown.map((e) => {
            const st = states.get(e.id) ?? 'open'
            const copy = cardCopy(e, st, {
              voteDDay: e.vote ? dDay(e.vote.endsAt) : undefined,
              master: masters.has(e.id),
              treeNodeId: nodeFor(e.id),
              onVote: () => setVoteOpen(true),
            })
            return <ExperimentCard key={e.id} exp={e} state={st} {...copy} />
          })}
        </div>
      )}

      <VoteModal open={voteOpen} vote={vote} onClose={() => setVoteOpen(false)} onVoted={(v) => voteApi.setData(v)} />
    </div>
  )
}

/** "m2" → 2 */
const missionNo = (id: string) => id.replace(/\D/g, '') || id
