import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getHome, getNotifications } from '../../api'
import type { MeHome, Recommendation } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import {
  Badge,
  Button,
  CHARACTERS,
  Character,
  EmptyState,
  Icon,
  ProgressBar,
  SectionHeader,
  Skeleton,
  WeekGrass,
  cx,
  useModal,
  useToast,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { CHARACTER_TINT } from './characterTint'
import { ContinueChoiceModal } from './components/ContinueChoiceModal'
import type { ContinueChoice } from './components/ContinueChoiceModal'
import { PartnerSheet } from './components/PartnerSheet'
import { ReasonPopover } from './components/ReasonPopover'
import { StreakPopover } from './components/StreakPopover'
import { TechDropModal } from './components/TechDropModal'
import { VoteModal } from './components/VoteModal'
import { FirstHome } from './FirstHome'
import {
  formatLastPlayed,
  formatMinutes,
  formatToday,
  readStore,
  risingWeeks,
  signedPct,
  writeStore,
} from './format'
import { characterOfExperiment } from './vote'
import styles from './MemberHome.module.css'

const NEWS_SHOWN_KEY = 'atp.home.newsShown'
const AUTO_CONTINUE_KEY = 'atp.home.autoContinue'
const choiceKey = (expId: string, missionId: string) => `atp.home.missionChoice.${expId}.${missionId}`

const REC_ACTION: Record<Recommendation['kind'], string> = {
  continue: '도전하기',
  in_progress: '이어하기',
  card: '읽기',
  experiment: '시작하기',
}

/** 미션 id("m2") → "미션 2" */
const missionNo = (id: string) => (/^m(\d+)$/.exec(id) ? `미션 ${id.slice(1)}` : '새 미션')

type Popup = 'streak' | 'choice' | 'partner' | 'reason' | 'vote' | 'drop' | null

/** 08:M-03 알림 배너 · 토스트 — 홈 진입 시 새 소식을 세션당 한 번 */
function useNewsToast() {
  const toast = useToast()
  const navigate = useNavigate()
  useEffect(() => {
    if (readStore('session', NEWS_SHOWN_KEY)) return
    const ctrl = new AbortController()
    getNotifications(ctrl.signal)
      .then((list) => {
        writeStore('session', NEWS_SHOWN_KEY, '1')
        list
          .filter((n) => !n.read)
          .slice(0, 3)
          .forEach((n, i) => {
            const target = n.target
            window.setTimeout(() => {
              toast.show({
                title: n.title,
                description: n.body,
                action: target && target !== '/' ? { label: '보기', onClick: () => navigate(target) } : undefined,
                duration: target ? 6000 : 3000,
              })
            }, i * 400)
          })
      })
      .catch(() => {
        // 새 소식은 못 받아도 홈은 그대로 보여준다
      })
    return () => ctrl.abort()
  }, [toast, navigate])
}

/** B-02 로그인 홈(허브). 첫 실험 전이면 E-03 */
export function MemberHome() {
  const { user } = useAuth()
  if (user && !user.hasPlayed) return <FirstHome />
  return <HubHome />
}

function HubHome() {
  const navigate = useNavigate()
  const modal = useModal()
  const { data, error, loading, reload, setData } = useApi((s) => getHome(s), [])
  const [popup, setPopup] = useState<Popup>(null)
  const streakRef = useRef<HTMLButtonElement>(null)
  const reasonRef = useRef<HTMLButtonElement>(null)
  useNewsToast()

  if (loading && !data) return <HubSkeleton />
  if (error || !data) {
    return (
      <EmptyState
        expression="confused"
        title="홈을 불러오지 못했어요"
        description={error?.message ?? '잠시 후 다시 시도해 주세요.'}
        action={<Button onClick={reload}>다시 불러오기</Button>}
      />
    )
  }
  // me/home의 사용자가 첫 실험 전이면 E-03
  if (!data.user.hasPlayed) return <FirstHome />

  const { user, continue: cont, partner, week, recommendations, radar, techDrop, team } = data
  const exp = cont.experiment
  const progress = exp.progress
  const expChar = CHARACTERS[exp.character]
  const playPath = `/experiments/${exp.id}/play`

  const startContinue = async () => {
    const autoContinue = readStore('local', AUTO_CONTINUE_KEY) === '1'
    if (cont.mission.status === 'open' && !readStore('local', choiceKey(exp.id, cont.mission.id)) && !autoContinue) {
      setPopup('choice')
      return
    }
    if (autoContinue) {
      navigate(playPath)
      return
    }
    // 08:M-04 이어하기 · 액션 시트
    const pick = await modal.actionSheet({
      title: '어디서부터 할까요?',
      message: progress ? `지난번 Trial ${progress.trial}에서 멈췄어요` : undefined,
      options: [
        { value: 'continue', label: '이어하기', tone: 'primary' },
        { value: 'restart', label: '처음부터' },
      ],
      cancelLabel: '취소',
    })
    if (pick === 'continue') navigate(playPath)
    else if (pick === 'restart') navigate(`${playPath}?restart=1`)
  }

  const onPickChoice = (choice: ContinueChoice, remember: boolean) => {
    writeStore('local', choiceKey(exp.id, cont.mission.id), choice)
    if (remember) writeStore('local', AUTO_CONTINUE_KEY, '1')
    setPopup(null)
    navigate(choice === 'new' ? `/experiments/${exp.id}/missions/${cont.mission.id}/briefing` : playPath)
  }

  const topKw = radar[0]
  const topKwChar = topKw?.relatedExperimentId ? characterOfExperiment(topKw.relatedExperimentId) : undefined
  const dropChar = characterOfExperiment(techDrop.code)

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div>
          <p className={styles.date}>{formatToday()}</p>
          <h1 className={styles.greeting}>
            {user.nickname}님, 다시 왔네요! {expChar.name}가 기다리고 있어요
          </h1>
        </div>
        <button
          ref={streakRef}
          type="button"
          className={styles.streak}
          aria-haspopup="dialog"
          aria-expanded={popup === 'streak'}
          onClick={() => setPopup(popup === 'streak' ? null : 'streak')}
        >
          <span className={styles.streakDot} aria-hidden />
          {user.streakDays}일 연속 학습 중
        </button>
      </header>

      <div className={styles.hero}>
        <section className={styles.continue} aria-label="이어하기">
          <div className={styles.thumb} style={{ background: CHARACTER_TINT[exp.character] }}>
            <Character id={exp.character} size={190} alt={expChar.name} />
          </div>
          <div className={styles.contBody}>
            <div className={styles.contEyebrow}>
              <span className={styles.kicker}>CONTINUE</span>
              {cont.mission.status === 'open' && <Badge tone="success">{missionNo(cont.mission.id)} 해금됨!</Badge>}
            </div>
            <h2 className={styles.contTitle}>
              {exp.code} {exp.title}
            </h2>
            {progress && (
              <div className={styles.progressRow}>
                <ProgressBar value={progress.trial} max={progress.maxTrial} className={styles.progress} />
                <span className={styles.trial}>
                  Trial {progress.trial} / {progress.maxTrial}
                </span>
              </div>
            )}
            <dl className={styles.stats}>
              {progress && (
                <div>
                  <dt>현재 성공률</dt>
                  <dd>{Math.round(progress.successRate)}%</dd>
                </div>
              )}
              <div>
                <dt>어제보다</dt>
                <dd className={cx(cont.deltaPct >= 0 ? styles.up : styles.down)}>{signedPct(cont.deltaPct, '%p')}</dd>
              </div>
              <div>
                <dt>마지막 플레이</dt>
                <dd>{formatLastPlayed(cont.lastPlayedAt)}</dd>
              </div>
            </dl>
            <Link to={`${playPath}?why=last`} className={styles.why}>
              <span className={styles.whyTag}>WHY?</span>
              <span>{cont.lastWhy}</span>
            </Link>
            <div className={styles.contActions}>
              <Button size="lg" onClick={startContinue} iconRight={<Icon name="arrow-right" size={18} />}>
                이어서 훈련하기
              </Button>
              <Button variant="secondary" to={`/experiments/${exp.id}/missions/${cont.mission.id}/briefing`}>
                {missionNo(cont.mission.id)} 브리핑 보기
              </Button>
              <Button variant="secondary" to={`/experiments/${exp.id}/report`}>
                리포트
              </Button>
            </div>
          </div>
        </section>

        <div className={styles.side}>
          <button type="button" className={styles.partner} onClick={() => setPopup('partner')} aria-haspopup="dialog">
            <span className={styles.partnerHead}>
              <span className={styles.partnerAvatar} style={{ background: CHARACTER_TINT[partner.character] }}>
                <Character id={partner.character} size={48} alt="" />
              </span>
              <span>
                <strong className={styles.partnerName}>파트너 {CHARACTERS[partner.character].name}</strong>
                <span className={styles.partnerLv}>
                  Lv.{partner.level} {partner.title}
                </span>
              </span>
            </span>
            <span className={styles.quote}>"{partner.message}"</span>
          </button>

          <Link to="/my/history" className={styles.week} aria-label={`이번 주 학습 ${formatMinutes(week.totalMinutes)} · 학습 기록 보기`}>
            <span className={styles.weekHead}>
              <strong>이번 주</strong>
              <span className={styles.weekTotal}>{formatMinutes(week.totalMinutes)}</span>
            </span>
            <WeekGrass days={week.days} size={32} className={styles.grass} />
          </Link>
        </div>
      </div>

      <section className={styles.section}>
        <SectionHeader
          title="오늘의 추천"
          description="AI 안내자가 기록을 보고 골랐어요"
          inlineDescription
          right={
            <button
              ref={reasonRef}
              type="button"
              className={styles.reasonLink}
              aria-haspopup="dialog"
              aria-expanded={popup === 'reason'}
              onClick={() => setPopup(popup === 'reason' ? null : 'reason')}
            >
              WHY? 추천 이유
            </button>
          }
        />
        <ul className={styles.recs}>
          {recommendations.map((r) => (
            <li key={r.id} className={styles.rec}>
              <Character id={r.character} size={64} alt="" />
              <div className={styles.recBody}>
                <Badge tone="indigo">{r.badge}</Badge>
                <strong className={styles.recTitle}>{r.title}</strong>
                <span className={styles.recText}>{r.body}</span>
                <span className={styles.recMeta}>· {r.meta}</span>
              </div>
              <Button variant="secondary" size="sm" to={r.target}>
                {REC_ACTION[r.kind]}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.lower}>
        <section className={styles.radar} aria-label="이번 주 기술 레이더">
          <SectionHeader
            title={
              <span className={styles.radarTitle}>
                이번 주 기술 레이더 <Badge tone="neutral">매주 월요일 업데이트</Badge>
              </span>
            }
            link={{ to: '/radar', label: '전체 보기' }}
            level={3}
          />
          <div className={styles.kwChips}>
            {radar.map((k) => (
              <Link key={k.id} to={`/radar?keyword=${encodeURIComponent(k.id)}`} className={styles.kwChip}>
                {k.name}
                <span className={k.changePct >= 0 ? styles.up : styles.down}>
                  {k.changePct >= 0 ? '▲' : '▼'} {signedPct(k.changePct)}
                </span>
              </Link>
            ))}
          </div>
          {topKw && (
            <p className={styles.radarNote}>
              "{topKw.name}"이 {Math.max(1, risingWeeks(topKw.weeks))}주 연속 {topKw.changePct >= 0 ? '상승' : '하락'} 중이에요.
              {topKwChar && topKw.relatedExperimentId
                ? ` ${CHARACTERS[topKwChar].name} 실험(#${topKw.relatedExperimentId}) 오픈을 앞당길지 투표해 주세요.`
                : ` 다음에 열릴 실험을 투표해 주세요.`}
            </p>
          )}
          <Button onClick={() => setPopup('vote')} className={styles.voteBtn}>
            다음 실험 투표하기
          </Button>
        </section>

        <button type="button" className={styles.drop} onClick={() => setPopup('drop')} aria-haspopup="dialog">
          <span className={styles.dropHead}>
            {dropChar && <Character id={dropChar} size={56} alt="" />}
            <span>
              <span className={styles.dropEyebrow}>TECH DROP · D-{techDrop.dDay}</span>
              <strong className={styles.dropTitle}>
                #{techDrop.code} {techDrop.title}
              </strong>
            </span>
          </span>
          <span className={styles.dropText}>
            {techDrop.subscribed
              ? '오픈 알림을 신청했어요. 열리면 가장 먼저 알려드릴게요.'
              : '오픈 알림을 신청하면 열리는 날 가장 먼저 알려드릴게요.'}
          </span>
        </button>
      </div>

      {team.ready && (
        <section className={styles.team} aria-label="팀 미션">
          <span className={styles.teamTag}>TEAM READY</span>
          <p className={styles.teamText}>{team.text}</p>
          <Button variant="secondary" to={`/team-missions/${team.missionId}`}>
            팀 미션 보기
          </Button>
        </section>
      )}

      <StreakPopover
        open={popup === 'streak'}
        onClose={() => setPopup(null)}
        anchorRef={streakRef}
        streakDays={user.streakDays}
        days={week.days}
        onContinue={startContinue}
      />
      <ContinueChoiceModal open={popup === 'choice'} data={cont} onClose={() => setPopup(null)} onPick={onPickChoice} />
      <PartnerSheet open={popup === 'partner'} onClose={() => setPopup(null)} home={data} />
      <ReasonPopover open={popup === 'reason'} onClose={() => setPopup(null)} anchorRef={reasonRef} recommendations={recommendations} />
      <VoteModal open={popup === 'vote'} onClose={() => setPopup(null)} keywords={radar} />
      <TechDropModal
        open={popup === 'drop'}
        onClose={() => setPopup(null)}
        code={techDrop.code}
        onSubscribed={() =>
          setData((d: MeHome | undefined) => (d ? { ...d, techDrop: { ...d.techDrop, subscribed: true } } : d))
        }
      />
    </div>
  )
}

function HubSkeleton() {
  return (
    <div className={styles.page} aria-busy>
      <Skeleton height={20} width={160} />
      <Skeleton height={44} width="60%" />
      <div className={styles.hero}>
        <Skeleton height={320} />
        <Skeleton height={320} />
      </div>
      <div className={styles.recs}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={120} />
        ))}
      </div>
      <Skeleton height={240} />
    </div>
  )
}
