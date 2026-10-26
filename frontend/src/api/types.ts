// contract.md의 공용 타입과 엔드포인트 요청·응답 타입. 백엔드 Pydantic 스키마와 같은 모양(camelCase).

export type Level = 'intro' | 'basic' | 'advanced' | 'frontier' // 입문·기초·심화·최전선
export type CharacterId = 'drosi' | 'wormy' | 'parrot' | 'hawk' | 'owl' | 'octo' | 'ants' | 'memo' | 'mappy'
export type MascotExpression =
  | 'default'
  | 'confused'
  | 'champion'
  | 'training'
  | 'why'
  | 'happy'
  | 'scientist'
  | 'neuron'
  | 'sleep'
  | 'mono'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export interface User {
  id: string
  nickname: string
  email: string
  level: number
  avatar: CharacterId
  role: 'user' | 'admin'
  streakDays: number
  createdAt: string
  interests: string[]
  skill: SkillLevel
  partner: CharacterId | null
  hasPlayed: boolean
  /** v2 · 레벨 칭호("탐험가"). 사이드바 "Lv.7 탐험가" */
  title?: string
  /** v2 · 마지막으로 멈춘 실험 회차(기억된 회원 홈 07:M-01) */
  lastPlayed?: { experimentId: string; code: string; title: string; trial: number }
}

export interface ExperimentSummary {
  id: string // "001"
  code: string // "#001"
  title: string
  subtitle: string
  level: Level
  character: CharacterId
  tags: string[]
  durationMin: number
  status: 'open' | 'in_progress' | 'locked' | 'coming_soon'
  unlockCondition?: string
  progress?: { trial: number; maxTrial: number; successRate: number }
  thumbnailColor: string
  /** v2 · 오픈 투표 중(#003). status는 coming_soon 그대로 */
  vote?: ExperimentVote
  /** v2 · /me/experiments에서만 */
  lastPlayedAt?: string
  /** v2 · /me/experiments에서만 · 1회차 성공률 */
  firstRate?: number
  /** v2 · /me/experiments에서만 · 추세용 듬성듬성한 곡선 */
  curve?: CurvePoint[]
}

/** v2 */
export interface ExperimentVote {
  voteId: string
  pct: number
  endsAt: string
}

/** v2 · 플레이 장면(좌표 0~100) */
export interface Obstacle {
  x: number
  y: number
  w: number
  h: number
  label?: string
}
export interface Scene {
  start: Point
  food: Point
  obstacles: Obstacle[]
}

export interface Mission {
  id: string
  title: string
  goal: string
  status: 'cleared' | 'open' | 'locked'
  successThreshold: number
  bestRate?: number
  /** v2 */
  scene?: Scene
}

export interface ExperimentDetail extends ExperimentSummary {
  description: string
  missions: Mission[]
  stats: { firstTrialRate: number; hundredthTrialRate: number }
  principle: string
  cardId: string
  /** v2 · 참여 인원(3,120명) */
  participants?: number
  /** v2 · 평균 향상(%p) */
  avgImprovement?: number
  /** v2 · 지금 열린 미션의 장면 */
  scene?: Scene
}

export interface Point {
  x: number
  y: number
}

export interface NeuronActivation {
  layer: 'sensory' | 'inter' | 'motor'
  id: string
  activation: number
}

export interface CurvePoint {
  trial: number
  successRate: number
}

export interface TrialResult {
  trial: number
  success: boolean
  path: Point[]
  firstPath: Point[]
  timeSec: number
  collisions: number
  neurons: NeuronActivation[]
  why: WhyExplanation
  curve: CurvePoint[]
  journal: string
}

export interface WhyExplanation {
  summary: string
  similarExperiences: number
  similarity: number
  choices: { label: string; probability: number }[]
  level: SkillLevel
  detail: string
  neuronPath: string[]
  /** v2 · ③ 비슷했던 과거 경험 */
  similarCases?: { trial: number; similarity: number; reward: number }[]
  /** v2 · 이 선택의 보상(+0.6) */
  reward?: number
  /** v2 · STEP 37 */
  step?: number
}

export interface BatchTraining {
  jobId: string
  fromTrial: number
  toTrial: number
  status: 'running' | 'done'
  progress: number
  trials: BatchTrial[]
  /** v2 · 가장 많이 바뀐 연결 TOP 5 */
  connections?: ConnectionChange[]
  /** v2 · 혼잣말 */
  journal?: string
}
export interface BatchTrial extends CurvePoint {
  /** v2 */
  success?: boolean
  timeSec?: number
  path?: Point[]
}
export interface ConnectionChange {
  from: string
  to: string
  label: string
  delta: number
}

