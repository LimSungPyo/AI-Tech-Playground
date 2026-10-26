import { useState } from 'react'
import { getWhy } from '../../../api'
import type { NeuronActivation, SkillLevel } from '../../../api'
import { Button, Drawer, EmptyState, Mascot, SegmentedControl, Skeleton } from '../../../components'
import { useApi } from '../../../hooks/useApi'
import { neuronName } from '../lib'
import { NeuralNet } from './NeuralNet'
import styles from './WhyDrawer.module.css'

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: '쉬운 말' },
  { value: 'intermediate', label: '자세히' },
  { value: 'advanced', label: '숫자만' },
]

export interface WhyDrawerProps {
  open: boolean
  onClose: () => void
  experimentId: string
  trial: number
  step?: number
  /** 재생한 회차의 뉴런 활성도(없으면 경로만 강조) */
  neurons?: NeuronActivation[]
  defaultLevel?: SkillLevel
  cardId?: string
  onReplay?: () => void
}

/** B-05 WHY? 딥다이브 — 오른쪽 서랍. 쉬운 말 / 자세히 / 숫자만 = GET .../why?level= */
export function WhyDrawer({ open, onClose, experimentId, trial, step, neurons, defaultLevel = 'beginner', cardId, onReplay }: WhyDrawerProps) {
  const [level, setLevel] = useState<SkillLevel>(defaultLevel)
  const { data, error, loading, reload } = useApi(
    open ? (signal) => getWhy(experimentId, trial, level, signal) : null,
    [open, experimentId, trial, level],
  )
  const act = (id: string) => neurons?.find((n) => n.id === id)?.activation
  const at = data?.step ?? step

  return (
    <Drawer
      open={open}
      onClose={onClose}
      className={styles.drawer}
      media={<Mascot expression="why" size={56} alt="" />}
      title={<span className={styles.title}>WHY?</span>}
      description={
        <span className={styles.meta}>
          TRIAL {trial}
          {at !== undefined && ` · STEP ${at}`} · 0.4초 전의 선택
        </span>
      }
    >
      <div className={styles.body}>
        <SegmentedControl items={LEVELS} value={level} onChange={setLevel} size="sm" label="설명 수준" />

        {loading && !data ? (
          <div className={styles.loading}>
            <Skeleton height={88} />
            <Skeleton shape="text" lines={4} />
            <Skeleton height={160} />
          </div>
        ) : error ? (
          <EmptyState
            compact
            expression="confused"
            title="설명을 불러오지 못했어요"
            description={error.message}
            action={<Button size="sm" variant="secondary" onClick={reload}>다시 시도</Button>}
          />
        ) : data ? (
          <>
            <section className={styles.summary}>
              <span className={styles.summaryLabel}>한 줄 요약</span>
              <p>{data.summary}</p>
              {data.detail && <p className={styles.detail}>{data.detail}</p>}
            </section>

            <section className={styles.section}>
              <h3 className={styles.h3}>① 선택 확률</h3>
              <ul className={styles.choices}>
                {data.choices.map((c, i) => (
                  <li key={c.label} className={styles.choice}>
                    <span>{c.label}</span>
                    <span className={styles.track}>
                      <span className={i === 0 ? styles.fillTop : styles.fill} style={{ width: `${c.probability}%` }} />
                    </span>
                    <span className={styles.pct}>{Math.round(c.probability)}%</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.h3}>② 신경 경로</h3>
              <NeuralNet neurons={neurons} path={data.neuronPath} emphasizePath height={170} />
              <div className={styles.pathLabels}>
                {data.neuronPath.map((id) => (
                  <span key={id}>
                    <strong>{neuronName(id)}</strong>
                    {act(id) !== undefined && <em>활성도 {act(id)!.toFixed(2)}</em>}
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.h3}>③ 비슷했던 과거 경험</h3>
              <ul className={styles.cases}>
                {data.similarCases?.length ? (
                  data.similarCases.map((c) => (
                    <li key={c.trial} className={styles.case}>
                      <span className={styles.caseTrial}>T{c.trial}</span>
                      <span>유사도</span>
                      <span className={styles.track}>
                        <span className={styles.fillCase} style={{ width: `${c.similarity}%` }} />
                      </span>
                      <span className={styles.pct}>{Math.round(c.similarity)}%</span>
                      <span className={c.reward >= 0 ? styles.rewardPlus : styles.rewardMinus}>
                        보상 {c.reward >= 0 ? '+' : '−'}
                        {Math.abs(c.reward).toFixed(1)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className={styles.case}>
                    <span className={styles.caseTrial}>{data.similarExperiences}회</span>
                    <span>평균 유사도</span>
                    <span className={styles.track}>
                      <span className={styles.fillCase} style={{ width: `${data.similarity}%` }} />
                    </span>
                    <span className={styles.pct}>{Math.round(data.similarity)}%</span>
                  </li>
                )}
              </ul>
            </section>

            <section className={styles.honest}>
              <span className={styles.honestLabel}>솔직하게 말하면</span>
              <p>확률과 유사도는 실제 계산값이에요. 다만 "냄새", "오른쪽" 같은 뉴런 이름은 이해를 돕기 위해 우리가 붙인 거예요.</p>
            </section>
          </>
        ) : null}

        <footer className={styles.footer}>
          <Button variant="secondary" onClick={onReplay}>
            이 순간 다시 보기
          </Button>
          {cardId && <Button to={`/cards/${cardId}`}>기술 카드에서 원리 보기</Button>}
        </footer>
      </div>
    </Drawer>
  )
}
