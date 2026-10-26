import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../cx'
import { focusables, isTopLayer, popLayer, pushLayer } from './focus'
import { usePresence } from './usePresence'
import styles from './Popover.module.css'

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

/** 기준 요소에 붙어 뜨는 유리 패널(알림 센터 · 프로필 메뉴 · 연속 학습 팝오버) */
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

  const place = useCallback(() => {
    const a = anchorRef.current
    if (!a) return
    const r = a.getBoundingClientRect()
    const [side, align = 'center'] = placement.split('-') as ['top' | 'bottom', 'start' | 'end' | 'center' | undefined]
    const style: CSSProperties = {}
    if (side === 'bottom') style.top = r.bottom + offset
    else style.bottom = window.innerHeight - r.top + offset
    if (align === 'start') style.left = Math.max(8, r.left)
    else if (align === 'end') style.right = Math.max(8, window.innerWidth - r.right)
    else {
      style.left = r.left + r.width / 2
      style.transform = 'translateX(-50%)'
    }
    setPos(style)
  }, [anchorRef, placement, offset])

  useLayoutEffect(() => {
    if (!mounted) return
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
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
        className={cx(styles.popover, styles[placement.split('-')[0]], phase === 'enter' && styles.in, className)}
        style={{ ...pos, width }}
      >
        {children}
      </div>
    </>,
    document.body,
  )
}
