import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getBriefing, getExperiment, predict } from '../../api'
import type { ExperimentDetail, MissionBriefing } from '../../api'
import {
  Badge,
  Button,
  EmptyState,
  GlassCard,
  Icon,
  Mascot,
  Modal,
  Skeleton,
  cx,
  useToast,
} from '../../components'
import type { IconName } from '../../components'
import { useApi } from '../../hooks/useApi'
import { MiniScene } from './components/MiniScene'
import { loadPrediction, parseTip, savePrediction } from './lib'
import type { RewardRule } from './lib'
import styles from './BriefingPage.module.css'

// 감각 → 뉴런 매핑(화면 설계 고정 카피). 플레이 중 신경망 패널과 같은 이름
const SENSES: { key: string; icon: IconName; name: string; desc: string; descShort: string; neurons: string }[] = [
  { key: 'smell', icon: 'radar', name: '냄새', desc: '먹이가 어느 쪽인지', descShort: '먹이 방향', neurons: 'S1 – S3' },
  { key: 'sight', icon: 'eye', name: '시야', desc: '장애물까지의 거리', descShort: '장애물까지의 거리', neurons: 'S4 – S5' },
  { key: 'hunger', icon: 'heart', name: '배고픔', desc: '남은 에너지', descShort: '남은 에너지', neurons: 'S6' },
]

/** "드로시에게 … 주세요. Trial 1의 …" → 제목 · 설명 */
function splitStory(story: string) {
  const i = story.search(/[.!?]\s/)
  if (i < 0) return { headline: story, lead: '' }
  return { headline: story.slice(0, i), lead: story.slice(i + 2) }
}

// W2 play 담당 · 경로 /experiments/:id/missions/:missionId/briefing — B-03 미션 브리핑 · G-04 미션 2 브리핑
export default function BriefingPage() {
  const { id = '001', missionId = 'm1' } = useParams()
  const exp = useApi((signal) => getExperiment(id, signal), [id])
  const brief = useApi((signal) => getBriefing(id, missionId, signal), [id, missionId])
  const index = exp.data?.missions.findIndex((m) => m.id === missionId) ?? -1

  if ((exp.loading && !exp.data) || (brief.loading && !brief.data)) {
    return (
      <div className={styles.page}>
        <Skeleton shape="text" lines={3} />
        <div className={styles.grid}>
          <Skeleton height={480} />
          <Skeleton height={480} />
        </div>
      </div>
    )
  }
  const error = exp.error ?? brief.error
  if (error || !exp.data || !brief.data) {
    return (
      <EmptyState
        expression="confused"
        title={error?.status === 404 ? '미션을 찾을 수 없어요' : '브리핑을 불러오지 못했어요'}
        description={error?.message}
        action={
          error?.status === 404 ? (
            <Button to="/lab">실험실로</Button>
          ) : (
            <Button
              onClick={() => {
                exp.reload()
                brief.reload()
              }}
            >
              다시 시도
            </Button>
          )
        }
      />
    )
  }
  return (
    <Briefing
      key={`${id}-${missionId}`}
      experiment={exp.data}
      briefing={brief.data}
      index={Math.max(0, index)}
    />
  )
}

