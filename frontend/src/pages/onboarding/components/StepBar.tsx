import { Link } from 'react-router'
import { cx } from '../../../components'
import styles from './StepBar.module.css'

const STEPS = ['만나기', '관심사', '수준']

interface Props {
  /** 1~3. 0이면 진행 표시 대신 rightLabel만 */
  step: number
  rightLabel?: string
  skipTo?: string
}

/** 온보딩 상단 진행 표시: 1 만나기 — 2 관심사 — 3 수준 · 건너뛰기 (FocusLayout 헤더 바로 아래) */
export function StepBar({ step, rightLabel, skipTo }: Props) {
  return (
    <div className={styles.bar}>
      {step > 0 ? (
        <ol className={styles.steps} aria-label="온보딩 진행">
          {STEPS.map((label, i) => (
            <li key={label} className={styles.item}>
              {i > 0 && <span className={styles.dash} aria-hidden>—</span>}
              <span
                className={cx(styles.step, i + 1 === step && styles.current, i + 1 < step && styles.done)}
                aria-current={i + 1 === step ? 'step' : undefined}
              >
                {i + 1}&nbsp;&nbsp;{label}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <span />
      )}
      {skipTo ? (
        <Link to={skipTo} className={styles.right}>
          건너뛰기
        </Link>
      ) : (
        rightLabel && <span className={styles.right}>{rightLabel}</span>
      )}
    </div>
  )
}
