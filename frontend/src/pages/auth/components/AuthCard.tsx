import type { ReactNode } from 'react'
import { cx } from '../../../components'
import styles from './AuthCard.module.css'

interface AuthCardProps {
  /** 카드 폭(px). 기본 520 */
  width?: number
  centered?: boolean
  className?: string
  children: ReactNode
}

/** FocusLayout 가운데 흰 유리 카드(M-02 · M-03 · E-01 …) */
export function AuthCard({ width = 520, centered, className, children }: AuthCardProps) {
  return (
    <section className={cx(styles.card, centered && styles.centered, className)} style={{ maxWidth: width }}>
      {children}
    </section>
  )
}

/** 진행 단계 칩(1 이메일 입력 · 2 메일 확인 · 3 새 비밀번호) */
export function StepChips({ steps, current, align = 'start' }: { steps: string[]; current: number; align?: 'start' | 'center' }) {
  return (
    <ol className={cx(styles.steps, align === 'center' && styles.stepsCenter)} aria-label="진행 단계">
      {steps.map((s, i) => (
        <li key={s} className={cx(styles.step, i === current && styles.stepOn)} aria-current={i === current ? 'step' : undefined}>
          {i + 1} {s}
        </li>
      ))}
    </ol>
  )
}
