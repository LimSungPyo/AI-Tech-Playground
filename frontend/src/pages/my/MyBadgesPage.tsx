import { useState } from 'react'
import { getMyBadges, getMyExperiments, setFeaturedBadge } from '../../api'
import { Button, EmptyState, GlassCard, ProgressBar, Skeleton, cx, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { BadgeIcon } from './components/BadgeIcon'
import { BADGE_CATEGORIES, badgeCategory } from './components/badgeMeta'
import { formatFullDate, formatMonthDay } from './components/format'
import { PageTitle } from './components/PageTitle'
import my from './components/my.module.css'
import styles from './MyBadgesPage.module.css'

// W2 my 담당 · 경로 /my/badges · C-05 배지
export default function MyBadgesPage() {
  const badges = useApi((s) => getMyBadges(s), [])
  const exps = useApi((s) => getMyExperiments(s), [])
  const toast = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // 저장한 대표 배지(응답의 featured보다 우선)
  const [featuredId, setFeaturedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (badges.error) {
    return (
      <EmptyState
        expression="confused"
        title="배지를 불러오지 못했어요"
        description={badges.error.message}
        action={<Button onClick={badges.reload}>다시 시도</Button>}
      />
    )
  }

  const list = badges.data ?? []
  const obtained = list.filter((b) => b.obtained).length
  const featured = featuredId ?? list.find((b) => b.featured)?.id
  const selected =
    list.find((b) => b.id === selectedId) ?? list.find((b) => b.id === featured) ?? list.find((b) => b.obtained) ?? list[0]

  const related = selected?.experimentId
  const relatedExp = related ? exps.data?.find((e) => e.id === related) : undefined

  const feature = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await setFeaturedBadge(selected.id)
      setFeaturedId(res.featuredBadgeId ?? selected.id)
      toast.show({ title: '대표 배지로 설정했어요', description: selected.name, tone: 'success' })
    } catch (e) {
      toast.show({ title: '대표 배지를 바꾸지 못했어요', description: e instanceof Error ? e.message : undefined, tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const share = async () => {
    if (!selected) return
    const text = `AI Tech Playground에서 "${selected.name}" 배지를 받았어요!`
    try {
      await navigator.clipboard.writeText(`${text} ${window.location.origin}`)
      toast.show({ title: '공유 문구를 복사했어요', description: text, tone: 'success' })
    } catch {
      toast.show({ title: '복사하지 못했어요', tone: 'danger' })
    }
  }

  return (
    <div className={my.page}>
      <PageTitle
        title="배지"
        sub={
          badges.data && (
            <div className={styles.total}>
              <ProgressBar value={obtained} max={Math.max(list.length, 1)} size="sm" className={styles.totalBar} />
              <span className={styles.totalLabel}>
                {obtained} / {list.length} 획득
              </span>
            </div>
          )
        }
      />

      {badges.loading || !badges.data ? (
        <div className={styles.layout}>
          <div className={styles.sections}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={250} />
            ))}
          </div>
          <Skeleton height={520} />
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.sections}>
            {BADGE_CATEGORIES.map((cat) => {
              const items = list.filter((b) => badgeCategory(b) === cat.id)
              if (items.length === 0) return null
              return (
                <GlassCard key={cat.id} radius="lg" as="section">
                  <div className={my.cardHead}>
                    <h2 className={styles.catTitle}>
                      {cat.title} <span className={styles.catDesc}>{cat.description}</span>
                    </h2>
                    <span className={my.count}>
                      {items.filter((b) => b.obtained).length} / {items.length}
                    </span>
                  </div>
                  <ul className={styles.grid}>
                    {items.map((b) => {
                      const pct = b.obtained ? undefined : (b.progress ?? 0)
                      return (
                        <li key={b.id}>
                          <button
                            type="button"
                            className={cx(styles.tile, !b.obtained && styles.tileOff, selected?.id === b.id && styles.tileOn)}
                            onClick={() => setSelectedId(b.id)}
                            aria-pressed={selected?.id === b.id}
                          >
                            <BadgeIcon badge={b} size={52} />
                            <span className={styles.name}>{b.name}</span>
                            <span className={styles.desc}>{b.description}</span>
                            {b.obtained ? (
                              <span className={styles.date}>{b.obtainedAt ? `${formatMonthDay(b.obtainedAt)} 획득` : '획득'}</span>
                            ) : (
                              <>
                                <ProgressBar value={pct ?? 0} size="sm" className={styles.tileBar} />
                                <span className={styles.pct}>{pct ? `${Math.round(pct)}%` : '아직 시작 전'}</span>
                              </>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </GlassCard>
              )
            })}
          </div>

          {selected && (
            <GlassCard radius="lg" padding="lg" as="aside" className={styles.detail} aria-label="선택한 배지">
              <p className={styles.detailEyebrow}>선택한 배지</p>
              <BadgeIcon badge={selected} size={116} />
              <h2 className={styles.detailName}>{selected.name}</h2>
              <p className={styles.detailDesc}>{selected.story ?? selected.description}</p>
              <dl className={styles.detailRows}>
                <div>
                  <dt>획득일</dt>
                  <dd>{selected.obtainedAt ? formatFullDate(selected.obtainedAt) : '아직'}</dd>
                </div>
                {!selected.obtained && selected.progress !== undefined && (
                  <div>
                    <dt>진행률</dt>
                    <dd>{Math.round(selected.progress)}%</dd>
                  </div>
                )}
                {selected.rarity !== undefined && (
                  <div>
                    <dt>획득한 사용자</dt>
                    <dd>{selected.rarity}%</dd>
                  </div>
                )}
                {relatedExp && (
                  <div>
                    <dt>관련 실험</dt>
                    <dd>
                      {relatedExp.code} {relatedExp.title}
                    </dd>
                  </div>
                )}
              </dl>
              {selected.obtained ? (
                <>
                  <Button block disabled={featured === selected.id} loading={saving} onClick={feature}>
                    {featured === selected.id ? '대표 배지' : '대표 배지로 설정'}
                  </Button>
                  <Button block variant="secondary" onClick={share}>
                    공유하기
                  </Button>
                </>
              ) : (
                relatedExp && (
                  <Button block to={`/experiments/${relatedExp.id}`}>
                    관련 실험 하러 가기
                  </Button>
                )
              )}
              <p className={styles.note}>대표 배지는 랭킹 · 도감 카드에 함께 보여요.</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  )
}
