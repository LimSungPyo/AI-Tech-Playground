import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { getExperiment, getRanking } from '../../api'
import type { RankingRow } from '../../api'
import { useAuth } from '../../auth/useAuth'
import { Button, Character, EmptyState, GlassCard, IconButton, SegmentedControl, Skeleton, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import { ReportModal } from './components/ReportModal'
import styles from './RankingPage.module.css'

// 랭킹 대상 탭. 미션 · 기간은 GET /experiments/{id}/ranking 쿼리로 넘긴다
const BOARDS = [
  { key: '001-m1', label: '미션 1 · 먹이 찾기', eyebrow: '#001 미션 1', experiment: '001', mission: 'm1' },
  { key: '001-m2', label: '미션 2 · 장애물', eyebrow: '#001 미션 2', experiment: '001', mission: 'm2' },
  { key: '000', label: '#000 웜이', eyebrow: '#000 미션 1', experiment: '000', mission: 'm1' },
  { key: '007', label: '#007 패롯', eyebrow: '#007 미션 1', experiment: '007', mission: 'm1' },
]

const PERIODS = [
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'all', label: '전체' },
  { value: 'friends', label: '친구' },
] as const
type Period = (typeof PERIODS)[number]['value']

const firstSuccess = (r: RankingRow) => (r.firstSuccessTrial ? `T${r.firstSuccessTrial}` : '—')

const PODIUM_ORDER = [1, 0, 2] // 2위 · 1위 · 3위

// W2 world 담당 · 경로 /ranking — H-05 랭킹 전체 · H-06 닉네임 신고
export default function RankingPage() {
  const { isMember } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const board = BOARDS.find((b) => b.key === params.get('board')) ?? BOARDS[0]
  const [period, setPeriod] = useState<Period>('week')
  const [reporting, setReporting] = useState<RankingRow>()
  const ranking = useApi(
    (signal) => getRanking(board.experiment, signal, { mission: board.mission, period }),
    [board.experiment, board.mission, period],
  )
  const experiment = useApi((signal) => getExperiment(board.experiment, signal), [board.experiment])
  const participants = experiment.data?.participants

  const rows = ranking.data ?? []
  const podium = rows.filter((r) => r.rank <= 3)
  const rest = rows.filter((r) => r.rank > 3 && !(r.isMe && isMember))
  const me = isMember ? rows.find((r) => r.isMe) : undefined
  const above = me ? [...rows].filter((r) => r.rank < me.rank).sort((a, b) => b.rank - a.rank)[0] : undefined
  const periodLabel = PERIODS.find((p) => p.value === period)!.label

  const report = (row: RankingRow) => {
    if (!isMember) {
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`)
      return
    }
    setReporting(row)
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>RANKING · {board.eyebrow}</span>
          <h1 className={styles.h1}>{periodLabel} 랭킹</h1>
          <p className={styles.lead}>
            매주 월요일 00:00 초기화{participants ? ` · ${participants.toLocaleString('ko-KR')}명 참여` : ''}
          </p>
        </div>
        <SegmentedControl label="기간" items={[...PERIODS]} value={period} onChange={setPeriod} />
      </header>

      <div className={styles.toolbar}>
        <div className={styles.boards} role="tablist" aria-label="랭킹 대상">
          {BOARDS.map((b) => (
            <button
              key={b.key}
              type="button"
              role="tab"
              aria-selected={b.key === board.key}
              className={cx(styles.board, b.key === board.key && styles.boardOn)}
              onClick={() => setParams({ board: b.key })}
            >
              {b.label}
            </button>
          ))}
        </div>
        <span className={styles.rule}>기준: 최종 성공률 → 첫 성공 회차</span>
      </div>

      {ranking.loading && !ranking.data ? (
        <Skeleton height={360} />
      ) : ranking.error ? (
        <EmptyState
          expression="confused"
          title="랭킹을 불러오지 못했어요"
          description={ranking.error.message}
          action={<Button onClick={ranking.reload}>다시 시도</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState expression="sleep" title="아직 랭킹이 없어요" description="첫 기록의 주인공이 되어 보세요." />
      ) : (
        <>
          <div className={styles.podium} aria-label="1~3위">
            {PODIUM_ORDER.map((i) => podium[i]).map(
              (r) =>
                r && (
                  <div key={r.rank} className={cx(styles.place, styles[`place${r.rank}`])}>
                    <span className={styles.placeAvatar}>
                      <Character id={r.character} size={52} />
                    </span>
                    <strong className={styles.placeName}>{r.nickname}</strong>
                    <span className={styles.placeRate}>{Math.round(r.successRate)}%</span>
                    <span className={styles.block}>{r.rank}</span>
                  </div>
                ),
            )}
          </div>

          <GlassCard padding="md" radius="lg" className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>닉네임</th>
                  <th>성공률</th>
                  <th>첫 성공</th>
                  <th>훈련</th>
                  <th aria-label="메뉴" />
                </tr>
              </thead>
              <tbody>
                {rest.map((r) => (
                  <tr key={r.rank}>
                    <td className={styles.rank}>{r.rank}</td>
                    <td className={styles.nick}>{r.nickname}</td>
                    <td>{Math.round(r.successRate)}%</td>
                    <td>{firstSuccess(r)}</td>
                    <td>{r.trials}</td>
                    <td className={styles.more}>
                      {!r.isMe && <IconButton icon="more" label={`${r.nickname} 신고`} variant="ghost" size="sm" onClick={() => report(r)} />}
                    </td>
                  </tr>
                ))}
                {me && (
                  <>
                    {rest.length > 0 && me.rank > rest[rest.length - 1].rank + 1 && (
                      <tr aria-hidden>
                        <td colSpan={6} className={styles.gap}>
                          ⋯
                        </td>
                      </tr>
                    )}
                    <tr className={styles.me}>
                      <td className={styles.rank}>{me.rank}</td>
                      <td className={styles.nick}>{me.nickname} (나)</td>
                      <td>{Math.round(me.successRate)}%</td>
                      <td>{firstSuccess(me)}</td>
                      <td>{me.trials}</td>
                      <td />
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </GlassCard>

          {me && (
            <div className={styles.cta}>
              <span>
                {above && above.successRate > me.successRate
                  ? `바로 위 ${above.rank}위까지 ${Math.round(above.successRate - me.successRate)}%p 남았어요`
                  : '바로 위 순위와 성공률이 같아요 · 첫 성공 회차를 앞당기면 올라가요'}
                {` · ${board.label.split(' · ')[0]} 재도전으로 기록을 올릴 수 있어요`}
              </span>
              <Button to={`/experiments/${board.experiment}/missions/${board.mission}/briefing`}>재도전</Button>
            </div>
          )}
        </>
      )}

      <ReportModal row={reporting} board={board.eyebrow} onClose={() => setReporting(undefined)} />
    </div>
  )
}
