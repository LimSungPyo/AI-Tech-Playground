import { Outlet, ScrollRestoration } from 'react-router'
import { OverlayProvider } from '../components/overlay/OverlayProvider'

/** 모든 라우트의 바탕. 전역 팝업(useModal) · 토스트(useToast) provider와 스크롤 복원 */
export function RootLayout() {
  return (
    <OverlayProvider>
      <Outlet />
      <ScrollRestoration />
    </OverlayProvider>
  )
}
