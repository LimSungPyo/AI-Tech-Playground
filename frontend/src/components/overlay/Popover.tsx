import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../cx'
import { focusables, isTopLayer, popLayer, pushLayer } from './focus'
import { usePresence } from './usePresence'
import styles from './Popover.module.css'

/** 화면 가장자리와의 최소 간격(px) */
const VIEWPORT_MARGIN = 8
/** 공간이 아무리 모자라도 이 높이(px)까지는 보여 준다 */
const MIN_HEIGHT = 120

export type PopoverPlacement = 'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'

export interface PopoverProps {
  open: boolean
  onClose: () => void
  /** 기준 요소 */
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
  placement?: PopoverPlacement
  /** 기준 요소와의 간격(px) */
  offset?: number
  width?: number
  /** 열릴 때 첫 포커스 가능 요소로 이동(메뉴) */
  autoFocus?: boolean
  /** 뒤 화면을 살짝 어둡게(D-01 · D-02처럼) */
  dim?: boolean
  label?: string
  role?: 'dialog' | 'menu'
  className?: string
}

/**
 * 기준 요소에 붙어 뜨는 유리 패널(알림 센터 · 프로필 메뉴 · 연속 학습 팝오버).
 * 원하는 쪽에 공간이 모자라면 반대쪽으로 뒤집고, 그래도 모자라면 max-height + 스크롤.
 */
export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  placement = 'bottom-end',
  offset = 12,
  width,
  autoFocus,
  dim,
  label,
  role = 'dialog',
  className,
}: PopoverProps) {
  const [mounted, phase] = usePresence(open, 180)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<CSSProperties>({ visibility: 'hidden' })
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // 실제로 뜬 쪽(아래 공간이 모자라면 위로 뒤집힌다)
  const [side, setSide] = useState<'top' | 'bottom'>(() => (placement.startsWith('top') ? 'top' : 'bottom'))

  const place = useCallback(() => {
    const a = anchorRef.current
    if (!a) return
    const r = a.getBoundingClientRect()
    const [preferred, align = 'center'] = placement.split('-') as ['top' | 'bottom', 'start' | 'end' | 'center' | undefined]
    // 기준 요소 위·아래로 쓸 수 있는 높이. 원하는 쪽이 모자라고 반대쪽이 더 넓으면 뒤집는다
    const below = window.innerHeight - r.bottom - offset - VIEWPORT_MARGIN
    const above = r.top - offset - VIEWPORT_MARGIN
    const height = panelRef.current?.scrollHeight ?? 0
    let next = preferred
    if (preferred === 'bottom' && height > below && above > below) next = 'top'
    else if (preferred === 'top' && height > above && below > above) next = 'bottom'
    const style: CSSProperties = {}
    if (next === 'bottom') style.top = r.bottom + offset
    else style.bottom = window.innerHeight - r.top + offset
    // 뒤집어도 모자라면 남은 높이까지만 보이고 안쪽을 스크롤한다
    style.maxHeight = Math.max(MIN_HEIGHT, next === 'bottom' ? below : above)
    if (align === 'start') style.left = Math.max(VIEWPORT_MARGIN, r.left)
    else if (align === 'end') style.right = Math.max(VIEWPORT_MARGIN, window.innerWidth - r.right)
    else {
      style.left = r.left + r.width / 2
      style.transform = 'translateX(-50%)'
    }
    setSide(next)
    setPos(style)
  }, [anchorRef, placement, offset])

  useLayoutEffect(() => {
    if (!mounted) return
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    // 내용이 늦게 채워져(데이터 로딩) 높이가 바뀌면 다시 자리를 잡는다
    const panel = panelRef.current
    const observer = panel && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => place()) : null
    if (panel && observer) for (const child of Array.from(panel.children)) observer.observe(child)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      observer?.disconnect()
    }
  }, [mounted, place])

  const active = open && mounted
  useEffect(() => {
    if (!active) return
    const id = Symbol('popover')
    pushLayer(id)
    if (autoFocus && panelRef.current) (focusables(panelRef.current)[0] ?? panelRef.current).focus({ preventScroll: true })
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return
      onCloseRef.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTopLayer(id)) {
        onCloseRef.current()
        anchorRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      popLayer(id)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [active, autoFocus, anchorRef])

  if (!mounted) return null
  return createPortal(
    <>
      {dim && <div className={cx(styles.dim, phase === 'enter' && styles.in)} aria-hidden />}
      <div
        ref={panelRef}
        role={role}
        aria-label={label}
        tabIndex={-1}
        className={cx(styles.popover, styles[side], phase === 'enter' && styles.in, className)}
        style={{ ...pos, width }}
      >
        {children}
      </div>
    </>,
    document.body,
  )
}
