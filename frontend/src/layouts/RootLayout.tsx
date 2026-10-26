import { Outlet, ScrollRestoration } from 'react-router'
import { OverlayProvider } from '../components/overlay/OverlayProvider'
import { GlobalOverlays } from './GlobalOverlays'

/** 모든 라우트의 바탕. 전역 팝업(useModal) · 토스트(useToast) provider, 인증 전역 팝업, 스크롤 복원 */
export function RootLayout() {
  return (
    <OverlayProvider>
      <Outlet />
      <GlobalOverlays />
      <ScrollRestoration />
    </OverlayProvider>
  )
}
