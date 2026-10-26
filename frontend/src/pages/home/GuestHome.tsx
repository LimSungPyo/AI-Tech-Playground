import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { getCarousel, getExperiments } from '../../api'
import type { CarouselSlide, ExperimentSummary } from '../../api/types'
import {
  Button,
  CHARACTERS,
  Character,
  EmptyState,
  Icon,
  Mascot,
  SectionHeader,
  Skeleton,
  useToast,
} from '../../components'
import type { CharacterId } from '../../api/types'
import type { RememberedProfile } from '../../auth/remembered'
import { useApi } from '../../hooks/useApi'
import { HeroCarousel } from './components/HeroCarousel'
import type { HeroSlide } from './components/HeroCarousel'
import { RememberedBanner } from './components/RememberedBanner'
import { LEVEL_LABEL } from './format'
import styles from './GuestHome.module.css'

const STEPS = ['플레이', 'AI 변화 확인', '원리 시각화', '기술 카드', '다시 플레이']

// 홈 친구 목록 순서(Figma 0-01): 열린 실험 친구 → 잠긴 친구
const FRIEND_ORDER: CharacterId[] = ['wormy', 'drosi', 'parrot', 'hawk', 'owl', 'octo', 'ants', 'memo', 'mappy']

const isOpen = (e?: ExperimentSummary) => e?.status === 'open' || e?.status === 'in_progress'

interface CarouselData {
  slides: CarouselSlide[]
  /** 친구 목록 잠김 표시 · 열린 실험 바로 플레이 링크에 쓴다 */
  experiments: ExperimentSummary[]
}

async function loadCarousel(signal: AbortSignal): Promise<CarouselData> {
  const [{ slides }, experiments] = await Promise.all([getCarousel(signal), getExperiments(undefined, signal)])
  return { slides, experiments }
}

/** "12% → 86%" 말풍선은 Figma처럼 "성공률"을 붙인다 */
const bubbleText = (b?: string) => (b && /^\d+%\s*→/.test(b) ? `성공률 ${b}` : b)

interface Props {
  remembered: RememberedProfile | null
  onForget: () => void
}

/** 0-01 홈 (비회원 · 자동 캐러셀) · 07:M-01 홈 (기억된 회원) */
export function GuestHome({ remembered, onForget }: Props) {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, loading, reload } = useApi(loadCarousel, [])

  const experimentByCharacter = useMemo(() => {
    const m = new Map<CharacterId, ExperimentSummary>()
    data?.experiments.forEach((e) => m.set(e.character, e))
    return m
  }, [data])

  const { slides, featured } = useMemo(() => {
    if (!data) return { slides: [] as HeroSlide[], featured: 0 }
    const byCode = new Map(data.experiments.map((e) => [e.code, e]))
    const slides = data.slides.map((s): HeroSlide => {
      const e = byCode.get(s.code)
      const badge = s.badge ?? (isOpen(e) ? 'NOW OPEN' : 'COMING SOON')
      const level = s.level ?? e?.level
      const durationMin = s.durationMin ?? e?.durationMin
      const topics = s.tags ?? e?.tags ?? []
      const tags = [
        level && LEVEL_LABEL[level],
        durationMin !== undefined && `${durationMin}분`,
        topics.length > 0 && topics.join(' · '),
      ].filter((t): t is string => !!t)
      return {
        code: s.code,
        title: s.title,
        body: s.body,
        character: s.character,
        badge,
        tags,
        bubble: bubbleText(s.bubble),
        cta: s.cta,
        ctaTo: badge !== 'COMING SOON' && e ? `/experiments/${e.id}/play` : undefined,
        onCta: () =>
          toast.show({
            title: '로그인하면 오픈 알림을 받을 수 있어요',
            description: `${s.code} ${s.title}`,
            action: { label: '로그인', onClick: () => navigate('/login?returnTo=%2F') },
            duration: 6000,
          }),
        detailTo: s.target,
      }
    })
    return { slides, featured: Math.max(0, slides.findIndex((s) => s.badge === 'FEATURED')) }
  }, [data, navigate, toast])

  return (
    <div className={styles.page}>
      {remembered && <RememberedBanner profile={remembered} onForget={onForget} />}

      {loading && !data ? (
        <Skeleton height={560} className={styles.heroSkeleton} />
      ) : error || !data ? (
        <EmptyState
          expression="confused"
          title="실험 소개를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={reload}>다시 불러오기</Button>}
        />
      ) : (
        <HeroCarousel key={slides.length} slides={slides} initialIndex={featured} />
      )}

      <section className={styles.section}>
        <SectionHeader title="모든 실험은 같은 흐름이에요" right={<span className={styles.eyebrowRight}>HOW IT WORKS</span>} />
        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s} className={styles.stepItem}>
              <div className={styles.step}>
                <span className={styles.stepNo}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.stepLabel}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span className={styles.stepArrow} aria-hidden>
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <SectionHeader title="기술마다 함께할 친구가 있어요" link={{ to: '/dex', label: '전체 보기 →' }} />
        <ul className={styles.friends}>
          {FRIEND_ORDER.map((id) => {
            const meta = CHARACTERS[id]
            const exp = experimentByCharacter.get(id)
            const locked = !!data && !isOpen(exp)
            return (
              <li key={id}>
                <Link
                  to={exp ? `/experiments/${exp.id}` : '/lab'}
                  className={styles.friend}
                  data-locked={locked || undefined}
                  aria-label={`${meta.name} · ${meta.experiment} ${meta.topic}${locked ? ' (잠김)' : ''}`}
                >
                  <Character id={id} size={72} alt="" />
                  <span className={styles.friendName}>{meta.name}</span>
                  <span className={styles.friendTopic}>
                    {meta.experiment} {meta.topic}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={styles.guest}>
        <Mascot expression="default" size={104} className={styles.guestMascot} alt="" />
        <div className={styles.guestText}>
          <span className={styles.guestEyebrow}>GUEST MODE</span>
          <h2 className={styles.guestTitle}>가입 없이 #001을 3회까지 먼저 해볼 수 있어요</h2>
          <p className={styles.guestDesc}>
            기록을 저장하고 이어서 키우려면 로그인하세요. 체험한 기록은 가입 후에도 그대로 옮겨져요.
          </p>
        </div>
        <div className={styles.guestActions}>
          <Button to="/experiments/001/play" variant="primary" iconRight={<Icon name="arrow-right" size={16} />}>
            바로 체험하기
          </Button>
          <Button to="/login" variant="secondary" className={styles.guestLogin}>
            로그인
          </Button>
        </div>
      </section>
    </div>
  )
}
