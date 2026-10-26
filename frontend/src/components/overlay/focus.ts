// 포커스 트랩 · 스크롤 잠금 · ESC 스택(가장 위 오버레이만 닫힌다)

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

export function focusables(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('inert') && el.getClientRects().length > 0,
  )
}

/** Tab/Shift+Tab을 root 안에서 돌린다 */
export function trapTab(e: KeyboardEvent, root: HTMLElement) {
  if (e.key !== 'Tab') return
  const items = focusables(root)
  if (items.length === 0) {
    e.preventDefault()
    root.focus()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (e.shiftKey && (active === first || !root.contains(active))) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && (active === last || !root.contains(active))) {
    e.preventDefault()
    first.focus()
  }
}

const stack: symbol[] = []
export function pushLayer(id: symbol) {
  stack.push(id)
}
export function popLayer(id: symbol) {
  const i = stack.lastIndexOf(id)
  if (i >= 0) stack.splice(i, 1)
}
export const isTopLayer = (id: symbol) => stack[stack.length - 1] === id

let locks = 0
let prevOverflow = ''
export function lockScroll() {
  if (locks++ === 0) {
    prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}
export function unlockScroll() {
  if (--locks <= 0) {
    locks = 0
    document.body.style.overflow = prevOverflow
  }
}
