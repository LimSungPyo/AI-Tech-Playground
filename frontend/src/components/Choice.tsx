import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import styles from './Choice.module.css'

interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  /** 라벨 아래 회색 설명 */
  description?: ReactNode
}

export function Checkbox({ label, description, className, id, ...rest }: ChoiceProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label htmlFor={inputId} className={cx(styles.row, rest.disabled && styles.disabled, className)}>
      <input id={inputId} type="checkbox" className={styles.native} {...rest} />
      <span className={cx(styles.box, styles.checkbox)} aria-hidden>
        <Icon name="check" size={14} strokeWidth={3} />
      </span>
      {(label || description) && (
        <span className={styles.text}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.desc}>{description}</span>}
        </span>
      )}
    </label>
  )
}

export function Radio({ label, description, className, id, ...rest }: ChoiceProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label htmlFor={inputId} className={cx(styles.row, rest.disabled && styles.disabled, className)}>
      <input id={inputId} type="radio" className={styles.native} {...rest} />
      <span className={cx(styles.box, styles.radio)} aria-hidden />
      {(label || description) && (
        <span className={styles.text}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.desc}>{description}</span>}
        </span>
      )}
    </label>
  )
}

/** on/off 스위치(설정 화면) */
export function Toggle({ label, description, className, id, ...rest }: ChoiceProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label htmlFor={inputId} className={cx(styles.row, styles.toggleRow, rest.disabled && styles.disabled, className)}>
      {(label || description) && (
        <span className={styles.text}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.desc}>{description}</span>}
        </span>
      )}
      <input id={inputId} type="checkbox" role="switch" className={styles.native} {...rest} />
      <span className={styles.track} aria-hidden>
        <span className={styles.thumb} />
      </span>
    </label>
  )
}
