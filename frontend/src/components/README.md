# 공통 컴포넌트 사용법

모두 `src/components/index.ts`에서 가져온다. 실제 모습과 예시 코드는 개발용 화면 **`/_kit`**(`src/pages/dev/KitPage.tsx`)에 다 있다.

```tsx
import { Button, GlassCard, Stat, useModal, useToast } from '../../components'
```

공용 폴더(`components/`, `layouts/`, `styles/`, `api/`, `auth/`, `hooks/`)는 W1 소유다. 페이지에서 더 필요한 컴포넌트는 자기 페이지 폴더 안에 로컬로 만든다.

## 규칙
- 색 · 반경 · 그림자 · 간격 · 모션은 `src/styles/tokens.css`의 CSS 변수만 쓴다(하드코딩 금지, 캐릭터 SVG 제외). 예: `color: var(--color-text-secondary)`, `border-radius: var(--radius-card)`.
- 유리 면이 필요하면 CSS Modules에서 `composes: glass from '../../components/glass.module.css';`(그림자 있는 카드) 또는 `composes: glassFlat …`(얇은 유리). 기본 규칙은 `:where()`라 같은 클래스에 쓴 값이 항상 이긴다. `glass.module.css`를 고치면 dev 서버를 다시 띄운다(composes가 내용을 복사해 캐시한다).
- className 합치기는 `cx('a', cond && 'b')`.
- API는 `src/api`의 함수만, 화면 데이터는 `useApi`로: `const { data, error, loading, reload } = useApi((signal) => getHome(signal), [])`.
- 로그인 상태는 `useAuth()` → `{ user, isMember, isAdmin, status, login, logout, refresh, setToken, setAdminToken }`.

## 레이아웃 · 기본
| 컴포넌트 | 예시 |
|---|---|
| `GlassCard` | `<GlassCard variant="clear \| nested \| tint \| dark" padding="sm \| md \| lg" radius="card \| lg \| popup" interactive>…</GlassCard>` |
| `SectionHeader` | `<SectionHeader eyebrow="HOW IT WORKS" title="오늘의 추천" description="AI 안내자가 기록을 보고 골랐어요" inlineDescription link={{ to: '/radar', label: '전체 보기' }} />` |
| `Divider` | `<Divider />`, `<Divider label="또는 이메일로" />`, `<Divider vertical />` |
| `EmptyState` | `<EmptyState expression="sleep" title="아직 기록이 없어요" description="…" action={<Button to="/lab">실험실 가기</Button>} compact />` |
| `Skeleton` | `<Skeleton height={120} />`, `<Skeleton shape="text" lines={3} />`, `<Skeleton shape="circle" width={44} />` |
| `Spinner` | `<Spinner size="sm \| md \| lg" />` (버튼 안은 `tone="inherit"`) |
| `PagePlaceholder` | `<PagePlaceholder title="B-01 로그인" frame="60:8439" />` (빈 자리 페이지) |

## 버튼 · 칩
| 컴포넌트 | 예시 |
|---|---|
| `Button` | `<Button variant="primary \| secondary \| ghost \| why \| danger \| dark" size="sm \| md \| lg" iconRight={<Icon name="arrow-right" />} loading block>이어서 훈련하기</Button>` · `to`를 주면 Link: `<Button to="/lab">` · `pill={false}`면 반경 16 |
| `IconButton` | `<IconButton icon="bell" label="알림" dot />` · `variant="glass \| ghost \| primary \| tile"` (`tile` + `size="lg"` = Glass Kit 아이콘 타일) |
| `Badge` | `<Badge tone="indigo \| solid \| success \| danger \| warning \| why \| pink \| neutral \| dark \| cyan" mono dot>CONTINUE</Badge>` |
| `Chip` | `<Chip selected={on} onClick={…} count={12}>강화학습</Chip>` (선택 = 인디고) |
| `Tag` | `<Tag>최전선</Tag>` (흰 유리 정보 태그) |
| `Icon` | `<Icon name="flask" size={20} />` · 이름 목록은 `iconNames` 또는 `/_kit` |

## 입력
| 컴포넌트 | 예시 |
|---|---|
| `Input` | `<Input label="이메일" value={v} onChange={…} error="형식이 달라요" success hint="…" iconLeft={<Icon name="search" />} right={…} labelRight={<Link…>} />` |
| `PasswordInput` | `<PasswordInput label="비밀번호" value={pw} onChange={…} />` (보기/숨기기 토글 포함) |
| `Textarea` | `<Textarea label="내용" maxLength={500} showCount value={t} onChange={…} />` |
| `Select` | `<Select label="문의 유형" placeholder="선택해 주세요" options={[{ value: 'a', label: '계정' }]} value={c} onChange={…} />` |
| `Checkbox` · `Radio` · `Toggle` | `<Checkbox label="로그인 상태 유지 (30일)" checked={r} onChange={(e) => setR(e.target.checked)} />` · `<Toggle label="이메일 알림" description="…" />` |
| `OtpInput` | `<OtpInput value={code} onChange={setCode} onComplete={submit} error={bad} />` (6칸, 붙여넣기 지원) |
| `Field` | 직접 만든 입력에 라벨/오류 줄을 붙일 때: `<Field id={id} label="…" error="…">{…}</Field>` |

