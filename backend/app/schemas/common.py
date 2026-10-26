"""contract.md의 공용 타입."""

from typing import Literal

from pydantic import Field

from app.schemas.base import CamelModel

Level = Literal["intro", "basic", "advanced", "frontier"]
CharacterId = Literal["drosi", "wormy", "parrot", "hawk", "owl", "octo", "ants", "memo", "mappy"]
MascotExpression = Literal[
    "default", "confused", "champion", "training", "why", "happy", "scientist", "neuron", "sleep", "mono"
]
Skill = Literal["beginner", "intermediate", "advanced"]


class LastPlayed(CamelModel):
    """v2 · 마지막으로 멈춘 실험 회차(기억된 회원 홈 07:M-01)."""

    experiment_id: str
    code: str
    title: str
    trial: int


class User(CamelModel):
    id: str
    nickname: str
    email: str
    level: int
    avatar: CharacterId
    role: Literal["user", "admin"]
    streak_days: int
    created_at: str
    interests: list[str]
    skill: Skill
    partner: CharacterId | None
    has_played: bool
    # v2
    title: str | None = None  # 레벨 칭호 "탐험가"
    bio: str | None = None
    last_played: LastPlayed | None = None


class TrialProgress(CamelModel):
    trial: int
    max_trial: int
    success_rate: float


class ExperimentVote(CamelModel):
    """v2 · 오픈 투표 중인 실험(#003). status는 coming_soon 그대로 두고 이 필드로 투표 중을 표현한다."""

    vote_id: str
    pct: float
    ends_at: str


class CurvePoint(CamelModel):
    trial: int
    success_rate: float


class ExperimentSummary(CamelModel):
    id: str
    code: str
    title: str
    subtitle: str
    level: Level
    character: CharacterId
    tags: list[str]
    duration_min: int
    status: Literal["open", "in_progress", "locked", "coming_soon"]
    unlock_condition: str | None = None
    progress: TrialProgress | None = None
    thumbnail_color: str
    # v2
    vote: ExperimentVote | None = None
    last_played_at: str | None = None  # /me/experiments에서만
    first_rate: float | None = None  # /me/experiments에서만 · 1회차 성공률
    curve: list[CurvePoint] | None = None  # /me/experiments에서만 · 추세용 듬성듬성한 곡선


class Point(CamelModel):
    x: float
    y: float


class Obstacle(CamelModel):
    x: float
    y: float
    w: float
    h: float
    label: str | None = None


class Scene(CamelModel):
    """v2 · 플레이 장면 배치. 좌표는 0~100 비율."""

    start: Point
    food: Point
    obstacles: list[Obstacle]


class Mission(CamelModel):
    id: str
    title: str
    goal: str
    status: Literal["cleared", "open", "locked"]
    success_threshold: float
    best_rate: float | None = None
    scene: Scene | None = None  # v2


class ExperimentStats(CamelModel):
    first_trial_rate: float
    hundredth_trial_rate: float


class ExperimentDetail(ExperimentSummary):
    description: str
    missions: list[Mission]
    stats: ExperimentStats
    principle: str
    card_id: str
    # v2
    participants: int | None = None  # 참여 3,120명
    avg_improvement: float | None = None  # 평균 향상 +46%p
    scene: Scene | None = None  # 지금 열린 미션의 장면


class NeuronActivation(CamelModel):
    layer: Literal["sensory", "inter", "motor"]
    id: str
    activation: float


class Choice(CamelModel):
    label: str
    probability: float


class SimilarCase(CamelModel):
    trial: int
    similarity: float
    reward: float


class WhyExplanation(CamelModel):
    summary: str
    similar_experiences: int
    similarity: float
    choices: list[Choice]
    level: Skill
    detail: str
    neuron_path: list[str]
    # v2
    similar_cases: list[SimilarCase] | None = None
    reward: float | None = None
    step: int | None = None


class TrialResult(CamelModel):
    trial: int
    success: bool
    path: list[Point]
    first_path: list[Point]
    time_sec: float
    collisions: int
    neurons: list[NeuronActivation]
    why: WhyExplanation
    curve: list[CurvePoint]
    journal: str


class BatchTraining(CamelModel):
    job_id: str
    from_trial: int
    to_trial: int
    status: Literal["running", "done"]
    progress: float
    trials: list["BatchTrial"]
    # v2
    connections: list["ConnectionChange"] | None = None  # 가장 많이 바뀐 연결 TOP 5
    journal: str | None = None


class BatchTrial(CurvePoint):
    # v2
    success: bool | None = None
    time_sec: float | None = None
    path: list[Point] | None = None


class ConnectionChange(CamelModel):
    from_: str = Field(alias="from")
    to: str
    label: str
    delta: float


class Recommendation(CamelModel):
    id: str
    kind: Literal["continue", "in_progress", "card", "experiment"]
    badge: str
    title: str
    body: str
    meta: str
    character: CharacterId
    target: str
    reason: str


