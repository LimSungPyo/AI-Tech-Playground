import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { isApiError, saveOnboarding } from '../../api'
import type { SkillLevel } from '../../api'
import { useAuth } from '../../auth/useAuth'
import { Button, Character, cx, GlassCard, Icon, Mascot, useToast } from '../../components'
import type { IconName } from '../../components'
import { StepBar } from './components/StepBar'
import { INTERESTS, SKILLS } from './onboardingMeta'
import styles from './OnboardingPage.module.css'

const FEATURES: { icon: IconName; title: string; body: string; art: ReactNode }[] = [
  { icon: 'play', title: '직접 훈련해요', body: '보는 게 아니라, 버튼을 눌러 AI를 가르쳐요', art: <Mascot expression="default" size={56} /> },
  { icon: 'question', title: '막히면 WHY?', body: 'AI가 왜 그렇게 했는지 언제든 물어봐요', art: <Mascot expression="why" size={56} /> },
  { icon: 'sparkle', title: '친구가 9명', body: '기술마다 그 원리를 닮은 동물 친구가 있어요', art: <Character id="wormy" size={56} /> },
]

// W2 world 담당 · 경로 /onboarding — G-05 만나기 → A-02 관심사 → G-06 수준
export default function OnboardingPage() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const step = Math.min(3, Math.max(1, Number(params.get('step')) || 1))
  const [interests, setInterests] = useState<string[]>(user?.interests ?? [])
  const [skill, setSkill] = useState<SkillLevel>(user?.skill ?? 'beginner')
  const [saving, setSaving] = useState(false)

  const go = (n: number) => setParams(n === 1 ? {} : { step: String(n) })
  const toggle = (id: string) => setInterests((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))

  const finish = async () => {
    setSaving(true)
    try {
      await saveOnboarding({ interests, skill })
      await refresh()
      navigate('/onboarding/partner')
    } catch (e) {
      toast.show({ title: '저장하지 못했어요', description: isApiError(e) ? e.message : undefined, tone: 'danger' })
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <StepBar step={step} skipTo="/lab" />

      {step === 1 && (
        <section className={styles.meet} aria-labelledby="ob-title">
          <div className={styles.meetHero}>
            <Mascot expression="default" size={260} float />
            <Bubble>
              <span id="ob-title">안녕! 나는 드로시야.</span>
              <br />
              진짜 초파리 뇌 데이터를 단순화한 신경망으로 움직이는 AI 친구야. 아직은 아무것도 몰라서, 네가 가르쳐 줘야 해!
            </Bubble>
          </div>
          <div className={styles.features}>
            {FEATURES.map((f) => (
              <GlassCard key={f.title} padding="md" className={styles.feature}>
                <span className={styles.featureIcon}>
                  <Icon name={f.icon} size={16} />
                </span>
                <span className={styles.featureArt} aria-hidden>
                  {f.art}
                </span>
                <strong className={styles.featureTitle}>{f.title}</strong>
                <span className={styles.featureBody}>{f.body}</span>
              </GlassCard>
            ))}
          </div>
          <div className={styles.center}>
            <Button size="lg" onClick={() => go(2)} iconRight={<Icon name="arrow-right" size={18} />}>
              좋아, 시작하자
            </Button>
            <span className={styles.caption}>1분이면 끝나요 · 2단계에서 관심사를, 3단계에서 설명 난이도를 골라요</span>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className={styles.interests}>
          <div className={styles.side}>
            <Bubble>
              안녕! 나는 초파리 드로시야.
              <br />
              관심 있는 AI를 알려주면 너한테 딱 맞는 실험부터 같이 해볼게. 사실 나도 아직 아무것도 몰라!
            </Bubble>
            <Mascot expression="default" size={240} float />
          </div>
          <GlassCard padding="lg" radius="lg" className={styles.panel}>
            <span className={styles.stepLabel}>STEP 2 / 3</span>
            <h1 className={styles.h1}>어떤 AI가 궁금해요?</h1>
            <p className={styles.lead}>여러 개 골라도 돼요. 고른 관심사에 따라 첫 실험과 기술 트리 추천이 달라져요.</p>
            <div className={styles.choiceGrid} role="group" aria-label="관심사 (여러 개 선택)">
              {INTERESTS.map((it) => {
                const on = interests.includes(it.id)
                return (
                  <button
                    key={it.id}
                    type="button"
                    className={cx(styles.choice, on && styles.choiceOn)}
                    aria-pressed={on}
                    onClick={() => toggle(it.id)}
                  >
                    <span className={styles.choiceText}>
                      <strong>{it.label}</strong>
                      <span>{it.tech}</span>
                    </span>
                    <Check on={on} />
                  </button>
                )
              })}
            </div>
            <div className={styles.footer}>
              <Button variant="secondary" onClick={() => go(1)} iconLeft={<Icon name="arrow-left" size={16} />}>
                이전
              </Button>
              <span className={styles.caption}>{interests.length === 0 ? '하나 이상 골라 주세요' : '나중에 설정에서 바꿀 수 있어요'}</span>
              <Button size="lg" disabled={interests.length === 0} onClick={() => go(3)} iconRight={<Icon name="arrow-right" size={18} />}>
                다음
              </Button>
            </div>
          </GlassCard>
        </section>
      )}

      {step === 3 && (
        <section className={styles.level}>
          <span className={styles.stepLabel}>STEP 3 / 3</span>
          <h1 className={styles.h1}>AI, 얼마나 알고 있어요?</h1>
          <p className={styles.lead}>
            고른 수준에 따라 WHY? 설명과 기술 카드의 말투가 달라져요. 같은 순간을 세 가지로 설명하면 이래요.
          </p>
          <div className={styles.levels} role="radiogroup" aria-label="수준">
            {SKILLS.map((s) => {
              const on = skill === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={cx(styles.levelCard, on && styles.levelOn)}
                  onClick={() => setSkill(s.id)}
                >
                  <span className={styles.levelHead}>
                    <strong>{s.label}</strong>
                    <Check on={on} />
                  </span>
                  <span className={styles.levelShort}>{s.short}</span>
                  <span className={styles.example}>
                    <span className={styles.exampleLabel}>
                      <Mascot expression="why" size={28} /> WHY? 예시
                    </span>
                    {s.example}
                  </span>
                </button>
              )
            })}
          </div>
          <div className={styles.levelFooter}>
            <span className={styles.caption}>언제든 설정 → 학습 환경에서 바꿀 수 있어요</span>
            <div className={styles.buttons}>
              <Button variant="secondary" onClick={() => go(2)} iconLeft={<Icon name="arrow-left" size={16} />}>
                이전
              </Button>
              <Button size="lg" loading={saving} onClick={finish} iconRight={<Icon name="arrow-right" size={18} />}>
                파트너 추천 받기
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function Bubble({ children }: { children: ReactNode }) {
  return (
    <div className={styles.bubble}>
      <span className={styles.bubbleName}>드로시</span>
      <p className={styles.bubbleText}>{children}</p>
    </div>
  )
}

function Check({ on }: { on: boolean }) {
  return <span className={cx(styles.check, on && styles.checkOn)}>{on && <Icon name="check" size={12} />}</span>
}