## 내비 · 데이터
| 컴포넌트 | 예시 |
|---|---|
| `Tabs` | `<Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: '전체', count: 5 }]} />` (밑줄 탭) |
| `SegmentedControl` | `<SegmentedControl value={lv} onChange={setLv} size="sm" items={[{ value: 'basic', label: '기초' }]} />` (유리 pill) |
| `ProgressBar` | `<ProgressBar value={34} max={100} valueLabel="Trial 34 / 100" tone="indigo \| success \| dark \| why \| danger" label="기초" />` |
| `Stat` | `<Stat label="현재 성공률" value="58%" delta="+6%p" caption="이번 주 +48m" size="sm \| md \| lg" onDark />` |
| `Avatar` | `<Avatar character={user.avatar} name={user.nickname} size={40} ring />` (캐릭터 없으면 이니셜) |

## 차트 (SVG, 컨테이너 폭에 맞춤)
| 컴포넌트 | 예시 |
|---|---|
| `LineChart` | `<LineChart data={curve.map((c) => ({ x: c.trial, y: c.successRate }))} compare={first} events={[{ x: 22, label: '미션 1 성공' }]} formatX={(x) => \`T${x}\`} />` · 미니 곡선은 `bare height={80}` |
| `BarMini` | `<BarMini data={[{ label: '10.12', value: 820 }]} line={[12, 14]} showValues />` (마지막 막대 강조, `highlight`로 지정 가능) |
| `Sparkline` | `<Sparkline values={kw.weeks} />` (오르면 초록, 내리면 빨강) |
| `WeekGrass` | `<WeekGrass days={week.days} />` (`{ day: '토', minutes: 12 }` 7개, 마지막이 오늘) |

## 마스코트 · 캐릭터
| 컴포넌트 | 예시 |
|---|---|
| `Mascot` | `<Mascot expression="default \| confused \| champion \| training \| why \| happy \| scientist \| neuron \| sleep \| mono" size={120} float />` |
| `Character` | `<Character id="wormy" size={96} locked />` (`drosi` 포함 9종) · 이름 · 실험 코드는 `CHARACTERS[id]` |
| `Logo` | `<Logo />`, `<Logo iconOnly />`, `<Logo text="Playground" onDark />` |

## 팝업 키트 (`components/overlay/`)
뒤 화면 블러 28 + 잉크 12% 딤, 등장 scale 0.96→1 + fade 220ms, ESC · 바깥 클릭 닫기, 포커스 트랩, 스크롤 잠금.

**코드로 띄우기 — `useModal()` (Promise로 결과)**
```tsx
const modal = useModal()
const ok = await modal.alert({ title: '로그아웃할까요?', message: '…', confirmLabel: '로그아웃', cancelLabel: '취소', tone: 'danger' }) // true/false
await modal.info({ title: '메일을 보냈어요', message: '…' })
const go = await modal.notify({ title: '새 실험이 열렸어요', acceptLabel: '보러 가기' }) // true/false
const pick = await modal.actionSheet({ title: '어디서부터 할까요?', options: [{ value: 'continue', label: '이어하기', tone: 'primary' }, { value: 'restart', label: '처음부터' }] }) // value | null
```

**토스트 — `useToast()`**
```tsx
const toast = useToast()
toast.show({ title: '배지를 받았어요', description: '×10 훈련왕', tone: 'default | success | danger | why', action: { label: '보기', onClick }, duration: 3500 }) // duration 0 = 수동 닫기
```

**선언형 컴포넌트 (open 상태를 직접 관리)**
| 컴포넌트 | 예시 |
|---|---|
| `Modal` | `<Modal open={o} onClose={close} size="sm \| md \| lg \| xl" media={<Mascot …/>} eyebrow="…" title="…" description="…" centered showClose footer={<>…</>}>본문</Modal>` |
| `Alert` · `Info` · `Notify` | `<Alert open title="저장할까요?" confirmLabel="저장하기" cancelLabel="나중에" onConfirm={…} onCancel={…} />` |
| `ActionSheet` | `<ActionSheet open options={[…]} onSelect={(v) => …} onCancel={…} />` |
| `Drawer` | `<Drawer open onClose title="WHY? 딥다이브">…</Drawer>` (오른쪽에서) |
| `BottomSheet` | `<BottomSheet open onClose title="웜이와 대화">…</BottomSheet>` (아래에서) |
| `Popover` | `<Popover open onClose anchorRef={btnRef} placement="bottom-end" width={320} dim>…</Popover>` (기준 요소에 붙음, 바깥 클릭 · ESC 닫기) |
| `Banner` | `<Banner title="배지를 받았어요" description="…" to="/my/badges" />` (목록형) |
| `BannerAction` | `<BannerAction title="문의 답변이 도착했어요" description="T-2058 · 방금 전" actionLabel="보기" onAction={…} />` (버튼형) |
| `Toast` | 정적 표시용. 보통은 `useToast()` |
| `Overlay` | 위 팝업들의 바탕. 새 형태가 필요할 때만 `placement="center \| right \| bottom"`으로 직접 쓴다 |
