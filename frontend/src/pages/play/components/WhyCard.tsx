import type { WhyExplanation } from '../../../api'
import { Mascot } from '../../../components'
import { fmtDelta, withRo } from '../lib'
import styles from './WhyCard.module.css'

export interface WhyCardProps {
  why: WhyExplanation
  trial: number
  step?: number
  onOpen: () => void
}

/** 게임 화면 위 "WHY? 판단 근거" 카드(B-04 ③). 누르면 WHY? 딥다이브가 열린다 */
export function WhyCard({ why, trial, step, onOpen }: WhyCardProps) {
  const top = why.choices[0]
  // 설명이 가리키는 순간(STEP)은 응답 값을 먼저 쓴다
  const at = why.step ?? step
  return (
    <button type="button" className={styles.card} onClick={onOpen} aria-label="WHY? 딥다이브 열기">
      <span className={styles.head}>
        <Mascot expression="why" size={40} alt="" />
        <span>
          <strong className={styles.title}>WHY? 왜 {top ? withRo(top.label) : '그쪽으로'} 갔을까?</strong>
          <span className={styles.meta}>
            TRIAL {trial}
            {at !== undefined && ` · STEP ${at}`}
          </span>
        </span>
      </span>
      <span className={styles.body}>{why.summary}</span>
      <span className={styles.bars}>
        {why.choices.slice(0, 3).map((c, i) => (
          <span key={c.label} className={styles.row}>
            <span className={styles.choice}>{c.label}</span>
            <span className={styles.track}>
              <span className={i === 0 ? styles.fillTop : styles.fill} style={{ width: `${c.probability}%` }} />
            </span>
            <span className={styles.pct}>{Math.round(c.probability)}%</span>
          </span>
        ))}
      </span>
      <span className={styles.foot}>
        근거 · 유사 상황 {why.similarExperiences}회 · 유사도 {Math.round(why.similarity)}%
        {why.reward !== undefined && ` · 보상 ${fmtDelta(why.reward)}`}
      </span>
    </button>
  )
}
