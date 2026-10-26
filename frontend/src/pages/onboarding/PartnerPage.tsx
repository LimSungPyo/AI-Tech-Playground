import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { getDex, getExperiments, getPartnerRecommendation, isApiError, setPartner } from '../../api'
import type { CharacterId, DexEntry, ExperimentSummary } from '../../api'
import { useAuth } from '../../auth/useAuth'
import { Badge, Button, Character, CHARACTERS, EmptyState, GlassCard, Icon, Popover, Skeleton, useToast } from '../../components'
import { useApi } from '../../hooks/useApi'
import { interestLabel, LEVEL_LABEL, skillLabel, withJosa } from './onboardingMeta'
import styles from './PartnerPage.module.css'

/** 추천 이유 문장을 「관심사」 단위 줄로 나눈다 */
const splitReason = (reason: string) =>
  reason
    .split(/\s+(?=「)/)
    .map((s) => s.trim())
    .filter(Boolean)

// W2 world 담당 · 경로 /onboarding/partner — A-03 파트너 추천 (= 16 Partner Match)
export default function PartnerPage() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const rec = useApi((signal) => getPartnerRecommendation(signal), [])
  const dex = useApi((signal) => getDex(signal), [])
  const exps = useApi((signal) => getExperiments({}, signal), [])
  const [picking, setPicking] = useState<CharacterId | null>(null)
  const [whyOpen, setWhyOpen] = useState(false)
  const whyRef = useRef<HTMLSpanElement>(null)

  const entryOf = (c: CharacterId): DexEntry | undefined => dex.data?.find((d) => d.character === c)
  const expOf = (c: CharacterId): ExperimentSummary | undefined => {
    const id = entryOf(c)?.experimentId
    return exps.data?.find((e) => (id ? e.id === id : e.character === c))
  }

  const pick = async (c: CharacterId) => {
    setPicking(c)
    try {
      await setPartner(c)
      await refresh()
      const expId = expOf(c)?.id ?? entryOf(c)?.experimentId ?? '001'
      navigate(`/experiments/${expId}/missions/m1/briefing`)
    } catch (e) {
      toast.show({ title: '파트너를 정하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
      setPicking(null)
    }
  }

  if (rec.error) {
    return (
      <div className={styles.page}>
        <EmptyState
          expression="confused"
          title="추천을 불러오지 못했어요"
          description={rec.error.message}
          action={<Button onClick={rec.reload}>다시 시도</Button>}
        />
      </div>
    )
  }

  const primary = rec.data?.primary
  const picked = rec.data ? [rec.data.primary.character, ...rec.data.alternatives.map((a) => a.character)] : []
  const unmet = (dex.data ?? []).filter((d) => !d.obtained && !picked.includes(d.character))
  const pEntry = primary && entryOf(primary.character)
  const pExp = primary && expOf(primary.character)
  const pName = primary ? CHARACTERS[primary.character].name : ''

  return (
    <div className={styles.page}>
      <div className={styles.topline}>
        <Badge tone="solid">추천 완료</Badge>
        <span className={styles.progress}>온보딩 완료 · 3 / 3</span>
      </div>
      <h1 className={styles.h1}>너에게 꼭 맞는 첫 파트너를 찾았어요</h1>
      {user && (
        <div className={styles.answers}>
          <span className={styles.answersLabel}>내 응답</span>
          {user.interests.map((i) => (
            <span key={i} className={styles.answer}>
              {interestLabel(i)}
            </span>
          ))}
          <span className={styles.answer}>수준 · {skillLabel(user.skill)}</span>
        </div>
      )}

      <div className={styles.grid}>
        {!primary ? (
          <Skeleton height={460} />
        ) : (
          <GlassCard padding="lg" radius="lg" className={styles.main}>
            <div className={styles.portrait}>
              <Character id={primary.character} size={220} float />
              <span className={styles.score}>추천 점수 {primary.score.toFixed(2)}</span>
            </div>
            <div className={styles.info}>
              <div className={styles.nameRow}>
                <strong className={styles.name}>{pName}</strong>
                {pEntry && <span className={styles.species}>{pEntry.species}</span>}
                {pExp && <Badge tone="pink">{LEVEL_LABEL[pExp.level]}</Badge>}
                <Badge tone="solid">1순위</Badge>
              </div>
              {pExp && (
                <span className={styles.exp}>
                  EXP {pExp.code} · {pExp.title} · 약 {pExp.durationMin}분
                </span>
              )}
              <h2 className={styles.h2}>이렇게 추천했어요</h2>
              <ul className={styles.reasons}>
                {splitReason(primary.reason).map((r) => (
                  <li key={r}>
                    <span className={styles.tick}>
                      <Icon name="check" size={12} />
                    </span>
                    {r}
                  </li>
                ))}
                {pEntry && !pEntry.obtained && (
                  <li>
                    <span className={styles.tick}>
                      <Icon name="check" size={12} />
                    </span>
                    아직 만나지 않은 친구 → 새로움 +0.2
                  </li>
                )}
              </ul>
              {pEntry && (
                <p className={styles.quote}>
                  {pName}: "{pEntry.why}"
                </p>
              )}
              <div className={styles.actions}>
                <Button size="lg" loading={picking === primary.character} disabled={!!picking} onClick={() => pick(primary.character)}>
                  {withJosa(pName, '와', '과')} 시작하기
                </Button>
                <span ref={whyRef}>
                  <Button variant="why" size="lg" onClick={() => setWhyOpen((o) => !o)} aria-expanded={whyOpen}>
                    왜 이 추천? WHY?
                  </Button>
                </span>
              </div>
            </div>
          </GlassCard>
        )}

        <div className={styles.alts}>
          {!rec.data
            ? [0, 1].map((i) => <Skeleton key={i} height={220} />)
            : rec.data.alternatives.map((a, i) => {
                const entry = entryOf(a.character)
                const exp = expOf(a.character)
                return (
                  <GlassCard key={a.character} padding="md" radius="lg" className={styles.alt}>
                    <div className={styles.altHead}>
                      <Character id={a.character} size={80} />
                      <div className={styles.altTitle}>
                        <span>
                          <strong>{CHARACTERS[a.character].name}</strong>
                          {entry && <span className={styles.species}>{entry.species}</span>}
                        </span>
                        <Badge tone={i === 0 ? 'success' : 'dark'}>
                          {i + 2}순위{exp ? ` · ${LEVEL_LABEL[exp.level]} · ${exp.subtitle}` : ''}
                        </Badge>
                      </div>
                    </div>
                    <p className={styles.altReason}>{a.reason}</p>
                    <Button
                      variant="secondary"
                      block
                      loading={picking === a.character}
                      disabled={!!picking}
                      onClick={() => pick(a.character)}
                    >
                      이 친구로 시작
                    </Button>
                  </GlassCard>
                )
              })}
        </div>
      </div>

      {unmet.length > 0 && (
        <section className={styles.unmet}>
          <div className={styles.unmetHead}>
            <h2 className={styles.h2}>아직 못 만난 친구들</h2>
            <span className={styles.caption}>기술 트리를 진행하면 하나씩 만날 수 있어요</span>
          </div>
          <ul className={styles.unmetGrid}>
            {unmet.map((d) => (
              <li key={d.id} className={styles.unmetCard}>
                <span className={styles.silhouette}>
                  <Character id={d.character} size={88} locked />
                  <span className={styles.q} aria-hidden>
                    ?
                  </span>
                </span>
                <strong>???</strong>
                <span className={styles.caption}>{d.meetCondition}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Popover open={whyOpen} onClose={() => setWhyOpen(false)} anchorRef={whyRef} placement="bottom-start" width={420} label="추천 점수 계산">
        <div className={styles.why}>
          <span className={styles.whyEyebrow}>RECOMMENDATION LOGIC</span>
          <code className={styles.formula}>score = 0.5 × 관심사 일치 + 0.3 × 난이도 적합 + 0.2 × 새로움</code>
          <dl className={styles.terms}>
            <dt>관심사 일치</dt>
            <dd>캐릭터 태그 중 내가 고른 관심사와 겹치는 비율(0~1)</dd>
            <dt>난이도 적합</dt>
            <dd>1 − |캐릭터 단계 − 내 수준| ÷ 3 (입문0 · 기초1 · 심화2 · 최전선3)</dd>
            <dt>새로움</dt>
            <dd>아직 안 만난 캐릭터 = 1, 만난 캐릭터 = 0</dd>
          </dl>
          <p className={styles.whyNote}>드로시는 대표 실험이라 Top 3에 항상 들어가요. 잠긴 친구는 후보에서 빼고 "다음 목표"로만 보여 줘요.</p>
          {primary && (
            <p className={styles.whyResult}>
              → 1순위 {pName} · 점수 {primary.score.toFixed(2)}
            </p>
          )}
        </div>
      </Popover>
    </div>
  )
}