export interface ReportSnapshot {
  trial: number
  successRate: number
  timeSec: number
  collisions: number
}

export interface Report {
  experimentId: string
  summary: string
  before: ReportSnapshot
  after: ReportSnapshot
  curve: CurvePoint[]
  events: { trial: number; label: string }[]
  commentary: string
  nextRecommendations: Recommendation[]
  /** v2 · "미션 1 · 먹이 찾기" */
  missionTitle?: string
  /** v2 · 회차별 성공률 · 도달 시간 · 충돌 수(1~100) */
  metrics?: TrialMetric[]
  /** v2 · 나란히 재생용 1회차 · 마지막 회차 경로 */
  replay?: { first: Point[]; last: Point[] }
  /** v2 */
  prediction?: PredictionResult
  participants?: number
  avgImprovement?: number
}
export interface TrialMetric {
  trial: number
  successRate: number
  timeSec: number
  collisions: number
}
export interface PredictionResult {
  option: string
  correct: boolean
}

export interface TechCard {
  id: string
  title: string
  experimentId: string
  steps: { kind: 'research' | 'mechanism' | 'simplification' | 'implementation'; title: string; body: string }[]
  biologicalVsDesigned: { biological: string[]; designed: string[] }
  sources: Source[]
  unlocked: boolean
  reveal: { headline: string; body: string }
  /** v2 · 관리자 검토 단계 */
  status?: TechCardStatus
}
export type TechCardStatus = 'draft' | 'review' | 'approved' | 'published'

export interface Source {
  title: string
  url: string
  /** v2 · 레이더 출처 종류 */
  kind?: 'paper' | 'code' | 'community' | 'news'
}

export interface TreeNode {
  id: string
  title: string
  level: Level
  status: 'done' | 'in_progress' | 'open' | 'locked'
  experimentId?: string
  character?: CharacterId
  parents: string[]
  position: Point
  description: string
  unlockCondition?: string
  /** v2 · 연결된 실험 여러 개("에이전트 = #003 #004") */
  experimentIds?: string[]
  /** v2 · 숙련도 */
  mastery?: { level: number; max: number; hint: string }
}

export interface DexEntry {
  id: string
  character: CharacterId
  name: string
  species: string
  experimentId: string
  level: number
  title: string // "MASTER" 등
  obtained: boolean
  obtainedAt?: string
  bestRate?: number
  trials?: number
  why: string
  personality: string
  meetCondition: string
  state: 'egg' | 'baby' | 'growing' | 'master'
  /** v2 · 함께한 시간(분) */
  playMinutes?: number
  revealWatched?: boolean
  /** v2 · WHY? 사용 횟수 */
  whyCount?: number
  /** v2 · 이 캐릭터로 얻은 배지 id */
  badges?: string[]
}

export interface RankingRow {
  rank: number
  nickname: string
  character: CharacterId
  successRate: number
  trials: number
  isMe: boolean
  /** v2 */
  firstSuccessTrial?: number
}

export interface Recommendation {
  id: string
  kind: 'continue' | 'in_progress' | 'card' | 'experiment'
  badge: string
  title: string
  body: string
  meta: string
  character: CharacterId
  target: string // 프론트 라우트
  reason: string
}

export interface RadarKeyword {
  id: string
  name: string
  changePct: number
  weeks: number[]
  summary: string
  relatedExperimentId?: string
  sources: Source[]
}

export interface Notification {
  id: string
  kind: 'badge' | 'experiment' | 'inquiry' | 'team' | 'system' | 'character' | 'ranking' | 'radar'
  title: string
  body: string
  createdAt: string
  read: boolean
  target?: string
}

export interface Badge {
  id: string
  name: string
  description: string
  obtained: boolean
  obtainedAt?: string
  icon: string
  /** v2 · "실험" · "이해" · "꾸준함" · "협업 · 확장" */
  category?: string
  /** v2 · 0~100 */
  progress?: number
  /** v2 · 획득한 사용자 비율(0~100) */
  rarity?: number
  experimentId?: string
  story?: string
  /** v2 · 대표 배지 */
  featured?: boolean
}

export interface Inquiry {
  id: string // "T-2058"
  category: string
  title: string
  body: string
  status: 'received' | 'answered'
  createdAt: string
  answer?: string
  /** v2 */
  answeredAt?: string
  experimentId?: string
  trial?: number
  notify?: boolean
}

