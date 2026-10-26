import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { getCurrentVote, getExperiments, getRadar, getRadarKeyword } from '../../api'
import type { ExperimentSummary } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import {
  Button,
  Character,
  EmptyState,
  Icon,
  Mascot,
  SegmentedControl,
  Skeleton,
  Sparkline,
  cx,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { VoteModal } from '../home/components/VoteModal'
import { daysUntil, experimentStatusLabel, sourceKinds } from '../home/format'
import { characterOfExperiment, votePercents } from '../home/vote'
import { BuzzScatter } from './components/BuzzScatter'
import { KeywordDrawer } from './components/KeywordDrawer'
import { updatedLabel, weekLabel } from './radarWeeks'
import styles from './RadarPage.module.css'

const KIND_CLASS = { 논문: 'paper', 코드: 'code', 커뮤니티: 'community' } as const

// W2 hub 담당 · 경로 /radar — D-07 기술 레이더 페이지 · D-08 키워드 상세 드로어(?keyword= 와 동기화)
export default function RadarPage() {
  const navigate = useNavigate()
  const { isMember } = useAuth()
  const [params, setParams] = useSearchParams()
  const keywordId = params.get('keyword')
  const radar = useApi((s) => getRadar(s), [])
  const exps = useApi((s) => getExperiments(undefined, s), [])
  const vote = useApi((s) => getCurrentVote(s), [])
  const [weekOffset, setWeekOffset] = useState('0')
  const [voteOpen, setVoteOpen] = useState(false)

  const keywords = useMemo(() => radar.data?.keywords ?? [], [radar.data])
  const expById = useMemo(() => new Map((exps.data ?? []).map((e) => [e.id, e])), [exps.data])
  const inList = keywords.find((k) => k.id === keywordId)
  // 목록에 없는 키워드(지난 주 등)는 상세 API로 받는다
  const single = useApi(keywordId && radar.data && !inList ? (s) => getRadarKeyword(keywordId, s) : null, [keywordId, !!radar.data, !!inList])
  const selected = inList ?? single.data
  const rank = inList ? keywords.indexOf(inList) + 1 : undefined

  const openKeyword = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('keyword', id)
    setParams(next)
  }
  const closeKeyword = () => {
    const next = new URLSearchParams(params)
    next.delete('keyword')
    setParams(next, { replace: true })
  }
  const startVote = () => {
    if (!isMember) navigate(`/login?returnTo=${encodeURIComponent('/radar')}`)
    else setVoteOpen(true)
  }

  const week = radar.data?.week
  const weekItems = week ? [0, -1, -2].map((o) => ({ value: String(o), label: `${weekLabel(week, o)} 주` })) : []
  const isCurrentWeek = weekOffset === '0'

  const experimentCell = (exp: ExperimentSummary | undefined) => {
    if (!exp) return <span className={styles.none}>—</span>
    const status = experimentStatusLabel(exp)
    return (
      <span className={styles.exp}>
        <Character id={exp.character} size={28} alt="" />
        <span>
          {exp.code}
          {status && exp.status !== 'open' ? ` ${status}` : ''}
        </span>
      </span>
    )
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        <Icon name="arrow-left" size={14} /> 홈
      </Link>
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>TECH RADAR{radar.data ? ` · ${updatedLabel(radar.data.updatedAt)} 업데이트` : ''}</p>
          <h1 className={styles.title}>이번 주 기술 레이더</h1>
          <p className={styles.desc}>arXiv · Hugging Face · GitHub · Hacker News 등 12개 출처의 지난 7일 글 3,412개에서 키워드를 뽑았어요.</p>
        </div>
        {weekItems.length > 0 && (
          <SegmentedControl items={weekItems} value={weekOffset} onChange={setWeekOffset} label="주차 선택" />
        )}
      </header>

      <div className={styles.layout}>
        <section className={styles.tableCard} aria-label="키워드 순위">
          <div className={styles.cardHead}>
            <h2 className={styles.h2}>키워드 Top {keywords.length || 10}</h2>
            <span className={styles.caption}>상승률 = 지난주 대비 언급량</span>
          </div>
          {radar.loading && !radar.data ? (
            <Skeleton shape="text" lines={8} />
          ) : radar.error ? (
            <EmptyState compact expression="confused" title="레이더를 불러오지 못했어요" action={<Button onClick={radar.reload}>다시 불러오기</Button>} />
          ) : !isCurrentWeek ? (
            <EmptyState compact expression="sleep" title="지난 주 레이더는 준비 중이에요" description="이번 주 결과를 먼저 확인해 보세요." action={<Button variant="secondary" onClick={() => setWeekOffset('0')}>이번 주로</Button>} />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">키워드</th>
                  <th scope="col">상승</th>
                  <th scope="col">{keywords[0]?.weeks.length ?? 4}주 추이</th>
                  <th scope="col">출처</th>
                  <th scope="col">우리 실험</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((k, i) => (
                  <tr
                    key={k.id}
                    className={cx(styles.row, k.id === keywordId && styles.rowOn)}
                    onClick={() => openKeyword(k.id)}
                  >
                    <td className={cx(styles.rank, i < 3 && styles.top)}>{i + 1}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.kwName}
                        onClick={(e) => {
                          e.stopPropagation()
                          openKeyword(k.id)
                        }}
                      >
                        {k.name}
                      </button>
                    </td>
                    <td className={k.changePct >= 0 ? styles.up : styles.down}>
                      {k.changePct >= 0 ? '▲' : '▼'} {Math.abs(Math.round(k.changePct))}%
                    </td>
                    <td>
                      <Sparkline values={k.weeks} width={120} height={24} label={`${k.name} 추이`} />
                    </td>
                    <td>
                      <span className={styles.kinds}>
                        {sourceKinds(k).map((kind) => (
                          <span key={kind} className={cx(styles.kind, styles[KIND_CLASS[kind]])}>
                            {kind}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td>{experimentCell(k.relatedExperimentId ? expById.get(k.relatedExperimentId) : undefined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className={styles.side}>
          <section className={styles.card} aria-label="화제성 × 성장률">
            <h2 className={styles.h2}>화제성 × 성장률</h2>
            {radar.data ? (
              <BuzzScatter keywords={keywords} selectedId={keywordId} onSelect={openKeyword} />
            ) : (
              <Skeleton height={240} />
            )}
          </section>

          <section className={cx(styles.card, styles.voteCard)} aria-label="다음 실험 투표">
            {vote.data ? (
              <>
                <h2 className={styles.h2}>다음 실험 투표 · D-{daysUntil(vote.data.endsAt)}</h2>
                <ul className={styles.voteList}>
                  {vote.data.options.map((o, i) => {
                    const ch = characterOfExperiment(o.id)
                    const p = votePercents(vote.data!).pct(o.votes)
                    return (
                      <li key={o.id} className={styles.voteRow}>
                        {ch && <Character id={ch} size={36} alt="" />}
                        <div className={styles.voteBody}>
                          <span className={styles.voteTitle}>
                            {o.title}
                            <span className={cx(styles.votePct, i === 0 && styles.votePctTop)}>{p}%</span>
                          </span>
                          <span className={styles.voteBar}>
                            <span className={cx(styles.voteFill, i === 0 && styles.voteFillTop)} style={{ width: `${p}%` }} />
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <Button block onClick={startVote}>
                  투표하기
                </Button>
                <span className={styles.caption}>
                  {votePercents(vote.data).total.toLocaleString('ko-KR')}명 참여 · 매주 일요일 마감
                </span>
              </>
            ) : vote.error ? (
              <EmptyState compact title="투표를 불러오지 못했어요" action={<Button onClick={vote.reload}>다시 시도</Button>} />
            ) : (
              <Skeleton shape="text" lines={4} />
            )}
          </section>

          <section className={styles.card} aria-label="AI 해설">
            <div className={styles.aiHead}>
              <Mascot expression="scientist" size={44} alt="" />
              <h2 className={styles.h2}>AI 해설</h2>
            </div>
            <p className={styles.aiText}>
              에이전트가 "도구를 부르는 법"과 "기억하는 법"이 동시에 뜨고 있어요. 두 기술은 팀 미션에서 옥토 · 메모로 함께 만날 수 있어요.
            </p>
          </section>
        </aside>
      </div>

      <KeywordDrawer
        open={!!keywordId}
        onClose={closeKeyword}
        keyword={selected}
        loading={radar.loading || single.loading}
        failed={!!single.error}
        onRetry={single.reload}
        rank={rank}
        week={week}
        experiment={selected?.relatedExperimentId ? expById.get(selected.relatedExperimentId) : undefined}
        related={keywords.filter((k) => k.id !== selected?.id).slice(0, 4)}
        onSelect={openKeyword}
        isMember={isMember}
      />
      <VoteModal open={voteOpen} onClose={() => setVoteOpen(false)} keywords={keywords} onVoted={(v) => vote.setData(v)} />
    </div>
  )
}
