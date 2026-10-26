import { Link, useParams } from 'react-router'
import { getCard, getExperiment, getRanking } from '../../api'
import type { ExperimentDetail, Mission } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import {
  Badge,
  Button,
  CHARACTERS,
  Character,
  EmptyState,
  Icon,
  Mascot,
  ProgressBar,
  Skeleton,
  Tag,
  cx,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { LEVEL_LABEL, pct, thumbBg } from './experimentMeta'
import styles from './ExperimentDetailPage.module.css'

const MISSION_STATE = {
  cleared: { label: '완료', tone: 'success' },
  open: { label: '열림', tone: 'solid' },
  locked: { label: '잠김', tone: 'neutral' },
} as const

const missionNo = (m: Mission, list: Mission[]) => list.indexOf(m) + 1

// W2 growth 담당 · 경로 /experiments/:id · G-02 실험 상세 (79:10727)
export default function ExperimentDetailPage() {
  const { id = '' } = useParams()
  const { isMember } = useAuth()
  const exp = useApi((signal) => getExperiment(id, signal), [id])

  if (exp.loading) {
    return (
      <div className={styles.page}>
        <Skeleton shape="text" width={80} />
        <div className={styles.hero}>
          <Skeleton shape="circle" width={340} />
          <Skeleton height={300} />
        </div>
        <Skeleton height={150} />
      </div>
    )
  }
  if (exp.error || !exp.data) {
    return (
      <EmptyState
        expression="confused"
        title={exp.error?.status === 404 ? '실험을 찾을 수 없어요' : '실험을 불러오지 못했어요'}
        description={exp.error?.message}
        action={
          <Button to="/lab" variant="secondary">
            실험실로
          </Button>
        }
      />
    )
  }
  return <Detail exp={exp.data} isMember={isMember} />
}

function Detail({ exp, isMember }: { exp: ExperimentDetail; isMember: boolean }) {
  const playable = exp.status === 'open' || exp.status === 'in_progress'
  const ranking = useApi(playable ? (signal) => getRanking(exp.id, signal) : null, [playable, exp.id])
  // 잠김 · 오픈 예정 실험은 기술 카드가 아직 없다
  const card = useApi(playable && exp.cardId ? (signal) => getCard(exp.cardId, signal) : null, [playable, exp.cardId])

  const missions = exp.missions
  const openMission = missions.find((m) => m.status === 'open')
  const cleared = missions.filter((m) => m.status === 'cleared')
  const lastCleared = cleared[cleared.length - 1]
  const firstMission = missions[0]
  const hasProgress = isMember && exp.progress && exp.status === 'in_progress'
  const briefing = (m: Mission) => `/experiments/${exp.id}/missions/${m.id}/briefing`

  // 주 버튼: 열린 미션 시작 → 없으면 첫 미션
  const primary = isMember ? (openMission ?? firstMission) : firstMission
  const progressLine = [
    ...cleared.map(
      (m) => `미션 ${missionNo(m, missions)} 완료${m.bestRate !== undefined ? ` ${pct(m.bestRate)}` : ''}`,
    ),
    ...(openMission ? [`미션 ${missionNo(openMission, missions)} 열림`] : []),
    ...(exp.progress ? [`Trial ${exp.progress.trial} / ${exp.progress.maxTrial}`] : []),
  ].join(' · ')

  const top = ranking.data?.filter((r) => !r.isMe).slice(0, 2) ?? []
  const me = ranking.data?.find((r) => r.isMe)
  const rankRows = me ? [...top, me] : (ranking.data?.slice(0, 3) ?? [])
  const cardTo = card.data && !card.data.unlocked ? `/experiments/${exp.id}/reveal` : `/cards/${exp.cardId}`

  return (
    <div className={styles.page}>
      <Link to="/lab" className={styles.back}>
        <Icon name="arrow-left" size={16} /> 실험실
      </Link>

      <section className={styles.hero}>
        <div className={styles.portrait} style={{ background: thumbBg(exp.thumbnailColor) }}>
          <Character id={exp.character} size={260} float alt="" />
        </div>
        <div className={styles.info}>
          <div className={styles.metaRow}>
            <span className={styles.code}>EXPERIMENT {exp.code}</span>
            <Badge tone="dark">{LEVEL_LABEL[exp.level]}</Badge>
            <Tag className={styles.tag}>{exp.tags.join(' · ')}</Tag>
          </div>
          <h1 className={styles.title}>{exp.title}</h1>
          <p className={styles.desc}>{exp.description}</p>
          <dl className={styles.stats}>
            <div>
              <dt>미션</dt>
              <dd>{missions.length}개</dd>
            </div>
            <div>
              <dt>미션당</dt>
              <dd>약 {exp.durationMin}분</dd>
            </div>
            {exp.stats.hundredthTrialRate > 0 && (
              <>
                <div>
                  <dt>1회차 → 100회차</dt>
                  <dd>
                    {pct(exp.stats.firstTrialRate)} → {pct(exp.stats.hundredthTrialRate)}
                  </dd>
                </div>
                <div>
                  <dt>평균 향상</dt>
                  <dd>
                    +{Math.round(exp.stats.hundredthTrialRate - exp.stats.firstTrialRate)}
                    %p
                  </dd>
                </div>
              </>
            )}
          </dl>

          {hasProgress && exp.progress && (
            <div className={styles.progress}>
              <Mascot expression="happy" size={48} alt="" />
              <div className={styles.progressText}>
                <p className={styles.progressTitle}>내 진행 · {CHARACTERS[exp.character].name} 성장 중</p>
                <ProgressBar
                  value={exp.progress.trial}
                  max={exp.progress.maxTrial}
                  size="sm"
                  className={styles.progressBar}
                />
                <p className={styles.progressLine}>{progressLine}</p>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            {playable && primary && (
              <Button to={briefing(primary)} size="lg" iconRight={<Icon name="arrow-right" size={18} />}>
                미션 {missionNo(primary, missions)} 시작하기
              </Button>
            )}
            {playable && isMember && lastCleared && (
              <Button to={`/experiments/${exp.id}/play`} variant="secondary" size="lg">
                미션 {missionNo(lastCleared, missions)} 이어하기
              </Button>
            )}
            {exp.status === 'coming_soon' && (
              <Button to={`/experiments/${exp.id}/concept`} size="lg">
                컨셉 미리 보기
              </Button>
            )}
            {exp.status === 'locked' && (
              <Button to="/tree" variant="secondary" size="lg">
                해금 조건 보기
              </Button>
            )}
            {playable && exp.cardId && (
              <Link to={cardTo} className={styles.textLink}>
                기술 카드 보기
              </Link>
            )}
          </div>
          {exp.unlockCondition && exp.status !== 'open' && exp.status !== 'in_progress' && (
            <p className={styles.unlock}>
              <Icon name="lock" size={14} /> {exp.unlockCondition}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="missions-title">
        <h2 id="missions-title" className={styles.sectionTitle}>
          미션
        </h2>
        <div className={styles.missions}>
          {missions.map((m, i) => {
            const st = MISSION_STATE[m.status]
            const prev = missions[i - 1]
            const caption =
              m.status === 'cleared'
                ? `최종 ${m.bestRate !== undefined ? pct(m.bestRate) : '-'}`
                : m.status === 'open'
                  ? prev
                    ? `NEW · 미션 ${i} 학습 이어받기`
                    : `성공 기준 ${pct(m.successThreshold)}`
                  : prev
                    ? `미션 ${i} 성공률 ${pct(m.successThreshold)} 이상`
                    : '잠김'
            const body = (
              <>
                <div className={styles.missionHead}>
                  <span className={styles.missionNo}>MISSION {i + 1}</span>
                  <Badge tone={st.tone} size="md">
                    {st.label}
                  </Badge>
                </div>
                <h3 className={styles.missionTitle}>{m.title}</h3>
                <p className={styles.missionGoal}>{m.goal}</p>
                <p className={cx(styles.missionCaption, m.status === 'open' && styles.missionNew)}>{caption}</p>
              </>
            )
            const cls = cx(styles.mission, styles[`m-${m.status}`])
            return m.status !== 'locked' && playable ? (
              <Link key={m.id} to={briefing(m)} className={cls}>
                {body}
              </Link>
            ) : (
              <div key={m.id} className={cls}>
                {body}
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.bottom}>
        <div className={styles.learn}>
          <h2 className={styles.boxTitle}>이 실험에서 배워요</h2>
          <ul className={styles.learnList}>
            {exp.principle.split(' · ').map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        {playable ? (
          <Link to={cardTo} className={styles.techCard}>
            <span className={styles.techEyebrow}>TECH CARD</span>
            {card.data ? <p className={styles.techTitle}>{card.data.title}</p> : <Skeleton shape="text" width={200} />}
            <p className={styles.techCaption}>반전을 보면 열려요 · 읽으면 "기술 카드 수집가" +1</p>
          </Link>
        ) : (
          <div className={styles.techCard}>
            <span className={styles.techEyebrow}>TECH CARD</span>
            <p className={styles.techTitle}>???</p>
            <p className={styles.techCaption}>실험이 열리면 기술 카드도 함께 공개돼요</p>
          </div>
        )}

        {playable && (
          <div className={styles.ranking}>
            <h2 className={styles.boxTitle}>이번 주 랭킹</h2>
            {ranking.loading && <Skeleton shape="text" lines={3} />}
            {ranking.data && (
              <ol className={styles.rankList}>
                {rankRows.map((r) => (
                  <li key={`${r.rank}-${r.nickname}`} className={cx(r.isMe && styles.me)}>
                    <span className={styles.rankNo}>{r.rank}</span>
                    <span className={styles.rankName}>
                      {r.nickname}
                      {r.isMe ? ' (나)' : ''}
                    </span>
                    <span className={styles.rankRate}>{pct(r.successRate)}</span>
                  </li>
                ))}
              </ol>
            )}
            <Link to="/ranking" className={styles.textLink}>
              전체 랭킹
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
