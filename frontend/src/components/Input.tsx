import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import styles from './Input.module.css'

interface FieldProps {
  label?: ReactNode
  /** 아래 회색 도움말 */
  hint?: ReactNode
  /** 있으면 빨간 테두리 + 메시지 */
  error?: ReactNode
  /** 초록 테두리(검증 통과) */
  success?: boolean
  /** 라벨 줄 오른쪽(예: "비밀번호를 잊었나요?") */
  labelRight?: ReactNode
  className?: string
}

interface FieldShellProps extends FieldProps {
  id: string
  children: ReactNode
}

/** 라벨 + 컨트롤 + 도움말/오류. 직접 만든 입력에도 쓸 수 있다 */
export function Field({ id, label, hint, error, labelRight, className, children }: FieldShellProps) {
  return (
    <div className={cx(styles.field, className)}>
      {(label || labelRight) && (
        <div className={styles.labelRow}>
          {label && (
            <label htmlFor={id} className={styles.label}>
              {label}
            </label>
          )}
          {labelRight}
        </div>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export interface InputProps extends FieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> {
  iconLeft?: ReactNode
  /** 입력 안 오른쪽 요소(버튼·단위) */
  right?: ReactNode
  inputClassName?: string
}

export function Input({
  label,
  hint,
  error,
  success,
  labelRight,
  className,
  iconLeft,
  right,
  inputClassName,
  id,
  ...rest
}: InputProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} labelRight={labelRight} className={className}>
      <div className={cx(styles.control, error ? styles.invalid : success && styles.valid, rest.disabled && styles.disabled)}>
        {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
        <input
          id={fieldId}
          className={cx(styles.input, inputClassName)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
          {...rest}
        />
        {right && <span className={styles.right}>{right}</span>}
      </div>
    </Field>
  )
}

/** 비밀번호 + "보기/숨기기" 토글 */
export function PasswordInput(props: Omit<InputProps, 'type' | 'right'>) {
  const [visible, setVisible] = useState(false)
  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      autoComplete={props.autoComplete ?? 'current-password'}
      right={
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
        >
          {visible ? '숨기기' : '보기'}
        </button>
      }
    />
  )
}

export interface TextareaProps extends FieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  /** maxLength가 있으면 글자 수 표시 */
  showCount?: boolean
}

export function Textarea({ label, hint, error, success, labelRight, className, showCount, id, ...rest }: TextareaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const length = typeof rest.value === 'string' ? rest.value.length : undefined
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} labelRight={labelRight} className={className}>
      <div className={cx(styles.control, styles.area, error ? styles.invalid : success && styles.valid)}>
        <textarea
          id={fieldId}
          className={styles.textarea}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
          {...rest}
        />
        {showCount && rest.maxLength !== undefined && length !== undefined && (
          <span className={styles.count}>
            {length} / {rest.maxLength}
          </span>
        )}
      </div>
    </Field>
  )
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends FieldProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: SelectOption[]
  placeholder?: string
}

export function Select({ label, hint, error, success, labelRight, className, options, placeholder, id, ...rest }: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} labelRight={labelRight} className={className}>
      <div className={cx(styles.control, error ? styles.invalid : success && styles.valid)}>
        <select
          id={fieldId}
          className={styles.select}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
          {...rest}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron}>
          <Icon name="chevron-down" size={18} />
        </span>
      </div>
    </Field>
  )
}
