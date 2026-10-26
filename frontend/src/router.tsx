// 라우트 정의 파일이라 컴포넌트만 내보내지 않는다(Fast Refresh 대상 아님)
/* oxlint-disable react/only-export-components */
// 모든 라우트. 페이지는 React.lazy로 불러온다(페이지 slave는 각 파일 내부만 바꾸면 된다).
// 라우트 ↔ 파일 목록: src/pages/ROUTES.md
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { RequireAdmin, RequireMember } from './auth/guards'
import { AdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'
import { FocusLayout } from './layouts/FocusLayout'
import { MyLayout } from './layouts/MyLayout'
import { RootLayout } from './layouts/RootLayout'
import { RouteError } from './layouts/RouteError'

const HomePage = lazy(() => import('./pages/home/HomePage'))
const RadarPage = lazy(() => import('./pages/radar/RadarPage'))
const BriefingPage = lazy(() => import('./pages/play/BriefingPage'))
const PlayPage = lazy(() => import('./pages/play/PlayPage'))
const LabPage = lazy(() => import('./pages/lab/LabPage'))
const ExperimentDetailPage = lazy(() => import('./pages/lab/ExperimentDetailPage'))
const RevealPage = lazy(() => import('./pages/report/RevealPage'))
const CardsPage = lazy(() => import('./pages/cards/CardsPage'))
const CardPage = lazy(() => import('./pages/cards/CardPage'))
const SharePage = lazy(() => import('./pages/share/SharePage'))
const CreateYourAiPage = lazy(() => import('./pages/concepts/CreateYourAiPage'))
const RagConceptPage = lazy(() => import('./pages/concepts/RagConceptPage'))
const TreePage = lazy(() => import('./pages/tree/TreePage'))
const DexPage = lazy(() => import('./pages/dex/DexPage'))
const RankingPage = lazy(() => import('./pages/ranking/RankingPage'))
const LoginRequiredPage = lazy(() => import('./pages/errors/LoginRequiredPage'))
const TermsPage = lazy(() => import('./pages/support/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/support/PrivacyPage'))
const MissionClearPage = lazy(() => import('./pages/play/MissionClearPage'))
const ReportPage = lazy(() => import('./pages/report/ReportPage'))
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'))
const PartnerPage = lazy(() => import('./pages/onboarding/PartnerPage'))
const TeamMissionPage = lazy(() => import('./pages/team/TeamMissionPage'))
const TeamMissionResultPage = lazy(() => import('./pages/team/TeamMissionResultPage'))
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'))
const SupportPage = lazy(() => import('./pages/support/SupportPage'))
const SupportHistoryPage = lazy(() => import('./pages/support/SupportHistoryPage'))
const DashboardPage = lazy(() => import('./pages/my/DashboardPage'))
const MyExperimentsPage = lazy(() => import('./pages/my/MyExperimentsPage'))
const MyCharactersPage = lazy(() => import('./pages/my/MyCharactersPage'))
const MyBadgesPage = lazy(() => import('./pages/my/MyBadgesPage'))
const MyHistoryPage = lazy(() => import('./pages/my/MyHistoryPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const ProfileEditPage = lazy(() => import('./pages/settings/ProfileEditPage'))
const PasswordChangePage = lazy(() => import('./pages/settings/PasswordChangePage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))
const SignupDonePage = lazy(() => import('./pages/auth/SignupDonePage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const AccountLockedPage = lazy(() => import('./pages/auth/AccountLockedPage'))
const SocialConflictPage = lazy(() => import('./pages/auth/SocialConflictPage'))
const AccountRestorePage = lazy(() => import('./pages/auth/AccountRestorePage'))
const MaintenancePage = lazy(() => import('./pages/errors/MaintenancePage'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminReauthPage = lazy(() => import('./pages/admin/AdminReauthPage'))
const AdminBlockedPage = lazy(() => import('./pages/admin/AdminBlockedPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminRadarPage = lazy(() => import('./pages/admin/AdminRadarPage'))
const AdminCardsPage = lazy(() => import('./pages/admin/AdminCardsPage'))
const AdminModulesPage = lazy(() => import('./pages/admin/AdminModulesPage'))
const AdminModulePublishPage = lazy(() => import('./pages/admin/AdminModulePublishPage'))
const AdminHomePage = lazy(() => import('./pages/admin/AdminHomePage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminInquiriesPage = lazy(() => import('./pages/admin/AdminInquiriesPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'))
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage'))
const AdminAuditPage = lazy(() => import('./pages/admin/AdminAuditPage'))
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage'))
const KitPage = lazy(() => import('./pages/dev/KitPage'))

export const router = createBrowserRouter([
  {
    // 전역 팝업 · 토스트 provider (라우터 안에 있어야 팝업 안 Link가 동작한다)
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        // 일반 페이지: 헤더 + 푸터
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'radar', element: <RadarPage /> },
          { path: 'experiments/:id/missions/:missionId/briefing', element: <BriefingPage /> },
          { path: 'experiments/:id/play', element: <PlayPage /> },
          { path: 'lab', element: <LabPage /> },
          { path: 'experiments/:id', element: <ExperimentDetailPage /> },
          { path: 'experiments/:id/reveal', element: <RevealPage /> },
          { path: 'cards', element: <CardsPage /> },
          { path: 'cards/:cardId', element: <CardPage /> },
          { path: 'share/:shareId', element: <SharePage /> },
          { path: 'create', element: <CreateYourAiPage /> },
          { path: 'experiments/002/concept', element: <RagConceptPage /> },
          { path: 'tree', element: <TreePage /> },
          { path: 'dex', element: <DexPage /> },
          { path: 'ranking', element: <RankingPage /> },
          { path: 'login-required', element: <LoginRequiredPage /> },
          { path: 'terms', element: <TermsPage /> },
          { path: 'privacy', element: <PrivacyPage /> },
          { path: '_kit', element: <KitPage /> },
          {
            // 회원 전용
            element: <RequireMember />,
            children: [
              { path: 'experiments/:id/missions/:missionId/clear', element: <MissionClearPage /> },
              { path: 'experiments/:id/report', element: <ReportPage /> },
              { path: 'onboarding', element: <OnboardingPage /> },
              { path: 'onboarding/partner', element: <PartnerPage /> },
              { path: 'team-missions/:id', element: <TeamMissionPage /> },
              { path: 'team-missions/:id/result', element: <TeamMissionResultPage /> },
              { path: 'notifications', element: <NotificationsPage /> },
              { path: 'support', element: <SupportPage /> },
              { path: 'support/history', element: <SupportHistoryPage /> },
              {
                // 마이 · 설정: 좌측 사이드바
                element: <MyLayout />,
                children: [
                  { path: 'my', element: <DashboardPage /> },
                  { path: 'my/experiments', element: <MyExperimentsPage /> },
                  { path: 'my/characters', element: <MyCharactersPage /> },
                  { path: 'my/badges', element: <MyBadgesPage /> },
                  { path: 'my/history', element: <MyHistoryPage /> },
                  { path: 'settings', element: <SettingsPage /> },
                  { path: 'settings/profile', element: <ProfileEditPage /> },
                  { path: 'settings/password', element: <PasswordChangePage /> },
                ],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        // 헤더 없는 가운데 카드 화면
        element: <FocusLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'signup', element: <SignupPage /> },
          { path: 'signup/verify', element: <VerifyEmailPage /> },
          { path: 'signup/done', element: <SignupDonePage /> },
          { path: 'password/forgot', element: <ForgotPasswordPage /> },
          { path: 'password/reset', element: <ResetPasswordPage /> },
          { path: 'account/locked', element: <AccountLockedPage /> },
          { path: 'account/social-conflict', element: <SocialConflictPage /> },
          { path: 'account/restore', element: <AccountRestorePage /> },
          { path: 'maintenance', element: <MaintenancePage /> },
          { path: 'admin/login', element: <AdminLoginPage /> },
          { path: 'admin/reauth', element: <AdminReauthPage /> },
          { path: 'admin/blocked', element: <AdminBlockedPage /> },
        ],
      },
      {
        // 관리자 콘솔(관리자 + 재인증 토큰 필요)
        element: <RequireAdmin />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: 'admin', element: <AdminDashboardPage /> },
              { path: 'admin/radar', element: <AdminRadarPage /> },
              { path: 'admin/cards', element: <AdminCardsPage /> },
              { path: 'admin/modules', element: <AdminModulesPage /> },
              { path: 'admin/modules/:id/publish', element: <AdminModulePublishPage /> },
              { path: 'admin/home', element: <AdminHomePage /> },
              { path: 'admin/users', element: <AdminUsersPage /> },
              { path: 'admin/inquiries', element: <AdminInquiriesPage /> },
              { path: 'admin/analytics', element: <AdminAnalyticsPage /> },
              { path: 'admin/notifications', element: <AdminNotificationsPage /> },
              { path: 'admin/audit', element: <AdminAuditPage /> },
            ],
          },
        ],
      },
    ],
  },
])
