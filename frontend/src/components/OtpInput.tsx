import { useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { cx } from './cx'
import styles from './OtpInput.module.css'

export interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  /** 칸 수(기본 6) */
  length?: number
  /** 다 채워지면 호출 */
  onComplete?: (value: string) => void
  error?: boolean
  disabled?: boolean
  autoFocus?: boolean
  label?: string
}

/** 6칸 인증 코드 입력(E-01, F-01). 숫자만, 붙여넣기 지원 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  onComplete,
  error,
  disabled,
  autoFocus,
  label = '인증 코드',
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
    return clean
  }

  const setAt = (i: number, ch: string) => {
    const arr = digits.slice()
    arr[i] = ch
    return commit(arr.join(''))
  }

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) setAt(i, '')
      else if (i > 0) {
        setAt(i - 1, '')
        refs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const clean = commit(e.clipboardData.getData('text'))
    refs.current[Math.min(clean.length, length - 1)]?.focus()
  }

  return (
    <div className={styles.row} role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={cx(styles.cell, d && styles.filled, error && styles.error)}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={d}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`${label} ${i + 1}번째 자리`}
          aria-invalid={error || undefined}
          onKeyDown={onKeyDown(i)}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1)
            if (!ch) return
            setAt(i, ch)
            if (i < length - 1) refs.current[i + 1]?.focus()
          }}
        />
      ))}
    </div>
  )
}
