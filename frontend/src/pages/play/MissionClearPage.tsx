import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getExperiment, getMissionClear, getReport, shareExperiment } from '../../api'
import { Button, CHARACTERS, EmptyState, Icon, Mascot, Skeleton, cx, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { compactRange } from './lib'
import styles from './MissionClearPage.module.css'

// 미션별 축하 제목(화면 고정 카피). 없으면 일반 문장
const HEADLINES: Record<string, string> = {
  '001-m1': '드로시가 먹이를 찾았어요!',
  '001-m2': '드로시가 장애물을 피했어요!',
}

const CONFETTI_TONES = ['indigo', 'yellow', 'green', 'orange', 'pink'] as const

/** 받침 유무에 따라 "가/이" */
function withGa(word: string) {
  const c = word.charCodeAt(word.length - 1)
  const jong = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0
  return `${word}${jong ? '이' : '가'}`
}

// W2 play 담당 · 경로 /experiments/:id/missions/:missionId/clear — B-07 미션 성공
export default function MissionClearPage() {
  const { id = '001', missionId = 'm1' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const clear = useApi((signal) => getMissionClear(id, missionId, signal), [id, missionId])
  const exp = useApi((signal) => getExperiment(id, signal), [id])
  const report = useApi((signal) => getReport(id, signal), [id])
  const [sharing, setSharing] = useState(false)

  if ((clear.loading && !clear.data) || (exp.loading && !exp.data)) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <Skeleton shape="circle" width={160} />
          <Skeleton shape="text" lines={3} />
          <Skeleton height={110} />
        </div>
      </div>
    )
  }
  const error = clear.error ?? exp.error
  if (error || !clear.data || !exp.data) {
    return (
      <EmptyState
        expression="confused"
        title="미션 결과를 불러오지 못했어요"
        description={error?.message}
        action={
          <Button
            onClick={() => {
              clear.reload()
              exp.reload()
            }}
          >
            다시 시도
          </Button>
        }
      />
    )
  }

  const { mission, rate, unlocked, badge, firstSuccessTrial: firstSuccess, myPrediction: prediction, predictionCorrect: correct } = clear.data
  const experiment = exp.data
  const index = Math.max(0, experiment.missions.findIndex((m) => m.id === mission.id))
  const name = CHARACTERS[experiment.character]?.name ?? '드로시'
  // 첫 성공의 행동 설명("처음으로 먹이까지 직진")은 리포트 사건 목록에서 가져온다
  const eventLabel = report.data?.events[index]?.label ?? '성공'
  const firstLabel = eventLabel.startsWith('처음') ? eventLabel : `처음으로 ${eventLabel}`
  const nextMission = unlocked.find((u) => u.kind === 'mission')
  const chips = [
    ...unlocked.filter((u) => u.kind !== 'card').map((u) => u.title),
    ...(badge ? [`"${badge.name}" 배지`] : []),
    ...unlocked.filter((u) => u.kind === 'card').map((u) => u.title),
  ]

  const share = async () => {
    setSharing(true)
    try {
      const res = await shareExperiment(id)
      const url = new URL(res.url, window.location.origin).toString()
      await navigator.clipboard?.writeText(url).catch(() => undefined)
      toast.show({ title: '공유 링크를 복사했어요', description: url, tone: 'success' })
    } catch (e) {
      toast.show({ title: '공유 링크를 만들지 못했어요', description: e instanceof Error ? e.message : undefined, tone: 'danger' })
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.confetti} aria-hidden>
        {Array.from({ length: 40 }, (_, i) => (
          <span
            key={i}
            className={cx(styles.piece, styles[CONFETTI_TONES[i % CONFETTI_TONES.length]], i % 3 === 0 && styles.dot)}
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${((i * 53) % 30) / 10}s`,
              animationDuration: `${3.2 + ((i * 17) % 20) / 10}s`,
              rotate: `${(i * 47) % 180}deg`,
            }}
          />
        ))}
      </div>

      <section className={styles.card}>
        <Mascot expression="champion" size={200} alt={`기뻐하는 ${name}`} className={styles.mascot} />
        <span className={styles.eyebrow}>MISSION {index + 1} CLEAR</span>
        <h1 className={styles.h1}>{HEADLINES[`${id}-${mission.id}`] ?? `${withGa(name)} ${mission.title} 미션을 해냈어요!`}</h1>
        {firstSuccess !== undefined && (
          <p className={styles.lead}>
            1회차에는 제자리만 맴돌던 {withGa(name)}, {firstSuccess}번째 훈련에서 {firstLabel}했어요.
          </p>
        )}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <small>첫 성공</small>
            <strong>{firstSuccess !== undefined ? `T${firstSuccess}` : '—'}</strong>
            {firstSuccess !== undefined && <span>{firstSuccess}번째 훈련</span>}
          </div>
          <div className={styles.stat}>
            <small>최종 성공률</small>
            <strong>{Math.round(rate)}%</strong>
            <span>1회차 {Math.round(experiment.stats.firstTrialRate)}%</span>
          </div>
          <div className={cx(styles.stat, styles.statPredict)}>
            <small>내 예측</small>
            <strong>{prediction ? compactRange(prediction) : '—'}</strong>
            <span>
              {!prediction ? '예측하지 않았어요' : correct == null ? '결과 확인 중' : correct ? '정답이에요!' : '아쉽게 빗나갔어요'}
            </span>
          </div>
        </div>

        {chips.length > 0 && (
          <div className={styles.unlocked}>
            <span className={styles.unlockedLabel}>새로 열렸어요</span>
            <ul>
              {chips.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={share} loading={sharing} iconLeft={<Icon name="share" size={16} />}>
            공유하기
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              toast.show({ title: 'AI 도감에 저장했어요', tone: 'success' })
              navigate('/dex')
            }}
          >
            AI 도감에 저장
          </Button>
          <span className={styles.spacer} />
          <Button to={`/experiments/${id}/report`} iconRight={<Icon name="arrow-right" size={16} />}>
            성장 리포트 보기
          </Button>
        </div>
        <div className={styles.more}>
          <Button variant="ghost" size="sm" to={`/experiments/${id}/reveal`}>
            반전 보기
          </Button>
          {nextMission && (
            <Button variant="ghost" size="sm" to={`/experiments/${id}/missions/${nextMission.id}/briefing`}>
              다음 미션 · {nextMission.title}
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
