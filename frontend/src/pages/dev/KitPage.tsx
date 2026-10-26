import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ActionSheet,
  Alert,
  Avatar,
  Badge,
  Banner,
  BannerAction,
  BarMini,
  BottomSheet,
  Button,
  CHARACTER_IDS,
  CHARACTERS,
  Character,
  Checkbox,
  Chip,
  Divider,
  Drawer,
  EmptyState,
  GlassCard,
  Icon,
  IconButton,
  Info,
  Input,
  LineChart,
  Logo,
  MASCOT_EXPRESSIONS,
  MASCOT_LABELS,
  Mascot,
  Modal,
  Notify,
  OtpInput,
  PasswordInput,
  Popover,
  ProgressBar,
  Radio,
  SectionHeader,
  SegmentedControl,
  Select,
  Skeleton,
  Sparkline,
  Spinner,
  Stat,
  Tabs,
  Tag,
  Textarea,
  Toast,
  Toggle,
  WeekGrass,
  iconNames,
  useModal,
  useToast,
} from '../../components'
import styles from './KitPage.module.css'

// 개발용 쇼케이스(/_kit). 메뉴에는 없다. 페이지 slave는 여기서 쓰는 법을 보고 따라 쓴다.

const CURVE = [0, 4, 8, 11, 12, 14, 18, 22, 27, 31, 34].map((t, i) => ({
  x: t,
  y: [12, 14, 13, 20, 24, 30, 35, 41, 47, 52, 58][i],
}))
const FIRST = CURVE.map((p) => ({ x: p.x, y: 12 + p.x * 0.1 }))
const WEEK = [
  { day: '토', minutes: 12 },
  { day: '일', minutes: 18 },
  { day: '월', minutes: 40 },
  { day: '화', minutes: 10 },
  { day: '수', minutes: 30 },
  { day: '목', minutes: 0 },
  { day: '금', minutes: 42 },
]

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.section}>
      <SectionHeader eyebrow={id} title={title} />
      {children}
    </section>
  )
}

function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className={styles.rowWrap}>
      {label && <p className={styles.rowLabel}>{label}</p>}
      <div className={styles.row}>{children}</div>
    </div>
  )
}

