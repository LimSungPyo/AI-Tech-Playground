import { useContext } from 'react'
import { ToastContext } from './context'

/** const toast = useToast(); toast.show({ title: '저장했어요', tone: 'success' }) */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast는 <OverlayProvider> 안에서만 쓸 수 있어요')
  return ctx
}