export interface TeamMission {
  id: string
  title: string
  members: { character: CharacterId; role: string; level: number }[]
  goal: string
  messages: { from: CharacterId; text: string; at: number; event?: TeamEvent }[]
  status: 'ready' | 'running' | 'done'
}
/** v2 · 팀 미션 시스템 이벤트 줄 */
export interface TeamEvent {
  kind: 'assign' | 'retrieve' | 'tool_call' | 'memory'
  text: string
}

// ── 공통 응답 ──
export interface Ok {
  ok: true
}

export interface DayMinutes {
  date: string
  minutes: number
}

// ── 인증 ──
export interface AuthResult {
  token: string
  user: User
}
export interface LoginRequest {
  email: string
  password: string
  remember: boolean
}
export type SocialProvider = 'google' | 'kakao' | 'github'
export interface SignupRequest {
  email: string
  password: string
  nickname: string
  agreeTerms: boolean
  agreeMarketing: boolean
}
export interface SignupResult {
  verificationId: string
  email: string
}
export interface VerifyEmailResult extends AuthResult {
  importedGuestTrials: number
}
/** POST /auth/guest/merge. v2 필드는 E-02 가입 완료 화면용 */
export interface GuestMergeResult {
  merged: number
  experimentId?: string
  successRate?: number
  replays?: number
  character?: { id: CharacterId; level: number; state: string }
  predictions?: string[]
}
/** v2 · POST /auth/verify-email/resend */
export interface ResendResult extends Ok {
  expiresInSec: number
  cooldownSec: number
}
/** v2 · GET /auth/restore/preview */
export interface RestorePreview {
  email: string
  deletionScheduledAt: string
  daysLeft: number
  counts: { experiments: number; characters: number; cards: number; badges: number }
}
/** 401 INVALID_PASSWORD의 error data */
export interface InvalidPasswordData {
  remainingAttempts: number
}
/** 423 ACCOUNT_LOCKED의 error data */
export interface AccountLockedData {
  unlockAt: string
}

// ── 사용자 · 온보딩 ──
export interface MeHome {
  user: User
  continue: {
    experiment: ExperimentSummary
    mission: Mission
    lastPlayedAt: string
    deltaPct: number
    lastWhy: string
  }
  partner: { character: CharacterId; level: number; title: string; message: string }
  week: { totalMinutes: number; days: { day: string; minutes: number }[] }
  recommendations: Recommendation[]
  radar: RadarKeyword[]
  techDrop: { code: string; title: string; dDay: number; subscribed: boolean }
  team: { ready: boolean; text: string; missionId: string }
  /** v2 · 휴면 복귀(07:M-07). 휴면 계정이 아니면 키가 빠진다 */
  dormant?: DormantInfo
}
/** v2 · 07:M-07 휴면 복귀 웰컴 */
export interface DormantInfo {
  daysAway: number
  highlights: string[]
  /** "드로시 깨우고 이어하기" 이동 경로 */
  continueTo?: string
}
export interface OnboardingRequest {
  interests: string[]
  skill: SkillLevel
}
export interface PartnerRecommendation {
  /** greeting은 v2 */
  primary: { character: CharacterId; reason: string; score: number; greeting?: string }
  /** score · greeting은 v2 */
  alternatives: { character: CharacterId; reason: string; score?: number; greeting?: string }[]
}
export interface MeDashboard {
  user: User
  stats: { experiments: number; trials: number; cards: number; badges: number }
  recent: ExperimentSummary[]
  /** best · protectionsLeft는 v2 */
  streak: { days: number; calendar: DayMinutes[]; best?: number; protectionsLeft?: number }
  partner: DexEntry
  /** v2 · 640 / 1,000 XP · Lv.8까지 */
  xp?: { current: number; next: number; nextLevel: number }
  /** v2 · 총 실험 시간(분) */
  totalMinutes?: number
  /** v2 · 이번 주 +48m */
  weekMinutesDelta?: number
  /** v2 · 최고 연속 기록(일) */
  bestStreak?: number
}
export type HistoryPeriod = 'week' | 'month' | 'all'
export type HistoryLogKind = 'training' | 'why' | 'achievement'
export interface MeHistory {
  /** successRate는 v2(학습한 날만) */
  days: (DayMinutes & { successRate?: number })[]
  /** kind는 v2 */
  logs: { date: string; experimentId: string; text: string; kind?: HistoryLogKind }[]
  /** v2 */
  period?: HistoryPeriod
  rangeLabel?: string
  stats?: HistoryStats
  weeklySummary?: { text: string; suggestion: string }
  /** v2 · 내 실험 기록 표(B-11) */
  records?: HistoryRecord[]
}
export interface HistoryStats {
  minutes: number
  minutesDelta: number
  trials: number
  batchRuns: number
  whyViews: number
  whyPeakDate?: string
  rateChange: number
  rateChangeLabel: string
}
export interface HistoryRecord {
  experimentId: string
  missionId: string
  trial: number
  bestRate: number
  status: 'in_progress' | 'cleared' | 'locked'
  lastPlayedAt: string
}
export interface MeSettings {
  notifications: { email: boolean; push: boolean; marketing: boolean }
  theme: string
  whyLevel: SkillLevel
  // v2 (PUT에서 빼면 저장된 값 유지)
  rankingAlert?: boolean
  trainingSpeed?: 1 | 2 | 4
  language?: 'ko' | 'en'
  a11y?: { reduceMotion: boolean; highContrast: boolean; largeText: boolean; captions: boolean }
  privacy?: { publicProfile: boolean; showInRanking: boolean; shareRecords: boolean }
  /** 읽기 전용 */
  connections?: SocialConnection[]
  /** 읽기 전용 */
  passwordChangedAt?: string
  /** 읽기 전용 */
  email?: string
}
export interface SocialConnection {
  provider: SocialProvider
  connected: boolean
  email?: string
}
export interface ProfileRequest {
  nickname: string
  avatar: CharacterId
  /** v2 */
  bio?: string
}
/** v2 */
export interface SocialConnectResult extends Ok {
  provider: SocialProvider
  connected: boolean
}
/** v2 */
export interface ExportResult extends Ok {
  requestedAt: string
  readyInMin: number
  email: string
}
export interface WithdrawResult extends Ok {
  graceDays: number
}

