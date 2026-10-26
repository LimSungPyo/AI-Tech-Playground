import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { getCarousel, getExperiment, getExperiments, getTechDrop } from '../../api'
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
import { useApi } from '../../hooks/useApi'
import { HeroCarousel } from './components/HeroCarousel'
import type { HeroSlide } from './components/HeroCarousel'
import { RememberedBanner } from './components/RememberedBanner'
import { LEVEL_LABEL, daysUntil } from './format'
import styles from './GuestHome.module.css'

const STEPS = ['플레이', 'AI 변화 확인', '원리 시각화', '기술 카드', '다시 플레이']

// 홈 친구 목록 순서(Figma 0-01): 열린 실험 친구 → 잠긴 친구
const FRIEND_ORDER: CharacterId[] = ['wormy', 'drosi', 'parrot', 'hawk', 'owl', 'octo', 'ants', 'memo', 'mappy']

const isOpen = (e?: ExperimentSummary) => e?.status === 'open' || e?.status === 'in_progress'
const LEVEL_RANK = { intro: 0, basic: 1, advanced: 2, frontier: 3 } as const

interface CarouselData {
  slides: CarouselSlide[]
  experiments: ExperimentSummary[]
  /** 슬라이드 code → 말풍선 */
  bubbles: Record<string, string>
}

/** 캐러셀 + 실험 목록을 받고, 슬라이드별 말풍선(열린 실험: 성공률 변화, 오픈 예정: D-day)을 채운다 */
async function loadCarousel(signal: AbortSignal): Promise<CarouselData> {
  const [{ slides }, experiments] = await Promise.all([getCarousel(signal), getExperiments(undefined, signal)])
  const byCode = new Map(experiments.map((e) => [e.code, e]))
  const bubbles: Record<string, string> = {}
  await Promise.all(
    slides.map(async (s) => {
      const exp = byCode.get(s.code)
      if (!exp) return
      try {
        if (isOpen(exp)) {
          const d = await getExperiment(exp.id, signal)
          bubbles[s.code] = `성공률 ${Math.round(d.stats.firstTrialRate)}% → ${Math.round(d.stats.hundredthTrialRate)}%`
        } else {
          const drop = await getTechDrop(exp.id, signal)
          bubbles[s.code] = `D-${daysUntil(drop.openAt)}`
        }
      } catch {
        // 말풍선은 없어도 된다
      }
    }),
  )
  return { slides, experiments, bubbles }
}

interface Props {
  rememberedEmail: string | null
  onForget: () => void
}

/** 0-01 홈 (비회원 · 자동 캐러셀) · 07:M-01 홈 (기억된 회원) */
export function GuestHome({ rememberedEmail, onForget }: Props) {
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
    // FEATURED: 열린 실험 중 가장 높은 단계(동률이면 앞쪽)
    let featured = -1
    data.slides.forEach((s, i) => {
      const e = byCode.get(s.code)
      if (!isOpen(e)) return
      const cur = featured >= 0 ? byCode.get(data.slides[featured].code) : undefined
      if (!cur || LEVEL_RANK[e!.level] > LEVEL_RANK[cur.level]) featured = i
    })
    const slides = data.slides.map((s, i): HeroSlide => {
      const e = byCode.get(s.code)
      const open = isOpen(e)
      const tags = e ? [LEVEL_LABEL[e.level], `${e.durationMin}분`, e.tags.join(' · ')] : []
      return {
        code: s.code,
        title: s.title,
        body: s.body,
        character: s.character,
        badge: i === featured ? 'FEATURED' : open ? 'NOW OPEN' : 'COMING SOON',
        tags,
        bubble: data.bubbles[s.code],
        cta: s.cta,
        ctaTo: open && e ? `/experiments/${e.id}/play` : undefined,
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
    return { slides, featured: Math.max(0, featured) }
  }, [data, navigate, toast])

  return (
    <div className={styles.page}>
      {rememberedEmail && <RememberedBanner email={rememberedEmail} onForget={onForget} />}

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
