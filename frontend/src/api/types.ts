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
}

export interface Mission {
  id: string
  title: string
  goal: string
  status: 'cleared' | 'open' | 'locked'
  successThreshold: number
  bestRate?: number
}

export interface ExperimentDetail extends ExperimentSummary {
  description: string
  missions: Mission[]
  stats: { firstTrialRate: number; hundredthTrialRate: number }
  principle: string
  cardId: string
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
}

export interface BatchTraining {
  jobId: string
  fromTrial: number
  toTrial: number
  status: 'running' | 'done'
  progress: number
  trials: CurvePoint[]
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
}

export interface Source {
  title: string
  url: string
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
}

export interface RankingRow {
  rank: number
  nickname: string
  character: CharacterId
  successRate: number
  trials: number
  isMe: boolean
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
  kind: 'badge' | 'experiment' | 'inquiry' | 'team' | 'system'
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
}

export interface Inquiry {
  id: string // "T-2058"
  category: string
  title: string
  body: string
  status: 'received' | 'answered'
  createdAt: string
  answer?: string
}

export interface TeamMission {
  id: string
  title: string
  members: { character: CharacterId; role: string; level: number }[]
  goal: string
  messages: { from: CharacterId; text: string; at: number }[]
  status: 'ready' | 'running' | 'done'
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
  primary: { character: CharacterId; reason: string; score: number }
  alternatives: { character: CharacterId; reason: string }[]
}
export interface MeDashboard {
  user: User
  stats: { experiments: number; trials: number; cards: number; badges: number }
  recent: ExperimentSummary[]
  streak: { days: number; calendar: DayMinutes[] }
  partner: DexEntry
}
export interface MeHistory {
  days: DayMinutes[]
  logs: { date: string; experimentId: string; text: string }[]
}
export interface MeSettings {
  notifications: { email: boolean; push: boolean; marketing: boolean }
  theme: string
  whyLevel: SkillLevel
}
export interface ProfileRequest {
  nickname: string
  avatar: CharacterId
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
}

// ── 콘텐츠 ──
export interface RadarWeek {
  week: string
  updatedAt: string
  keywords: RadarKeyword[]
}
export interface CarouselSlide {
  code: string
  title: string
  body: string
  character: CharacterId
  cta: string
  target: string
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
}
export interface TeamMissionResult {
  mission: TeamMission
  summary: string
  contributions: { character: CharacterId; text: string }[]
}

// ── 알림 · 문의 ──
export interface InquiryRequest {
  category: string
  title: string
  body: string
  files?: File[]
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
export interface AdminDashboard {
  kpis: { label: string; value: string | number; delta: string | number }[]
  alerts: { level: string; text: string }[]
  signups: { date: string; count: number }[]
}
export type RadarCandidateStatus = 'pending' | 'approved' | 'rejected'
export interface AdminRadar {
  candidates: { id: string; keyword: string; source: string; score: number; status: RadarCandidateStatus }[]
}
export type ModuleStage = 'idea' | 'design' | 'build' | 'qa' | 'live'
export interface AdminModules {
  modules: { id: string; code: string; title: string; stage: ModuleStage; owner: string; updatedAt: string }[]
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
  users: { id: string; nickname: string; email: string; status: AdminUserStatus; joinedAt: string; lastSeenAt: string }[]
}
export type AdminUserAction = 'suspend' | 'warn' | 'restore'
export interface AdminInquiries {
  items: { id: string; kind: 'inquiry' | 'report'; title: string; user: string; status: string; createdAt: string }[]
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