function Briefing({
  experiment,
  briefing,
  index,
}: {
  experiment: ExperimentDetail
  briefing: MissionBriefing
  index: number
}) {
  const id = experiment.id
  const mission = briefing.mission
  const missions = experiment.missions
  const later = index > 0
  const toast = useToast()
  const navigate = useNavigate()
  const [choice, setChoice] = useState<string | null>(() => loadPrediction(id, mission.id))
  const [rulesOpen, setRulesOpen] = useState(false)
  const { headline, lead } = splitStory(briefing.story)
  const rules = briefing.tips.map(parseTip).filter((r): r is RewardRule => r !== null)
  // 보상 규칙 모양이 아닌 팁(이전 미션에서 이어받는 연결 안내 등)
  const notes = briefing.tips.filter((t) => !parseTip(t))
  const locked = mission.status === 'locked'
  const prev = missions[index - 1]

  const choose = (option: string) => {
    const before = choice
    setChoice(option)
    savePrediction(id, mission.id, option)
    predict(id, mission.id, option).catch((e: unknown) => {
      setChoice(before)
      toast.show({ title: '예측을 저장하지 못했어요', description: e instanceof Error ? e.message : undefined, tone: 'danger' })
    })
  }

  const start = () => navigate(`/experiments/${id}/play?mission=${mission.id}`)

  const lockText = (i: number) => {
    const before = missions[i - 1]
    return before ? `미션 ${i} 성공률 ${before.successThreshold}% 이상이면 열려요` : '아직 열리지 않았어요'
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>
            EXPERIMENT {experiment.code} · {later ? `MISSION ${index + 1} BRIEFING` : 'MISSION BRIEFING'}
          </span>
          <h1 className={styles.h1}>{headline}</h1>
          {lead && <p className={styles.lead}>{lead}</p>}
        </div>
        {later ? (
          <Mascot expression="training" size={120} alt="" float />
        ) : (
          <GlassCard className={styles.mascotCard} padding="md">
            <Mascot expression="confused" size={120} alt="" />
            <span>"먹이가… 뭐야?"</span>
          </GlassCard>
        )}
      </section>

      {later && (
        <GlassCard className={styles.stepper} padding="sm" as="nav" aria-label="미션 순서">
          {missions.map((m, i) => (
            <span key={m.id} className={styles.stepItem}>
              {i > 0 && <Icon name="arrow-right" size={16} className={styles.stepArrow} />}
              <button
                type="button"
                className={cx(styles.step, m.id === mission.id && styles.stepNow, m.status === 'cleared' && styles.stepDone)}
                disabled={m.status === 'locked'}
                aria-current={m.id === mission.id ? 'step' : undefined}
                onClick={() => navigate(`/experiments/${id}/missions/${m.id}/briefing`)}
              >
                미션 {i + 1} · {m.title}
                <small>
                  {m.id === mission.id ? '지금' : m.status === 'cleared' ? `✓ ${m.bestRate ?? ''}%` : m.status === 'locked' ? '잠김' : '도전 가능'}
                </small>
              </button>
            </span>
          ))}
        </GlassCard>
      )}

      <div className={styles.grid}>
        <div className={styles.col}>
          {later ? (
            <>
              <GlassCard padding="lg">
                <h2 className={styles.h2}>이번 미션에서 쓰는 감각</h2>
                <div className={styles.senses}>
                  {[SENSES[1], SENSES[0], SENSES[2]].map((s) => {
                    const isNew = s.key === 'sight'
                    return (
                      <div key={s.key} className={cx(styles.sense, isNew && styles.senseNew)}>
                        <div className={styles.senseHead}>
                          <strong>{s.name}</strong>
                          {isNew ? <Badge tone="solid">NEW</Badge> : <Badge tone="neutral">이어받음</Badge>}
                        </div>
                        <span className={styles.senseDesc}>{s.descShort}</span>
                        <span className={styles.neuronTag}>감각 뉴런 {s.neurons}</span>
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
              {notes.map((n) => (
                <p key={n} className={styles.carry}>
                  <Icon name="refresh" size={18} />
                  {n} 처음부터 다시 배우지 않아요.
                </p>
              ))}
            </>
          ) : (
            <>
              <GlassCard padding="lg">
                <h2 className={styles.h2}>미션</h2>
                <div className={styles.missions}>
                  {missions.slice(0, 2).map((m, i) => {
                    const mLocked = m.status === 'locked'
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={cx(styles.missionCard, m.id === mission.id && styles.missionOn, mLocked && styles.missionLocked)}
                        disabled={mLocked}
                        onClick={() => navigate(`/experiments/${id}/missions/${m.id}/briefing`)}
                      >
                        <MiniScene obstacle={i > 0} tone={mLocked ? 'muted' : 'success'} />
                        <span className={styles.missionHead}>
                          <strong>
                            미션 {i + 1} · {m.title}
                          </strong>
                          {mLocked ? (
                            <Badge tone="neutral">잠김</Badge>
                          ) : m.status === 'cleared' ? (
                            <Badge tone="success">완료 · {m.bestRate}%</Badge>
                          ) : (
                            <Badge tone="solid">도전 가능</Badge>
                          )}
                        </span>
                        <span className={styles.missionGoal}>{mLocked ? lockText(i) : `목표: ${m.goal}`}</span>
                      </button>
                    )
                  })}
                </div>
              </GlassCard>

              <GlassCard padding="lg">
                <h2 className={styles.h2}>드로시의 감각 → 뉴런 입력</h2>
                <p className={styles.caption}>
                  게임 속 정보가 어떤 감각 뉴런으로 들어가는지 미리 보여줘요. 플레이 중 신경망 패널에서 같은 이름으로 다시 만나요.
                </p>
                <div className={styles.senses}>
                  {SENSES.map((s) => (
                    <div key={s.key} className={styles.sense}>
                      <Icon name={s.icon} size={28} className={styles.senseIcon} />
                      <strong>{s.name}</strong>
                      <span className={styles.senseDesc}>{s.desc}</span>
                      <span className={styles.neuronTag}>감각 뉴런 {s.neurons}</span>
                    </div>
                  ))}
                </div>
                <p className={styles.flow}>
                  <b>감각 뉴런</b> → <b>중간 뉴런</b> → <b>운동 뉴런 M1–M4</b> <span>(왼쪽 · 오른쪽 · 직진 · 멈춤)</span>
                </p>
              </GlassCard>
            </>
          )}

          <GlassCard padding="lg" id="rules">
            <h2 className={styles.h2}>{later ? '보상 규칙 (바뀐 점 강조)' : '보상 규칙'}</h2>
            <ul className={styles.rules}>
              {rules.map((r) => (
                <li key={r.label}>
                  <span className={cx(styles.value, styles[r.tone])}>{r.value}</span>
                  {r.label}
                  {r.isNew && <Badge tone="solid">NEW</Badge>}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <div className={styles.col}>
          <GlassCard padding="lg" className={styles.predict}>
            <span className={styles.eyebrow}>PREDICT · 예측해 보세요</span>
            <h2 className={styles.question}>{briefing.prediction.question}</h2>
            <div className={styles.options} role="radiogroup" aria-label="예측">
              {briefing.prediction.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={choice === o}
                  className={cx(styles.option, choice === o && styles.optionOn)}
                  onClick={() => choose(o)}
                >
                  <span className={styles.radio} aria-hidden />
                  {o}
                </button>
              ))}
            </div>
            {later ? (
              prev && (
                <p className={styles.prevNote}>
                  미션 {index}의 예측 결과는 성장 리포트에서 확인할 수 있어요.
                </p>
              )
            ) : (
              <p className={styles.note}>정답은 성장 리포트에서 공개돼요. 맞히면 도감 카드에 "예언가" 배지가 붙어요.</p>
            )}
          </GlassCard>

          <GlassCard padding="lg" className={styles.startCard}>
            <Button size="lg" block onClick={start} disabled={locked}>
              {later ? `미션 ${index + 1} 훈련 시작하기` : '훈련 시작하기'}
            </Button>
            {later ? (
              <Button block variant="secondary" to={`/experiments/${id}/missions/${missions[0].id}/briefing`}>
                미션 1 다시 보기
              </Button>
            ) : (
              <Button block variant="secondary" onClick={() => setRulesOpen(true)}>
                규칙 자세히 보기
              </Button>
            )}
            <span className={styles.foot}>
              {locked
                ? lockText(index)
                : later
                  ? `예상 ${experiment.durationMin}분 · 미션 1 기록은 유지돼요`
                  : `예상 소요 · 약 ${experiment.durationMin}분 · 언제든 저장돼요`}
            </span>
          </GlassCard>
        </div>
      </div>

      <Modal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        size="md"
        eyebrow={`MISSION ${index + 1} · ${mission.title}`}
        title="규칙 자세히 보기"
        showClose
        footer={<Button onClick={start}>훈련 시작하기</Button>}
      >
        <h3 className={styles.h3}>목표</h3>
        <ul className={styles.objectives}>
          {briefing.objectives.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <h3 className={styles.h3}>보상</h3>
        <ul className={styles.rules}>
          {rules.map((r) => (
            <li key={r.label}>
              <span className={cx(styles.value, styles[r.tone])}>{r.value}</span>
              {r.label}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}
