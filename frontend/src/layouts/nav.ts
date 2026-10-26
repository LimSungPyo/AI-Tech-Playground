// 레이아웃 내비 정의와 경로 도우미
import type { IconName } from '../components/Icon'

export const MAIN_NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/lab', label: '실험실' },
  { to: '/tree', label: '기술 트리' },
  { to: '/dex', label: 'AI 도감' },
]

/** 현재 위치를 returnTo로 붙인 로그인 경로 */
export function loginPath(loc: { pathname: string; search: string }) {
  const here = loc.pathname + loc.search
  return here === '/' || here.startsWith('/login') ? '/login' : `/login?returnTo=${encodeURIComponent(here)}`
}

/** 마이 영역 사이드바(C-02) · 프로필 메뉴(D-02) 공통 항목 */
export const MY_NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/my', label: '대시보드', icon: 'dashboard', end: true },
  { to: '/my/experiments', label: '내 실험', icon: 'play' },
  { to: '/my/characters', label: '내 캐릭터', icon: 'sparkle' },
  { to: '/my/badges', label: '배지', icon: 'star' },
  { to: '/my/history', label: '학습 기록', icon: 'list' },
  { to: '/settings', label: '설정', icon: 'settings' },
]

/** 관리자 좌측 내비(F-02) */
export const ADMIN_NAV: { group: string; items: { to: string; label: string; icon: IconName; end?: boolean }[] }[] = [
  { group: '운영', items: [{ to: '/admin', label: '대시보드', icon: 'dashboard', end: true }] },
  {
    group: '콘텐츠',
    items: [
      { to: '/admin/radar', label: '기술 레이더', icon: 'radar' },
      { to: '/admin/cards', label: '기술 카드', icon: 'grid' },
      { to: '/admin/modules', label: '실험 모듈', icon: 'layers' },
      { to: '/admin/home', label: '홈 · 투표', icon: 'home' },
    ],
  },
  {
    group: '사용자',
    items: [
      { to: '/admin/users', label: '사용자', icon: 'user' },
      { to: '/admin/inquiries', label: '문의 · 신고', icon: 'mail' },
    ],
  },
  { group: '분석', items: [{ to: '/admin/analytics', label: '데이터 분석', icon: 'chart' }] },
  {
    group: '시스템',
    items: [
      { to: '/admin/notifications', label: '알림 발송', icon: 'send' },
      { to: '/admin/audit', label: '권한 · 감사 로그', icon: 'key' },
    ],
  },
]

/** 푸터 링크 */
export const FOOTER_LINKS = [
  { to: '/', label: '서비스 소개' },
  { to: '/cards', label: '연구 출처' },
  { to: '/support', label: '문의' },
  { to: '/terms', label: '이용약관' },
  { to: '/privacy', label: '개인정보처리방침' },
]
