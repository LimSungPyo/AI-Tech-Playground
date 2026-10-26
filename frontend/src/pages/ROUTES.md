# 라우트 → 파일

W1 base가 만든 빈 자리(placeholder) 목록이다. 페이지 slave는 **자기 담당 파일의 내부만** 바꾼다(파일 이동·이름 변경 금지, `export default` 유지).
라우터(`src/router.tsx`)는 `React.lazy`로 각 파일의 default export를 불러온다.

- 레이아웃: `AppLayout`(헤더+푸터), `MyLayout`(마이 사이드바, AppLayout 안), `FocusLayout`(로고만, 가운데 카드), `AdminLayout`(관리자 좌측 내비)
- 회원 전용 라우트는 `RequireMember`가 비회원을 `/login-required?returnTo=`로 보낸다. 관리자 라우트는 `RequireAdmin`이 관리자가 아니면 `/`, 재인증 토큰이 없으면 `/admin/reauth?returnTo=`로 보낸다.
- 경로 파라미터는 `useParams()`로 읽는다. ID 규칙: 실험 `000`~`008`, 미션 `m1`/`m2`, 팀 미션 `t1`, 카드 `card-001`, 공유 `s-hyewon-001`.
- 개발용 쇼케이스: `/_kit` (`src/pages/dev/KitPage.tsx`, W1 소유)

