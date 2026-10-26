import { getExperiments } from '../../api'
import type { ExperimentSummary } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { Button, Character, EmptyState, Icon, Mascot, Skeleton } from '../../components'
import { useApi } from '../../hooks/useApi'
import { CHARACTER_TINT } from './characterTint'
import { LEVEL_LABEL } from './format'
import styles from './FirstHome.module.css'

const LEVEL_RANK = { intro: 0, basic: 1, advanced: 2, frontier: 3 } as const

/** 첫 실험 추천: 파트너가 맡은 열린 실험 → 없으면 가장 쉬운 열린 실험 */
function pickFirst(list: ExperimentSummary[], partner: string | null | undefined) {
  const open = list.filter((e) => e.status === 'open' || e.status === 'in_progress')
  const byPartner = open.find((e) => e.character === partner)
  if (byPartner) return byPartner
  return [...open].sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.durationMin - b.durationMin)[0]
}

/** E-03 로그인 홈 · 첫 실험 전 */
export function FirstHome() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useApi((s) => getExperiments(undefined, s), [])
  const first = data ? pickFirst(data, user?.partner) : undefined

  return (
    <div className={styles.page}>
      <h1 className={styles.greeting}>{user?.nickname ?? ''}님, 반가워요! 첫 실험을 골라 볼까요?</h1>
      <div className={styles.grid}>
        {loading && !data ? (
          <Skeleton height={300} />
        ) : error || !first ? (
          <EmptyState
            expression="confused"
            title="추천 실험을 불러오지 못했어요"
            action={<Button onClick={reload}>다시 불러오기</Button>}
          />
        ) : (
          <section className={styles.card} aria-label="파트너가 추천하는 첫 실험">
            <div className={styles.thumb} style={{ background: CHARACTER_TINT[first.character] }}>
              <Character id={first.character} size={200} alt="" />
            </div>
            <div className={styles.body}>
              <span className={styles.eyebrow}>파트너가 추천하는 첫 실험</span>
              <h2 className={styles.title}>
                {first.code} {first.title}
              </h2>
              <p className={styles.desc}>
                {first.durationMin}분이면 끝나는 {LEVEL_LABEL[first.level]} 실험. {first.tags.join(' · ')}부터 감을 잡아요.
              </p>
              <div className={styles.actions}>
                <Button to={`/experiments/${first.id}/play`} iconRight={<Icon name="arrow-right" size={16} />}>
                  첫 실험 시작하기
                </Button>
                <Button variant="secondary" to="/onboarding/partner">
                  다른 파트너 보기
                </Button>
              </div>
            </div>
          </section>
        )}
        <aside className={styles.tips}>
          <h3 className={styles.tipsTitle}>처음이라면</h3>
          <ol className={styles.tipList}>
            <li>① 실험은 10분 안팎이에요</li>
            <li>② 막히면 노란 WHY? 버튼</li>
            <li>③ 기록은 자동 저장돼요</li>
          </ol>
        </aside>
      </div>
      <div className={styles.later}>
        <Mascot expression="sleep" size={64} alt="" />
        <p>이어하기 · 학습 잔디 · 기술 레이더 추천은 첫 실험을 마치면 여기에 나타나요.</p>
      </div>
    </div>
  )
}
