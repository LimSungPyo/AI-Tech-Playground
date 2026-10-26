import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../cx'
import { focusables, isTopLayer, lockScroll, popLayer, pushLayer, trapTab, unlockScroll } from './focus'
import { usePresence } from './usePresence'
import styles from './Overlay.module.css'

export type OverlayPlacement = 'center' | 'right' | 'bottom'

export interface OverlayProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  placement?: OverlayPlacement
  /** 바깥(딤) 클릭으로 닫기. 기본 true */
  closeOnBackdrop?: boolean
  /** ESC로 닫기. 기본 true */
  closeOnEsc?: boolean
  /** 접근성 이름 */
  label?: string
  labelledBy?: string
  describedBy?: string
  /** alertdialog: 확인이 필요한 경고 */
  role?: 'dialog' | 'alertdialog'
  /** 패널 클래스(크기 · 패딩 조정) */
  panelClassName?: string
  /** 처음 포커스할 요소 선택자(없으면 첫 포커스 가능 요소) */
  initialFocus?: string
}

/** Modal · Drawer · BottomSheet의 공통 바탕. 블러 28 + 잉크 12% 딤, 포커스 트랩, ESC, 스크롤 잠금 */
export function Overlay({
  open,
  onClose,
  children,
  placement = 'center',
  closeOnBackdrop = true,
  closeOnEsc = true,
  label,
  labelledBy,
  describedBy,
  role = 'dialog',
  panelClassName,
  initialFocus,
}: OverlayProps) {
  const [mounted, phase] = usePresence(open)
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  const active = open && mounted

  useEffect(() => {
    if (!active) return
    const id = Symbol('overlay')
    const restore = document.activeElement as HTMLElement | null
    pushLayer(id)
    lockScroll()
    const panel = panelRef.current
    if (panel) {
      const target = (initialFocus && panel.querySelector<HTMLElement>(initialFocus)) || focusables(panel)[0] || panel
      target.focus({ preventScroll: true })
    }
    const onKey = (e: KeyboardEvent) => {
      if (!isTopLayer(id) || !panelRef.current) return
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation()
        onCloseRef.current()
      } else trapTab(e, panelRef.current)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      popLayer(id)
      unlockScroll()
      restore?.focus?.({ preventScroll: true })
    }
  }, [active, closeOnEsc, initialFocus])

  if (!mounted) return null
  return createPortal(
    <div className={cx(styles.root, styles[placement], phase === 'enter' && styles.in)}>
      <div
        className={styles.backdrop}
        aria-hidden
        onClick={closeOnBackdrop ? () => onCloseRef.current() : undefined}
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cx(styles.panel, styles[`panel-${placement}`], panelClassName)}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