| 경로 | 파일 | 화면 (Figma node) | 레이아웃 · 접근 | 담당 |
|---|---|---|---|---|
| `/` | `src/pages/home/HomePage.tsx` | 0-01 홈 (비회원 · 자동 캐러셀) · M-01 홈 (기억된 회원) · B-02 로그인 홈 · E-03 첫 실험 전 (65:6758 · 68:7478 · 60:8608 · 70:8485) | AppLayout | W2 hub |
| `/radar` | `src/pages/radar/RadarPage.tsx` | D-07 기술 레이더 페이지 · D-08 키워드 상세 드로어 (64:6057 · 64:6639) | AppLayout | W2 hub |
| `/experiments/:id/missions/:missionId/briefing` | `src/pages/play/BriefingPage.tsx` | B-03 미션 브리핑 · G-04 미션 2 브리핑 (60:8979 · 79:17831) | AppLayout | W2 play |
| `/experiments/:id/play` | `src/pages/play/PlayPage.tsx` | B-04 플레이 · G-03 #000 웜이 실험 플레이 · 0-02 게스트 체험 플레이 (60:9184 · 79:17691 · 65:7273) | AppLayout | W2 play |
| `/lab` | `src/pages/lab/LabPage.tsx` | G-01 실험실 (79:10213) | AppLayout | W2 growth |
| `/experiments/:id` | `src/pages/lab/ExperimentDetailPage.tsx` | G-02 실험 상세 (#001 열린 실험) (79:10727) | AppLayout | W2 growth |
| `/experiments/:id/reveal` | `src/pages/report/RevealPage.tsx` | B-09 반전 연출 (60:10356) | AppLayout | W2 growth |
| `/cards` | `src/pages/cards/CardsPage.tsx` | H-10 기술 카드 모음 (81:20063) | AppLayout | W2 growth |
| `/cards/:cardId` | `src/pages/cards/CardPage.tsx` | B-10 기술 카드 (60:10606) | AppLayout | W2 growth |
| `/share/:shareId` | `src/pages/share/SharePage.tsx` | H-04 공유 링크 · 비회원 랜딩 (80:12419) | AppLayout | W2 growth |
| `/create` | `src/pages/concepts/CreateYourAiPage.tsx` | 14 Create Your AI (Builder · 장기) (34:3949) | AppLayout | W2 growth |
| `/experiments/002/concept` | `src/pages/concepts/RagConceptPage.tsx` | 15 #002 RAG 탐정 (Module Concept) (34:4835) | AppLayout | W2 growth |
| `/tree` | `src/pages/tree/TreePage.tsx` | B-12 기술 트리 · H-01 노드 상세 (60:11194 · 80:11503) | AppLayout | W2 world |
| `/dex` | `src/pages/dex/DexPage.tsx` | B-11 AI 도감 · H-02 카드 상세 (60:10823 · 80:11895) | AppLayout | W2 world |
| `/ranking` | `src/pages/ranking/RankingPage.tsx` | H-05 랭킹 전체 · H-06 닉네임 신고 (81:11992 · 81:12239) | AppLayout | W2 world |
| `/login-required` | `src/pages/errors/LoginRequiredPage.tsx` | E-06 로그인이 필요한 페이지 (70:9391) | AppLayout | W2 my |
| `/terms` | `src/pages/support/TermsPage.tsx` | 이용약관 (디자인 없음) | AppLayout | W2 my |
| `/privacy` | `src/pages/support/PrivacyPage.tsx` | 개인정보처리방침 (디자인 없음) | AppLayout | W2 my |
| `/experiments/:id/missions/:missionId/clear` | `src/pages/play/MissionClearPage.tsx` | B-07 미션 성공 (60:9941) | AppLayout · 회원 전용 | W2 play |
| `/experiments/:id/report` | `src/pages/report/ReportPage.tsx` | B-08 성장 리포트 (60:10077) | AppLayout · 회원 전용 | W2 growth |
| `/onboarding` | `src/pages/onboarding/OnboardingPage.tsx` | G-05 온보딩 1단계 · A-02 2단계 · G-06 3단계 (79:18029 · 60:932 · 79:18210) | AppLayout · 회원 전용 | W2 world |
| `/onboarding/partner` | `src/pages/onboarding/PartnerPage.tsx` | A-03 파트너 추천 (60:1074) | AppLayout · 회원 전용 | W2 world |
| `/team-missions/:id` | `src/pages/team/TeamMissionPage.tsx` | B-13 팀 미션 (60:11459) | AppLayout · 회원 전용 | W2 world |
| `/team-missions/:id/result` | `src/pages/team/TeamMissionResultPage.tsx` | H-11 팀 미션 결과 (81:20514) | AppLayout · 회원 전용 | W2 world |
| `/notifications` | `src/pages/notifications/NotificationsPage.tsx` | H-07 알림 전체 (81:12405) | AppLayout · 회원 전용 | W2 my |
| `/support` | `src/pages/support/SupportPage.tsx` | G-07 문의하기 (79:18384) | AppLayout · 회원 전용 | W2 my |
| `/support/history` | `src/pages/support/SupportHistoryPage.tsx` | G-08 내 문의 내역 (79:18545) | AppLayout · 회원 전용 | W2 my |
| `/my` | `src/pages/my/DashboardPage.tsx` | C-02 대시보드 (60:12598) | AppLayout › MyLayout · 회원 전용 | W2 my |
| `/my/experiments` | `src/pages/my/MyExperimentsPage.tsx` | C-03 내 실험 (60:13207) | AppLayout › MyLayout · 회원 전용 | W2 my |
| `/my/characters` | `src/pages/my/MyCharactersPage.tsx` | C-04 내 캐릭터 (60:13635) | AppLayout › MyLayout · 회원 전용 | W2 my |
| `/my/badges` | `src/pages/my/MyBadgesPage.tsx` | C-05 배지 (60:14150) | AppLayout › MyLayout · 회원 전용 | W2 my |
| `/my/history` | `src/pages/my/MyHistoryPage.tsx` | C-06 학습 기록 (60:14421) | AppLayout › MyLayout · 회원 전용 | W2 my |
| `/settings` | `src/pages/settings/SettingsPage.tsx` | C-07 설정 · E-07 로그아웃 · E-08~E-10 탈퇴 (60:14848 · 70:9467 · 70:10106 · 70:10215 · 70:10303) | AppLayout › MyLayout · 회원 전용 | W2 my |
| `/settings/profile` | `src/pages/settings/ProfileEditPage.tsx` | H-08 프로필 편집 (81:19638) | AppLayout › MyLayout · 회원 전용 | W2 my |
| `/settings/password` | `src/pages/settings/PasswordChangePage.tsx` | H-09 비밀번호 변경 (81:19920) | AppLayout › MyLayout · 회원 전용 | W2 my |
| `/login` | `src/pages/auth/LoginPage.tsx` | B-01 로그인 · 0-04 로그인 · M-02 기억된 계정으로 로그인 (60:8439 · 65:8018 · 68:8003) | FocusLayout | W2 auth |
| `/signup` | `src/pages/auth/SignupPage.tsx` | A-01 회원가입 (60:726) | FocusLayout | W2 auth |
| `/signup/verify` | `src/pages/auth/VerifyEmailPage.tsx` | E-01 이메일 인증 코드 (70:8337) | FocusLayout | W2 auth |
| `/signup/done` | `src/pages/auth/SignupDonePage.tsx` | E-02 가입 완료 · 체험 기록 이어받기 (70:8401) | FocusLayout | W2 auth |
| `/password/forgot` | `src/pages/auth/ForgotPasswordPage.tsx` | 0-05 비밀번호 찾기 (65:8187) | FocusLayout | W2 auth |
| `/password/reset` | `src/pages/auth/ResetPasswordPage.tsx` | M-04 새 비밀번호 설정 (68:8134) | FocusLayout | W2 auth |
| `/account/locked` | `src/pages/auth/AccountLockedPage.tsx` | M-03 계정 잠김 (5회 실패) (68:8078) | FocusLayout | W2 auth |
| `/account/social-conflict` | `src/pages/auth/SocialConflictPage.tsx` | M-05 소셜 계정 연결 충돌 (68:8198) | FocusLayout | W2 auth |
| `/account/restore` | `src/pages/auth/AccountRestorePage.tsx` | M-06 탈퇴 유예 계정 복구 (68:8254) | FocusLayout | W2 auth |
| `/maintenance` | `src/pages/errors/MaintenancePage.tsx` | E-12 점검 중 (70:10435) | FocusLayout | W2 my |
| `/admin/login` | `src/pages/admin/AdminLoginPage.tsx` | F-01 관리자 로그인 (2단계 인증) (74:9614) | FocusLayout | W2 admin |
| `/admin/reauth` | `src/pages/admin/AdminReauthPage.tsx` | G-10 관리자 콘솔 진입 · 재인증 (79:19159) | FocusLayout | W2 admin |
| `/admin/blocked` | `src/pages/admin/AdminBlockedPage.tsx` | G-11 관리자 접속 차단 (79:19559) | FocusLayout | W2 admin |
| `/admin` | `src/pages/admin/AdminDashboardPage.tsx` | F-02 대시보드 (76:9308) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/radar` | `src/pages/admin/AdminRadarPage.tsx` | F-03 기술 레이더 검수 (76:9558) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/cards` | `src/pages/admin/AdminCardsPage.tsx` | F-04 기술 카드 편집기 (77:9358) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/modules` | `src/pages/admin/AdminModulesPage.tsx` | F-05 실험 모듈 파이프라인 (77:9587) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/modules/:id/publish` | `src/pages/admin/AdminModulePublishPage.tsx` | F-06 모듈 공개 설정 (77:16857) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/home` | `src/pages/admin/AdminHomePage.tsx` | F-07 홈 캐러셀 · 투표 운영 (77:17091) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/users` | `src/pages/admin/AdminUsersPage.tsx` | F-08 사용자 관리 · F-09 계정 조치 확인 모달 (77:17526 · 77:17785) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/inquiries` | `src/pages/admin/AdminInquiriesPage.tsx` | F-10 문의 · 신고 (77:18033) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/analytics` | `src/pages/admin/AdminAnalyticsPage.tsx` | F-11 데이터 분석 (77:18276) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/notifications` | `src/pages/admin/AdminNotificationsPage.tsx` | F-12 알림 발송 (77:18542) | AdminLayout · 관리자 전용 | W2 admin |
| `/admin/audit` | `src/pages/admin/AdminAuditPage.tsx` | F-13 권한 · 감사 로그 (77:18751) | AdminLayout · 관리자 전용 | W2 admin |
| `*` | `src/pages/errors/NotFoundPage.tsx` | E-11 404 · 페이지 없음 (70:10367) | AppLayout | W2 my |

## 라우트가 아닌 화면
- `src/pages/auth/global/` — 07:M-07 휴면 복귀 웰컴, 08:M-01 세션 만료, 08:M-06 모바일 로그인 바텀시트, 08:M-07 쿠키 동의, 08:L-06 게스트 기록 저장 유도. W2 auth가 컴포넌트로 만들고 master가 App에 붙인다. 세션 만료는 `window`의 `atp:session-expired` 이벤트(`SESSION_EXPIRED_EVENT`)를 들으면 된다.
- 플레이 위 오버레이(B-06 ×10 훈련, B-05 WHY?, E-04, E-05, 07:M-08)는 `src/pages/play/` 안 로컬 컴포넌트로 만든다.

총 {len(R)}개 라우트 + `/_kit`.