// ── 실험 ──
export interface ExperimentQuery {
  level?: Level
  q?: string
}
export interface MissionBriefing {
  mission: Mission
  story: string
  objectives: string[]
  prediction: { question: string; options: string[] }
  tips: string[]
  /** v2 · 다른 사용자들의 예측 */
  predictionStats?: { option: string; pct: number }[]
  /** v2 · 회원이 이미 고른 예측 */
  myPrediction?: string
  /** v2 · G-04 지난 미션 예측 */
  lastPrediction?: { missionId: string; option: string; correct: boolean }
}
export interface TrialRequest {
  missionId: string
  speed: number
}
export interface MissionClear {
  mission: Mission
  rate: number
  trials: number
  unlocked: { kind: string; id: string; title: string }[]
  badge?: Badge
  /** v2 */
  firstSuccessTrial?: number
  myPrediction?: string
  predictionCorrect?: boolean
}
export interface ShareResult {
  shareId: string
  url: string
}
export interface SharedRecord {
  nickname: string
  experiment: ExperimentSummary
  rate: number
  trials: number
  character: CharacterId
  /** v2 */
  missionTitle?: string
  prediction?: PredictionResult
}
/** v2 · GET /experiments/{id}/ranking 쿼리 */
export interface RankingQuery {
  mission?: string
  period?: 'week' | 'month' | 'all' | 'friends'
}

// ── 콘텐츠 ──
export interface RadarWeek {
  week: string
  updatedAt: string
  keywords: RadarKeyword[]
  /** v2 · 12개 출처 */
  sourceCount?: number
  /** v2 · 글 3,412개 */
  postCount?: number
  /** v2 · AI 해설 */
  commentary?: string
  /** v2 · ?week= 로 고를 수 있는 주(최신순) */
  availableWeeks?: string[]
}
export interface CarouselSlide {
  code: string
  title: string
  body: string
  character: CharacterId
  cta: string
  target: string
  /** v2 */
  badge?: 'FEATURED' | 'NOW OPEN' | 'COMING SOON'
  level?: Level
  durationMin?: number
  tags?: string[]
  /** v2 · 말풍선 "뉴런 302개" · "D-14" */
  bubble?: string
}
export interface Vote {
  id: string
  title: string
  options: { id: string; title: string; votes: number }[]
  myVote?: string
  endsAt: string
}
export interface TechDrop {
  code: string
  title: string
  body: string
  openAt: string
  character: CharacterId
  subscribed: boolean
  /** v2 · 이 실험에서 배워요 */
  learn?: { title: string; body: string }[]
  /** v2 · 시작 조건 */
  conditions?: { label: string; done: boolean }[]
  conditionHint?: string
}
export interface TeamMissionResult {
  mission: TeamMission
  summary: string
  contributions: { character: CharacterId; text: string }[]
  /** v2 */
  metrics?: { messages: number; toolCalls: number; searches: number }
}