export default function KitPage() {
  const modal = useModal()
  const toast = useToast()
  const [open, setOpen] = useState<null | 'modal' | 'alert' | 'info' | 'notify' | 'sheet' | 'drawer' | 'bottom'>(null)
  const [pop, setPop] = useState(false)
  const popRef = useRef<HTMLButtonElement>(null)
  const [tab, setTab] = useState<'all' | 'exp' | 'char'>('all')
  const [seg, setSeg] = useState<'intro' | 'basic' | 'advanced'>('basic')
  const [chips, setChips] = useState<string[]>(['강화학습'])
  const [otp, setOtp] = useState('')
  const [toggle, setToggle] = useState(true)
  const [radio, setRadio] = useState('beginner')
  const [text, setText] = useState('')
  const [last, setLast] = useState('—')
  const close = () => setOpen(null)

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <Badge tone="indigo" mono size="md">
          DEV · /_kit
        </Badge>
        <h1>Glass Kit · 공통 컴포넌트</h1>
        <p>
          모든 공통 UI · 팝업 · 마스코트를 한곳에 모았어요. 사용법은 <code>src/components/README.md</code>와 이 파일(
          <code>src/pages/dev/KitPage.tsx</code>)을 보세요.
        </p>
        <nav className={styles.toc}>
          {['tokens', 'buttons', 'badges', 'forms', 'nav', 'data', 'charts', 'popups', 'banners', 'mascot', 'states'].map((s) => (
            <a key={s} href={`#${s}`}>
              {s}
            </a>
          ))}
        </nav>
      </header>

      <Section id="tokens" title="유리 카드 · 색 토큰">
        <div className={styles.grid4}>
          <GlassCard>
            <p className={styles.caption}>clear (55%)</p>
            <Stat label="TRIAL" value="12" caption="성공률 42%" size="lg" />
          </GlassCard>
          <GlassCard variant="clear">
            <GlassCard variant="nested" padding="sm">
              <p className={styles.caption}>nested (45%) · 유리 안 타일</p>
            </GlassCard>
          </GlassCard>
          <GlassCard variant="tint">
            <p>tint · 주요 버튼 · 선택 칩</p>
          </GlassCard>
          <GlassCard variant="dark">
            <Badge tone="cyan" mono>
              TECH DROP · D-14
            </Badge>
            <p className={styles.darkTitle}>#002 RAG 탐정</p>
          </GlassCard>
        </div>
        <div className={styles.swatches}>
          {[
            'bg-cream',
            'bg-peach',
            'bg-lavender',
            'bg-butter',
            'bg-lilac',
            'text-primary',
            'text-secondary',
            'text-tertiary',
            'accent-indigo',
            'accent-indigo-light',
            'accent-yellow',
            'accent-why',
            'accent-success',
            'accent-danger',
            'accent-cyan',
            'glass-dark',
          ].map((c) => (
            <div key={c} className={styles.swatch}>
              <span style={{ background: `var(--color-${c})` }} />
              <code>--color-{c}</code>
            </div>
          ))}
        </div>
        <GlassCard interactive className={styles.mt}>
          <p>interactive — 호버하면 살짝 떠올라요</p>
        </GlassCard>
      </Section>

      <Section id="buttons" title="버튼 · 아이콘">
        <Row label="variant">
          <Button>실험 시작하기</Button>
          <Button variant="secondary">기술 카드</Button>
          <Button variant="ghost">자세히 보기</Button>
          <Button variant="why" iconLeft={<Mascot expression="why" size={26} alt="" />}>
            WHY?
          </Button>
          <Button variant="danger">탈퇴하기</Button>
          <Button variant="dark">다크</Button>
        </Row>
        <Row label="size · 아이콘 · 상태">
          <Button size="sm">sm</Button>
          <Button size="md" iconRight={<Icon name="arrow-right" size={18} />}>
            이어서 훈련하기
          </Button>
          <Button size="lg">lg</Button>
          <Button pill={false} variant="secondary">
            pill=false
          </Button>
          <Button loading>저장 중</Button>
          <Button disabled>disabled</Button>
          <Button to="/lab" variant="secondary">
            to=&quot;/lab&quot; (Link)
          </Button>
        </Row>
        <Row label="IconButton">
          <IconButton icon="bell" label="알림" dot />
          <IconButton icon="settings" label="설정" variant="ghost" />
          <IconButton icon="play" label="재생" variant="primary" />
          <IconButton icon="close" label="닫기" size="sm" />
        </Row>
        <Row label="Glass Kit 아이콘 타일 (variant=tile size=lg)">
          {(['flask', 'tree', 'book', 'question', 'play', 'chart'] as const).map((n) => (
            <IconButton key={n} icon={n} label={n} variant="tile" size="lg" />
          ))}
        </Row>
        <div className={styles.icons}>
          {iconNames.map((n) => (
            <span key={n} className={styles.iconCell} title={n}>
              <Icon name={n} size={22} />
              <code>{n}</code>
            </span>
          ))}
        </div>
      </Section>

      <Section id="badges" title="배지 · 칩 · 태그">
        <Row label="Badge tone">
          <Badge>미션 2 해금됨!</Badge>
          <Badge tone="solid">Lv.7 탐험가</Badge>
          <Badge tone="success">완료</Badge>
          <Badge tone="danger">NEW</Badge>
          <Badge tone="warning">마감 D-1</Badge>
          <Badge tone="why">준비 중</Badge>
          <Badge tone="pink">파트너 · 웜이</Badge>
          <Badge tone="neutral">매주 월요일 업데이트</Badge>
          <Badge tone="dark">FEATURED</Badge>
          <Badge tone="cyan" mono>
            ADMIN
          </Badge>
          <Badge mono>CONTINUE</Badge>
          <Badge tone="warning" dot size="md">
            6일 연속 학습 중
          </Badge>
        </Row>
        <Row label="Chip (선택)">
          {['강화학습', '커넥톰', 'LLM', '에이전트'].map((c) => (
            <Chip
              key={c}
              selected={chips.includes(c)}
              onClick={() => setChips((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}
            >
              {c}
            </Chip>
          ))}
          <Chip count={12}>기술 레이더</Chip>
        </Row>
        <Row label="Tag">
          <Tag>최전선</Tag>
          <Tag>10분</Tag>
          <Tag>강화학습 · 커넥톰</Tag>
          <Tag icon={<Icon name="lock" size={12} />}>잠김</Tag>
        </Row>
      </Section>

      <Section id="forms" title="입력">
        <div className={styles.grid2}>
          <GlassCard radius="popup" padding="lg" className={styles.stack}>
            <Input label="이메일" placeholder="you@example.com" defaultValue="hyewon@playground.ai" success />
            <PasswordInput
              label="비밀번호"
              defaultValue="password"
              error="비밀번호가 맞지 않아요. 5회 틀리면 10분간 잠겨요. (2 / 5)"
              labelRight={
                <a href="#forms" className={styles.link}>
                  비밀번호를 잊었나요?
                </a>
              }
            />
            <Input label="검색" placeholder="검색 (⌘K)" iconLeft={<Icon name="search" size={18} />} hint="hint 문구" />
            <Select
              label="문의 유형"
              placeholder="선택해 주세요"
              defaultValue=""
              options={[
                { value: 'account', label: '계정' },
                { value: 'exp', label: '실험' },
                { value: 'etc', label: '기타' },
              ]}
            />
            <Textarea
              label="내용"
              placeholder="자세히 적어 주세요"
              maxLength={500}
              showCount
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </GlassCard>
          <GlassCard radius="popup" padding="lg" className={styles.stack}>
            <Checkbox label="로그인 상태 유지 (30일)" defaultChecked />
            <Checkbox label="마케팅 수신 동의 (선택)" description="새 실험(Tech Drop) 소식 받기" />
            <Toggle
              label="이메일 알림"
              description="배지 · 문의 답변"
              checked={toggle}
              onChange={(e) => setToggle(e.target.checked)}
            />
            <div className={styles.stackSm} role="radiogroup" aria-label="수준">
              {[
                ['beginner', '처음이에요'],
                ['intermediate', '조금 알아요'],
                ['advanced', '잘 알아요'],
              ].map(([v, l]) => (
                <Radio key={v} name="skill" value={v} label={l} checked={radio === v} onChange={() => setRadio(v)} />
              ))}
            </div>
            <Divider label="OtpInput (6칸)" />
            <OtpInput value={otp} onChange={setOtp} onComplete={(v) => toast.show({ title: `코드 ${v} 입력 완료` })} />
            <OtpInput value="123" onChange={() => {}} error />
          </GlassCard>
        </div>
      </Section>

      <Section id="nav" title="탭 · 세그먼트">
        <Row>
          <Tabs
            label="알림 종류"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'all', label: '전체', count: 5 },
              { value: 'exp', label: '실험' },
              { value: 'char', label: '캐릭터' },
            ]}
          />
        </Row>
        <Row>
          <SegmentedControl
            label="수준"
            value={seg}
            onChange={setSeg}
            items={[
              { value: 'intro', label: '입문' },
              { value: 'basic', label: '기초' },
              { value: 'advanced', label: '심화' },
            ]}
          />
          <SegmentedControl
            size="sm"
            value={seg}
            onChange={setSeg}
            items={[
              { value: 'intro', label: '입문' },
              { value: 'basic', label: '기초' },
              { value: 'advanced', label: '심화' },
            ]}
          />
        </Row>
      </Section>

      <Section id="data" title="숫자 · 진행 · 아바타">
        <div className={styles.grid4}>
          <GlassCard>
            <Stat label="현재 성공률" value="58%" />
          </GlassCard>
          <GlassCard>
            <Stat label="어제보다" value="+6%p" trend="up" />
          </GlassCard>
          <GlassCard>
            <Stat label="총 실험 시간" value="3h 42m" caption="이번 주 +48m" />
          </GlassCard>
          <GlassCard>
            <Stat label="첫 실험 완료율" value="71%" delta="-2.1%p" size="sm" />
          </GlassCard>
        </div>
        <div className={styles.grid2}>
          <GlassCard className={styles.stack}>
            <ProgressBar value={34} max={100} valueLabel="Trial 34 / 100" />
            <ProgressBar label="기초" value={3} max={3} tone="success" valueLabel="3 / 3" />
            <ProgressBar label="최전선" value={1} max={2} tone="dark" valueLabel="1 / 2" size="lg" />
          </GlassCard>
          <GlassCard>
            <Row>
              <Avatar character="wormy" name="혜원" size={56} />
              <Avatar character="drosi" size={40} ring />
              <Avatar name="전혜원" size={40} />
              <Avatar character="owl" size={32} />
            </Row>
          </GlassCard>
        </div>
      </Section>

      <Section id="charts" title="차트 (SVG)">
        <div className={styles.grid2}>
          <GlassCard>
            <p className={styles.cardTitle}>성장 곡선 · T1 → T34</p>
            <LineChart
              data={CURVE}
              compare={FIRST}
              events={[{ x: 22, label: '미션 1 성공' }]}
              xTicks={[0, 10, 20, 34]}
              formatX={(x) => `T${x}`}
            />
          </GlassCard>
          <GlassCard>
            <p className={styles.cardTitle}>최근 7일 · DAU (BarMini + line)</p>
            <BarMini
              data={['10.12', '10.13', '10.14', '10.15', '10.16', '10.17', '10.18'].map((d, i) => ({
                label: d,
                value: [820, 880, 940, 900, 1080, 1120, 1284][i],
              }))}
              line={[12, 14, 15.5, 13.5, 16.8, 17.5, 18.4]}
            />
          </GlassCard>
          <GlassCard>
            <p className={styles.cardTitle}>이번 주 (WeekGrass)</p>
            <WeekGrass days={WEEK} />
          </GlassCard>
          <GlassCard>
            <p className={styles.cardTitle}>Sparkline · LineChart bare</p>
            <Row>
              <Tag>
                Tool Calling <Sparkline values={[3, 4, 6, 9, 14]} />
              </Tag>
              <Tag>
                World Model <Sparkline values={[9, 8, 8, 7]} />
              </Tag>
            </Row>
            <LineChart data={CURVE} bare height={80} />
          </GlassCard>
        </div>
      </Section>

      <Section id="popups" title="팝업 키트">
        <Row label="useModal() — Promise로 결과를 받는다">
          <Button
            onClick={async () => {
              const ok = await modal.alert({
                title: '저장할까요?',
                message: '지금까지의 실험 기록을\n계정에 저장해 둘 수 있어요',
                confirmLabel: '저장하기',
                cancelLabel: '나중에',
              })
              setLast(`alert → ${ok}`)
            }}
          >
            alert
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await modal.info({ title: '메일을 보냈어요', message: '받은편지함에서 링크를 눌러\n비밀번호를 다시 만들어 주세요' })
              setLast('info → 닫힘')
            }}
          >
            info
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const ok = await modal.notify({
                title: '새 실험이 열렸어요',
                message: '#002 RAG 실험이 오픈됐어요.\n지금 확인해 볼까요?',
              })
              setLast(`notify → ${ok}`)
            }}
          >
            notify
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const v = await modal.actionSheet({
                title: '어디서부터 할까요?',
                message: '지난번 Trial 34에서 멈췄어요',
                options: [
                  { value: 'continue', label: '이어하기', tone: 'primary' },
                  { value: 'restart', label: '처음부터' },
                ],
              })
              setLast(`actionSheet → ${v}`)
            }}
          >
            actionSheet
          </Button>
          <Button
            variant="danger"
            onClick={async () =>
              setLast(
                `danger alert → ${await modal.alert({ title: '정말 탈퇴할까요?', message: '30일 뒤 모든 기록이 지워져요.', confirmLabel: '탈퇴하기', tone: 'danger' })}`,
              )
            }
          >
            alert (danger)
          </Button>
          <code className={styles.result}>{last}</code>
        </Row>
        <Row label="useToast()">
          <Button variant="secondary" onClick={() => toast.show({ title: '배지를 받았어요', description: '×10 훈련왕 · 학습 기록에서 볼 수 있어요' })}>
            toast
          </Button>
          <Button variant="secondary" onClick={() => toast.show({ title: '저장했어요', tone: 'success' })}>
            success
          </Button>
          <Button variant="secondary" onClick={() => toast.show({ title: '연결이 끊겼어요', tone: 'danger', duration: 0 })}>
            danger (수동 닫기)
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.show({
                title: '문의 답변이 도착했어요',
                description: 'T-2058 · 방금 전',
                action: { label: '보기', onClick: () => setLast('toast action') },
              })
            }
          >
            action
          </Button>
        </Row>
        <Row label="선언형 컴포넌트 (open 상태를 직접 관리)">
          <Button variant="secondary" onClick={() => setOpen('modal')}>
            Modal
          </Button>
          <Button variant="secondary" onClick={() => setOpen('alert')}>
            Alert
          </Button>
          <Button variant="secondary" onClick={() => setOpen('info')}>
            Info
          </Button>
          <Button variant="secondary" onClick={() => setOpen('notify')}>
            Notify
          </Button>
          <Button variant="secondary" onClick={() => setOpen('sheet')}>
            ActionSheet
          </Button>
          <Button variant="secondary" onClick={() => setOpen('drawer')}>
            Drawer
          </Button>
          <Button variant="secondary" onClick={() => setOpen('bottom')}>
            BottomSheet
          </Button>
          <Button ref={popRef} variant="secondary" onClick={() => setPop((p) => !p)} aria-expanded={pop}>
            Popover
          </Button>
        </Row>

        <Modal
          open={open === 'modal'}
          onClose={close}
          size="md"
          showClose
          media={<Mascot expression="happy" size={88} alt="" />}
          eyebrow="MODAL"
          title="드로시가 기다리고 있어요"
          description="Modal은 제목 · 설명 · 본문 · footer를 자유롭게 조합해요."
          centered
          footer={
            <>
              <Button onClick={close}>이어서 훈련하기</Button>
              <Button variant="secondary" onClick={close}>
                닫기
              </Button>
            </>
          }
        >
          <Input label="본문에 폼도 넣을 수 있어요" placeholder="Tab으로 포커스가 팝업 안에서만 돌아요" />
        </Modal>
        <Alert
          open={open === 'alert'}
          title="저장할까요?"
          message={'지금까지의 실험 기록을\n계정에 저장해 둘 수 있어요'}
          confirmLabel="저장하기"
          cancelLabel="나중에"
          onConfirm={close}
          onCancel={close}
        />
        <Info open={open === 'info'} title="메일을 보냈어요" message="받은편지함에서 링크를 눌러 주세요" onClose={close} />
        <Notify
          open={open === 'notify'}
          title="새 실험이 열렸어요"
          message="#002 RAG 실험이 오픈됐어요."
          onAccept={close}
          onClose={close}
        />
        <ActionSheet
          open={open === 'sheet'}
          title="어디서부터 할까요?"
          message="지난번 Trial 34에서 멈췄어요"
          options={[
            { value: 'continue', label: '이어하기', tone: 'primary' },
            { value: 'restart', label: '처음부터' },
          ]}
          onSelect={close}
          onCancel={close}
        />
        <Drawer
          open={open === 'drawer'}
          onClose={close}
          eyebrow="WHY? 딥다이브"
          title="왜 오른쪽 위로 갔을까?"
          description="비슷한 경험 12번 · 유사도 83%"
        >
          <LineChart data={CURVE} height={180} />
          <p className={styles.mt}>Drawer는 오른쪽에서 들어와요(WHY? · 키워드 상세).</p>
        </Drawer>
        <BottomSheet open={open === 'bottom'} onClose={close} title="웜이와 대화" description="BottomSheet는 아래에서 올라와요.">
          <Button block onClick={close}>
            좋아, 도전할게!
          </Button>
        </BottomSheet>
        <Popover open={pop} onClose={() => setPop(false)} anchorRef={popRef} placement="bottom-start" width={280}>
          <div className={styles.popBody}>
            <p className={styles.cardTitle}>6일 연속 학습 중</p>
            <WeekGrass days={WEEK} size={24} />
          </div>
        </Popover>
      </Section>

      <Section id="banners" title="배너 · 토스트 (정적)">
        <div className={styles.grid2}>
          <Banner title="배지를 받았어요" description="×10 훈련왕 · 학습 기록에서 볼 수 있어요" to="/my/badges" />
          <BannerAction title="문의 답변이 도착했어요" description="T-2058 · 방금 전" actionLabel="보기" to="/support/history" />
          <Toast title="저장했어요" tone="success" />
          <Toast title="WHY? 새 설명" description="비슷한 경험 12번" tone="why" onClose={() => {}} />
        </div>
      </Section>

      <Section id="mascot" title="마스코트 · 캐릭터 · 로고">
        <div className={styles.mascots}>
          {MASCOT_EXPRESSIONS.map((e) => (
            <figure key={e} className={styles.figure}>
              <Mascot expression={e} size={88} />
              <figcaption>
                <code>{e}</code> {MASCOT_LABELS[e]}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className={styles.mascots}>
          {CHARACTER_IDS.map((id) => (
            <figure key={id} className={styles.figure}>
              <Character id={id} size={80} locked={id === 'mappy'} />
              <figcaption>
                <code>{id}</code> {CHARACTERS[id].name} · {CHARACTERS[id].experiment}
              </figcaption>
            </figure>
          ))}
        </div>
        <Row>
          <Logo />
          <Logo iconOnly size={40} />
          <span className={styles.darkChip}>
            <Logo text="Playground" onDark />
          </span>
          <Mascot expression="default" size={64} float />
        </Row>
      </Section>

      <Section id="states" title="빈 상태 · 로딩">
        <div className={styles.grid2}>
          <GlassCard>
            <EmptyState
              title="아직 진행 중인 실험이 없어요"
              description="첫 실험을 시작해 볼까요?"
              action={<Button to="/lab">실험실 가기</Button>}
            />
          </GlassCard>
          <GlassCard className={styles.stack}>
            <Row>
              <Spinner size="sm" />
              <Spinner />
              <Spinner size="lg" />
            </Row>
            <Skeleton shape="text" lines={3} />
            <Row>
              <Skeleton shape="circle" width={48} />
              <Skeleton height={48} />
            </Row>
            <Skeleton height={96} />
          </GlassCard>
        </div>
      </Section>
    </div>
  )
}
