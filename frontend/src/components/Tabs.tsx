import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cx } from './cx'
import styles from './Tabs.module.css'

export interface TabItem<V extends string = string> {
  value: V
  label: ReactNode
  /** 오른쪽 숫자 배지 */
  count?: number
  disabled?: boolean
}

interface TabsBaseProps<V extends string> {
  items: TabItem<V>[]
  value: V
  onChange: (value: V) => void
  className?: string
  /** 스크린리더용 묶음 이름 */
  label?: string
}

function useRovingKeys<V extends string>(items: TabItem<V>[], value: V, onChange: (v: V) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent) => {
    const enabled = items.filter((it) => !it.disabled)
    const idx = enabled.findIndex((it) => it.value === value)
    let next = -1
    if (e.key === 'ArrowRight') next = (idx + 1) % enabled.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + enabled.length) % enabled.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = enabled.length - 1
    if (next < 0) return
    e.preventDefault()
    const v = enabled[next].value
    onChange(v)
    refs.current[items.findIndex((it) => it.value === v)]?.focus()
  }
  return { refs, onKeyDown }
}

/** 밑줄 탭(페이지 안 섹션 전환). 패널은 호출자가 value로 그린다 */
export function Tabs<V extends string>({ items, value, onChange, className, label }: TabsBaseProps<V>) {
  const { refs, onKeyDown } = useRovingKeys(items, value, onChange)
  return (
    <div role="tablist" aria-label={label} className={cx(styles.tabs, className)} onKeyDown={onKeyDown}>
      {items.map((it, i) => {
        const selected = it.value === value
        return (
          <button
            key={it.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={it.disabled}
            className={cx(styles.tab, selected && styles.active)}
            onClick={() => onChange(it.value)}
          >
            {it.label}
            {it.count !== undefined && <span className={styles.count}>{it.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** 유리 pill 안 세그먼트(전체/실험/캐릭터, 입문/기초/심화). 선택 = 인디고 */
export function SegmentedControl<V extends string>({
  items,
  value,
  onChange,
  className,
  label,
  size = 'md',
}: TabsBaseProps<V> & { size?: 'sm' | 'md' }) {
  const { refs, onKeyDown } = useRovingKeys(items, value, onChange)
  return (
    <div role="radiogroup" aria-label={label} className={cx(styles.segmented, styles[size], className)} onKeyDown={onKeyDown}>
      {items.map((it, i) => {
        const selected = it.value === value
        return (
          <button
            key={it.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={it.disabled}
            className={cx(styles.segment, selected && styles.segmentActive)}
            onClick={() => onChange(it.value)}
          >
            {it.label}
            {it.count !== undefined && <span className={styles.count}>{it.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