class ReportSnapshot(CamelModel):
    trial: int
    success_rate: float
    time_sec: float
    collisions: float


class ReportEvent(CamelModel):
    trial: int
    label: str


class TrialMetric(CamelModel):
    trial: int
    success_rate: float
    time_sec: float
    collisions: float


class Replay(CamelModel):
    first: list[Point]
    last: list[Point]


class PredictionResult(CamelModel):
    option: str
    correct: bool


class Report(CamelModel):
    experiment_id: str
    summary: str
    before: ReportSnapshot
    after: ReportSnapshot
    curve: list[CurvePoint]
    events: list[ReportEvent]
    commentary: str
    next_recommendations: list[Recommendation]
    # v2
    mission_title: str | None = None
    metrics: list[TrialMetric] | None = None  # 회차별 성공률 · 도달 시간 · 충돌 수
    replay: Replay | None = None  # 1회차 · 마지막 회차 경로
    prediction: PredictionResult | None = None
    participants: int | None = None
    avg_improvement: float | None = None


class CardStep(CamelModel):
    kind: Literal["research", "mechanism", "simplification", "implementation"]
    title: str
    body: str


class BiologicalVsDesigned(CamelModel):
    biological: list[str]
    designed: list[str]


class Source(CamelModel):
    title: str
    url: str
    kind: Literal["paper", "code", "community", "news"] | None = None  # v2 · 레이더 출처 종류


class Reveal(CamelModel):
    headline: str
    body: str


class TechCard(CamelModel):
    id: str
    title: str
    experiment_id: str
    steps: list[CardStep]
    biological_vs_designed: BiologicalVsDesigned
    sources: list[Source]
    unlocked: bool
    reveal: Reveal
    status: Literal["draft", "review", "approved", "published"] | None = None  # v2 · 관리자 검토 단계


class Mastery(CamelModel):
    level: int
    max: int
    hint: str


class TreeNode(CamelModel):
    id: str
    title: str
    level: Level
    status: Literal["done", "in_progress", "open", "locked"]
    experiment_id: str | None = None
    character: CharacterId | None = None
    parents: list[str]
    position: Point
    description: str
    unlock_condition: str | None = None
    # v2
    experiment_ids: list[str] | None = None
    mastery: Mastery | None = None


class DexEntry(CamelModel):
    id: str
    character: CharacterId
    name: str
    species: str
    experiment_id: str
    level: int
    title: str
    obtained: bool
    obtained_at: str | None = None
    best_rate: float | None = None
    trials: int | None = None
    why: str
    personality: str
    meet_condition: str
    state: Literal["egg", "baby", "growing", "master"]
    # v2
    play_minutes: int | None = None  # 함께한 시간
    reveal_watched: bool | None = None
    why_count: int | None = None
    badges: list[str] | None = None  # 이 캐릭터로 얻은 배지 id


class RankingRow(CamelModel):
    rank: int
    nickname: str
    character: CharacterId
    success_rate: float
    trials: int
    is_me: bool
    first_success_trial: int | None = None  # v2


class RadarKeyword(CamelModel):
    id: str
    name: str
    change_pct: float
    weeks: list[float]
    summary: str
    related_experiment_id: str | None = None
    sources: list[Source]


class Notification(CamelModel):
    id: str
    kind: Literal["badge", "experiment", "inquiry", "team", "system", "character", "ranking", "radar"]
    title: str
    body: str
    created_at: str
    read: bool
    target: str | None = None


class Badge(CamelModel):
    id: str
    name: str
    description: str
    obtained: bool
    obtained_at: str | None = None
    icon: str
    # v2
    category: str | None = None
    progress: float | None = None  # 0~100
    rarity: float | None = None  # 획득한 사용자 비율(0~100)
    experiment_id: str | None = None
    story: str | None = None
    featured: bool | None = None  # 대표 배지


class Inquiry(CamelModel):
    id: str
    category: str
    title: str
    body: str
    status: Literal["received", "answered"]
    created_at: str
    answer: str | None = None
    # v2
    answered_at: str | None = None
    experiment_id: str | None = None
    trial: int | None = None
    notify: bool | None = None


class TeamMember(CamelModel):
    character: CharacterId
    role: str
    level: int


class TeamEvent(CamelModel):
    kind: Literal["assign", "retrieve", "tool_call", "memory"]
    text: str


class TeamMessage(CamelModel):
    # `from`은 파이썬 예약어라 필드 이름은 from_, JSON 키는 "from"
    from_: CharacterId = Field(alias="from")
    text: str
    at: float
    event: TeamEvent | None = None  # v2 · 시스템 이벤트 줄


class TeamMission(CamelModel):
    id: str
    title: str
    members: list[TeamMember]
    goal: str
    messages: list[TeamMessage]
    status: Literal["ready", "running", "done"]


BatchTraining.model_rebuild()