// ── 알림 · 문의 ──
export interface InquiryRequest {
  category: string
  title: string
  body: string
  files?: File[]
  /** v2 */
  notify?: boolean
  experimentId?: string
  trial?: number
}
export interface SystemStatus {
  maintenance: boolean
  message?: string
  until?: string
}

// ── 관리자 ──
export interface AdminLoginResult {
  otpRequired: true
  otpId: string
}
export interface AdminOtpResult {
  adminToken: string
  ipVerified: true
}
/** 403 IP_BLOCKED의 error data(v2) */
export interface IpBlockedData {
  ip: string
  at: string
}
export interface AdminDashboard {
  kpis: { label: string; value: string | number; delta: string | number }[]
  alerts: { level: string; text: string }[]
  signups: { date: string; count: number }[]
  /** v2 · 최근 7일 DAU */
  dau?: { date: string; count: number }[]
  /** v2 · 게스트 → 회원 전환율(%) */
  conversion?: { date: string; rate: number }[]
  /** v2 · 시스템 상태 */
  system?: { name: string; status: 'ok' | 'warning' | 'down'; detail: string }[]
}
export type RadarCandidateStatus = 'pending' | 'approved' | 'rejected' | 'merged'
export type RadarDecision = 'approved' | 'rejected' | 'merged'
export interface AdminRadar {
  candidates: {
    id: string
    keyword: string
    source: string
    score: number
    status: RadarCandidateStatus
    /** v2 · 상승률(%) */
    growth?: number
    /** v2 · "#003" */
    linkedModule?: string
    /** v2 · 병합 제안 대상 후보 id */
    mergeInto?: string
    /** v2 · "과장 · 출처 단일" */
    warning?: string
  }[]
}
export type ModuleStage = 'idea' | 'voting' | 'design' | 'build' | 'qa' | 'scheduled' | 'live'
export interface AdminModules {
  modules: {
    id: string
    code: string
    title: string
    stage: ModuleStage
    owner: string
    updatedAt: string
    /** v2 */
    progress?: number
    votePct?: number
    dDay?: number
    note?: string
  }[]
}
/** v2 · GET /admin/cards */
export interface AdminCards {
  cards: {
    id: string
    title: string
    experimentId: string
    status: TechCardStatus
    unlocked: boolean
    author: string
    updatedAt: string
  }[]
}
export interface ModulePublishRequest {
  visibility: string
  openAt: string
  audience: string
}
export interface AdminHome {
  slides: CarouselSlide[]
  vote: Vote
}
export type AdminUserStatus = 'active' | 'dormant' | 'suspended' | 'withdrawing'
export interface AdminUsers {
  users: {
    id: string
    nickname: string
    email: string
    status: AdminUserStatus
    joinedAt: string
    lastSeenAt: string
    /** v2 */
    level?: number
    partner?: CharacterId
  }[]
}
/** reset_password · wipe · unlock은 v2 */
export type AdminUserAction = 'suspend' | 'warn' | 'restore' | 'reset_password' | 'wipe' | 'unlock'
export interface AdminInquiries {
  items: {
    id: string
    kind: 'inquiry' | 'report'
    title: string
    user: string
    status: string
    createdAt: string
    /** v2 */
    body?: string
    category?: string
    answer?: string
    memo?: string
  }[]
}
/** v2 · POST /admin/inquiries/{id}/answer */
export interface AdminInquiryAnswer {
  body: string
  memo?: string
}
/** v2 · GET /admin/notifications */
export interface AdminSentNotifications {
  items: {
    id: string
    title: string
    audience: string
    recipients: number
    sentAt: string
    openRate?: number
    status: 'scheduled' | 'sent'
  }[]
}
export interface AdminAnalytics {
  funnel: { step: string; count: number }[]
  retention: { week: string; rate: number }[]
  experiments: { code: string; plays: number; clearRate: number }[]
}
export interface AdminNotificationRequest {
  audience: string
  title: string
  body: string
  sendAt: string
}
export interface AdminAudit {
  admins: { id: string; name: string; role: string }[]
  logs: { at: string; admin: string; action: string; target: string; ip: string }[]
}
