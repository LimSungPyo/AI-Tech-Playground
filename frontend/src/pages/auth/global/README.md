# 인증 전역 컴포넌트 (`src/pages/auth/global/`)

W2 auth가 만든 전역 팝업 · 배너다. 모두 `useNavigate`를 쓰므로 반드시 **라우터 안**에 붙인다. 팝업 키트(`OverlayProvider`) 안이어야 한다.
`SessionExpiredModal` · `CookieConsentBanner` · `DormantWelcomeModal`은 W3 core가 `src/layouts/GlobalOverlays.tsx`(RootLayout)에 이미 붙였고, 헤더 "로그인"은 `LoginPopup`을 연다. **화면에서 따로 마운트하지 말 것.**

```tsx
import { CookieConsentBanner, DormantWelcomeModal, GuestSaveModal, LoginPopup, SessionExpiredModal } from '../pages/auth/global'
```

| 컴포넌트 | Figma | 열림 방식 | 마운트 위치 |
|---|---|---|---|
| `LoginPopup` | 08:L-01 · L-02 · L-03 · L-04 · L-05 | `open` prop | 헤더 "로그인" 버튼 · 게스트 모달 등 여는 곳 |
| `MobileLoginSheet` | 08:M-06 | `open` prop (LoginPopup이 768px 이하에서 자동 사용) | 보통 직접 쓰지 않음 |
| `SessionExpiredModal` | 08:M-01 | `atp:session-expired` 이벤트로 스스로 열림 | GlobalOverlays(플레이 경로 제외) |
| `DormantWelcomeModal` | 07:M-07 | `open` prop | GlobalOverlays(`/`에서 `me/home.dormant`가 있으면 탭마다 한 번) |
| `CookieConsentBanner` | 08:M-07 | `atp.cookieConsent`가 없으면 스스로 보임 | GlobalOverlays |
| `GuestSaveModal` | 08:L-06 (= 07:0-03) | `open` prop | 게스트 플레이(W2 play) |

## LoginPopup
```tsx
const [open, setOpen] = useState(false)
<Button variant="secondary" onClick={() => setOpen(true)}>로그인</Button>
<LoginPopup open={open} onClose={() => setOpen(false)} />
// 가입부터 열기: initialView="signup" · 비밀번호 찾기부터: initialView="forgot"
// 로그인 뒤 다른 곳으로: returnTo="/my" (없으면 지금 화면에 머문다) · onSuccess={(user) => …}
```
- 화면 전환(로그인 ↔ 회원가입 ↔ 비밀번호 찾기 → 메일 발송 완료)은 팝업 안에서 한다. 열 때마다 처음 화면으로 돌아간다.
- 비밀번호 오류(401 `INVALID_PASSWORD`)는 `remainingAttempts`로 "5번 중 n번 틀렸어요"를 보여 준다. 423이면 팝업을 닫고 `/account/locked`로 간다.
- 소셜 버튼은 `POST /api/auth/social/{provider}`를 부르고, 409면 `/account/social-conflict`로 간다. (개발 확인: 주소에 `?socialCode=conflict`를 붙이면 백엔드 샘플이 409를 준다.)
- 회원가입을 제출하면 팝업을 닫고 `/signup/verify`로 간다.
- 768px 이하 화면에서는 같은 props로 `MobileLoginSheet`(바텀시트)를 대신 그린다.

## SessionExpiredModal
```tsx
<SessionExpiredModal onRelogin={(user) => …} />  // onRelogin은 선택
```
- `src/api/client.ts`가 토큰을 보낸 요청이 401이면 `SESSION_EXPIRED_EVENT`(`atp:session-expired`)를 낸다. 이 모달이 그걸 듣고 열린다. `AuthProvider`도 같은 이벤트로 토큰을 지운다.
- 마지막으로 로그인했던 사용자(없으면 `atp.rememberedEmail`)의 이메일을 칩으로 보여 주고 비밀번호만 받는다. 이메일을 모르면 이메일 입력도 보인다.
- 다시 로그인하면 지금 화면에 그대로 머문다(화면 데이터를 다시 부르려면 `onRelogin`에서 `reload()`).
- 07:M-08 "플레이 중 세션 만료"는 플레이 화면 전용 오버레이라 W2 play 담당이다.

## DormantWelcomeModal
```tsx
<DormantWelcomeModal
  open={open}
  onClose={close}
  daysAway={8}
  highlights={['Tech Drop #002 RAG 탐정이 열렸어요', '기술 레이더가 2번 업데이트됐어요']}
  continueTo="/experiments/001/play"   // 기본 '/'
  exploreTo="/lab"                     // 기본 '/lab'
/>
```
- 날 수 · 바뀐 것 목록 · 이어하기 경로는 `GET /api/me/home`의 `dormant`(`DormantInfo`)에서 받아 넘긴다. (개발 확인: 토큰에 `dormant`가 들어 있으면 샘플이 온다 — `atp.token = "sample-dormant-1"`)

## CookieConsentBanner
```tsx
<CookieConsentBanner onChange={(consent) => …} />  // consent: 'all' | 'essential'
```
- localStorage `atp.cookieConsent`에 `'all'` 또는 `'essential'`을 저장하고 사라진다. "설정"은 분석 쿠키 토글이 있는 작은 모달.

## GuestSaveModal
```tsx
<GuestSaveModal open={trials >= 4 && !dismissed} onClose={() => setDismissed(true)} trials={trials} />
```
- 제목 "벌써 {trials}번째 훈련이에요!". "가입하고 저장" → `/signup`, "계속 체험" → `onClose`.
- 가입 → 인증(`/signup/verify`) → 가입 완료(`/signup/done`)에서 `atp.guestTrials`를 `POST /api/auth/guest/merge`로 보내고 지운다. 응답의 성공률 · 캐릭터 레벨 · 예측을 가입 완료 화면에 보여 준다.

## 로그인 페이지 쿼리 (참고)
- `/login?returnTo=/경로` 로그인 후 복귀(없으면 `/`)
- `/login?mode=form` 기억된 계정 화면(07:M-02)을 건너뛰고 폼 바로 보기 · `&email=` 이메일 미리 채움
- 기억된 계정: "로그인 상태 유지" 체크 시 `atp.rememberedEmail` + `atp.rememberedProfile`(닉네임 · 아바타 · 마지막 로그인 방법 · 멈춘 Trial). 공용 헬퍼 `src/auth/remembered.ts`(`getRememberedProfile` · `rememberAccount` · `forgetAccount`)가 담당하고, 이 폴더 `lib.ts`는 다시 export만 한다
