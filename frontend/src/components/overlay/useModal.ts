import { useContext } from 'react'
import { ModalContext } from './context'

/**
 * 코드로 띄우는 팝업. 결과를 Promise로 돌려준다.
 *   const modal = useModal()
 *   if (await modal.alert({ title: '로그아웃할까요?', confirmLabel: '로그아웃' })) …
 */
export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal은 <OverlayProvider> 안에서만 쓸 수 있어요')
  return ctx
}
