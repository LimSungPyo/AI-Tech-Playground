import { Link, useLocation, useSearchParams } from 'react-router'
import { getDex, getExperiment, getExperiments, getHistory, getMyBadges, getRanking } from '../../api'
import type { DexEntry, ExperimentSummary, HistoryRecord, Mission } from '../../api'
import { useAuth } from '../../auth/useAuth'
import { Button, Character, EmptyState, GlassCard, Skeleton, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import { DexCardModal } from './components/DexCardModal'
import styles from './DexPage.module.css'

/** 비회원 맛보기로 열어 보여 줄 카드 수 */
const PREVIEW = 2

interface RecordRow {
  id: string
  experimentId: string
  date: string
  experiment: string
  mission: string
  trial: number
  rate: number
  status: '완료' | '진행 중' | '잠김'
}

const RECORD_STATUS: Record<HistoryRecord['status'], RecordRow['status']> = {
  cleared: '완료',
  in_progress: '진행 중',
  locked: '잠김',
}

// 최근 등록순: 획득한 카드(획득일 내림차순) → 미획득
function sortEntries(list: DexEntry[]) {
  return [...list].sort((a, b) => {
    if (a.obtained !== b.obtained) return a.obtained ? -1 : 1
    return (b.obtainedAt ?? '').localeCompare(a.obtainedAt ?? '')
  })
}

/** GET /me/history records → B-11 내 실험 기록 표(최근 플레이순) */
function toRows(records: HistoryRecord[], exps: ExperimentSummary[], missions: Record<string, Mission[]>): RecordRow[] {
  return [...records]
    .sort((a, b) => b.lastPlayedAt.localeCompare(a.lastPlayedAt))
    .map((r) => {
      const e = exps.find((x) => x.id === r.experimentId)
      const d = r.lastPlayedAt
      return {
        id: `${r.experimentId}-${r.missionId}`,
        experimentId: r.experimentId,
        date: `${d.slice(5, 7)}.${d.slice(8, 10)}`,
        experiment: e ? `${e.code} ${e.title}` : `#${r.experimentId}`,
        mission: missions[r.experimentId]?.find((m) => m.id === r.missionId)?.title ?? r.missionId,
        trial: r.trial,
        rate: Math.round(r.bestRate),
        status: RECORD_STATUS[r.status],
      }
    })
}

/** 기록에 나온 실험들의 미션 이름(GET /experiments/{id}) */
async function loadMissions(ids: string[], signal: AbortSignal) {
  const details = await Promise.all(ids.map((id) => getExperiment(id, signal)))
  return Object.fromEntries(details.map((d) => [d.id, d.missions])) as Record<string, Mission[]>
}

function downloadCsv(rows: RecordRow[]) {
  const head = ['날짜', '실험', '미션', '회차', '최고 성공률', '상태']
  const body = rows.map((r) => [r.date, r.experiment, r.mission, r.trial, `${r.rate}%`, r.status])
  const csv = [head, ...body].map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'my-experiments.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// W2 world 담당 · 경로 /dex — B-11 AI 도감 · H-02 카드 상세
export default function DexPage() {
  const { isMember, status } = useAuth()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const dex = useApi((signal) => getDex(signal), [])
  const exps = useApi((signal) => getExperiments({}, signal), [])
  const history = useApi(isMember ? (signal) => getHistory(signal) : null, [isMember])
  const badges = useApi(isMember ? (signal) => getMyBadges(signal) : null, [isMember])
  const ranking = useApi((signal) => getRanking('001', signal, { period: 'week' }), [])
  const records = history.data?.records ?? []
  const recordIds = [...new Set(records.map((r) => r.experimentId))].join(',')
  const missions = useApi(recordIds ? (signal) => loadMissions(recordIds.split(','), signal) : null, [recordIds])

  const guest = status === 'guest'
  const loginTo = `/login?returnTo=${encodeURIComponent(location.pathname)}`
  const entries = sortEntries(dex.data ?? [])
  // 비회원은 앞 몇 장만 맛보기로 보여 주고 나머지는 '?'
  const visible = (e: DexEntry, i: number) => (guest ? i < PREVIEW : e.obtained)
  const obtained = entries.filter(visible).length
  const colorOf = (id: string) => exps.data?.find((e) => e.id === id)?.thumbnailColor

  const openId = params.get('card')
  const openIndex = entries.findIndex((e) => e.id === openId)
  const openEntry = openIndex >= 0 ? entries[openIndex] : undefined
  const setCard = (id: string | null) =>
    setParams((p) => {
      if (id) p.set('card', id)
      else p.delete('card')
      return p
    })
  const move = (step: 1 | -1) => {
    const next = entries[(openIndex + step + entries.length) % entries.length]
    if (next) setCard(next.id)
  }
  const shown = (e: DexEntry) => {
    const i = entries.indexOf(e)
    return guest && i >= PREVIEW ? { ...e, obtained: false, obtainedAt: undefined } : e
  }

  const rows = toRows(records, exps.data ?? [], missions.data ?? {})
  const top = ranking.data ?? []
  const me = top.find((r) => r.isMe)
  const board = [...top.filter((r) => !r.isMe).slice(0, me ? 4 : 5), ...(me ? [me] : [])]

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>AI DEX</span>
        <h1 className={styles.h1}>AI 도감 · 내 실험 기록</h1>
        <p className={styles.lead}>훈련한 AI를 카드로 모으고, 다른 사용자와 성능을 비교해 보세요.</p>
        <div className={styles.toolbar}>
          <nav className={styles.tabs} aria-label="도감 메뉴">
            <a href="#dex-grid" className={cx(styles.tab, styles.tabOn)}>
              AI 도감 {obtained} / {entries.length || '–'}
            </a>
            <a href="#dex-records" className={styles.tab}>
              내 실험 기록
            </a>
            <Link to="/ranking" className={styles.tab}>
              랭킹
            </Link>
          </nav>
          <span className={styles.sort}>정렬: 최근 등록순</span>
        </div>
      </header>

      {guest && (
        <div className={styles.guest}>
          <span>맛보기 도감이에요. 로그인하면 내가 훈련한 AI가 카드로 모여요.</span>
          <Button to={loginTo} size="sm">
            로그인하고 내 도감 만들기
          </Button>
        </div>
      )}

      <section id="dex-grid" className={styles.grid} aria-label="AI 도감 카드">
        {dex.loading && !dex.data ? (
          Array.from({ length: 8 }, (_, i) => <Skeleton key={i} height={300} />)
        ) : dex.error ? (
          <EmptyState
            className={styles.full}
            expression="confused"
            title="도감을 불러오지 못했어요"
            description={dex.error.message}
            action={<Button onClick={dex.reload}>다시 시도</Button>}
          />
        ) : (
          entries.map((e, i) => {
            const open = visible(e, i)
            return (
              <button
                key={e.id}
                type="button"
                className={cx(styles.card, !open && styles.cardLocked)}
                onClick={() => setCard(e.id)}
              >
                <span className={styles.art}>
                  {open ? <Character id={e.character} size={140} /> : <span className={styles.q}>?</span>}
                </span>
                <span className={styles.cardMeta}>
                  <span>No.{e.experimentId}</span>
                  {open && <span>EXP #{e.experimentId}</span>}
                </span>
                <strong className={styles.cardName}>{e.name}</strong>
                {open ? (
                  <span className={styles.cardStats}>
                    {e.bestRate !== undefined && <em>성공률 {Math.round(e.bestRate)}%</em>}
                    {e.trials !== undefined && <span>Trial {e.trials}</span>}
                    <span>{e.title}</span>
                  </span>
                ) : (
                  <span className={styles.cardHint}>{e.meetCondition}</span>
                )}
              </button>
            )
          })
        )}
      </section>

      <div className={styles.bottom}>
        <GlassCard padding="md" radius="lg" className={styles.records} id="dex-records">
          <div className={styles.panelHead}>
            <h2 className={styles.h2}>내 실험 기록</h2>
            {isMember && rows.length > 0 && (
              <button type="button" className={styles.csv} onClick={() => downloadCsv(rows)}>
                CSV 내보내기
              </button>
            )}
          </div>
          {!isMember ? (
            <EmptyState
              compact
              expression="happy"
              title="로그인하면 내 실험 기록이 쌓여요"
              action={
                <Button to={loginTo} size="sm">
                  로그인
                </Button>
              }
            />
          ) : history.loading && !history.data ? (
            <Skeleton shape="text" lines={4} />
          ) : rows.length === 0 ? (
            <EmptyState
              compact
              expression="sleep"
              title="아직 기록이 없어요"
              action={
                <Button to="/lab" size="sm">
                  실험실 가기
                </Button>
              }
            />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>실험</th>
                  <th>미션</th>
                  <th>회차</th>
                  <th>최고 성공률</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.experiment}</td>
                    <td>{r.mission}</td>
                    <td>{r.trial}</td>
                    <td>{r.rate > 0 ? `${r.rate}%` : '–'}</td>
                    <td>
                      {r.status === '진행 중' ? (
                        <Link to={`/experiments/${r.experimentId}/play`} className={styles.live}>
                          진행 중
                        </Link>
                      ) : (
                        r.status
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>

        <GlassCard padding="md" radius="lg" className={styles.rank}>
          <div className={styles.panelHead}>
            <h2 className={styles.h2}>랭킹 · EXPERIMENT #001</h2>
            <Link to="/ranking" className={styles.week}>
              이번 주
            </Link>
          </div>
          {ranking.loading && !ranking.data ? (
            <Skeleton shape="text" lines={5} />
          ) : ranking.error ? (
            <EmptyState compact expression="confused" title="랭킹을 불러오지 못했어요" />
          ) : (
            <ol className={styles.board}>
              {board.map((r) => (
                <li key={r.rank} className={cx(styles.boardRow, r.isMe && isMember && styles.boardMe)}>
                  <span className={styles.boardRank}>{r.rank}</span>
                  <span className={styles.boardName}>
                    {r.nickname}
                    {r.isMe && isMember ? ' (나)' : ''}
                  </span>
                  <strong>{Math.round(r.successRate)}%</strong>
                  <span className={styles.boardTrials}>{r.trials}회</span>
                </li>
              ))}
            </ol>
          )}
        </GlassCard>
      </div>

      <DexCardModal
        entry={openEntry ? shown(openEntry) : undefined}
        color={openEntry ? colorOf(openEntry.experimentId) : undefined}
        badges={badges.data ?? []}
        loginTo={guest ? loginTo : undefined}
        onClose={() => setCard(null)}
        onMove={move}
      />
    </div>
  )
}
