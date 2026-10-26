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


class TrialProgress(CamelModel):
    trial: int
    max_trial: int
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


class Mission(CamelModel):
    id: str
    title: str
    goal: str
    status: Literal["cleared", "open", "locked"]
    success_threshold: float
    best_rate: float | None = None


class ExperimentStats(CamelModel):
    first_trial_rate: float
    hundredth_trial_rate: float


class ExperimentDetail(ExperimentSummary):
    description: str
    missions: list[Mission]
    stats: ExperimentStats
    principle: str
    card_id: str


class Point(CamelModel):
    x: float
    y: float


class NeuronActivation(CamelModel):
    layer: Literal["sensory", "inter", "motor"]
    id: str
    activation: float


class Choice(CamelModel):
    label: str
    probability: float


class WhyExplanation(CamelModel):
    summary: str
    similar_experiences: int
    similarity: float
    choices: list[Choice]
    level: Skill
    detail: str
    neuron_path: list[str]


class CurvePoint(CamelModel):
    trial: int
    success_rate: float


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
    trials: list[CurvePoint]


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


class Report(CamelModel):
    experiment_id: str
    summary: str
    before: ReportSnapshot
    after: ReportSnapshot
    curve: list[CurvePoint]
    events: list[ReportEvent]
    commentary: str
    next_recommendations: list[Recommendation]


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


class RankingRow(CamelModel):
    rank: int
    nickname: str
    character: CharacterId
    success_rate: float
    trials: int
    is_me: bool


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
    kind: Literal["badge", "experiment", "inquiry", "team", "system"]
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


class Inquiry(CamelModel):
    id: str
    category: str
    title: str
    body: str
    status: Literal["received", "answered"]
    created_at: str
    answer: str | None = None


class TeamMember(CamelModel):
    character: CharacterId
    role: str
    level: int


class TeamMessage(CamelModel):
    # `from`은 파이썬 예약어라 필드 이름은 from_, JSON 키는 "from"
    from_: CharacterId = Field(alias="from")
    text: str
    at: float


class TeamMission(CamelModel):
    id: str
    title: str
    members: list[TeamMember]
    goal: str
    messages: list[TeamMessage]
    status: Literal["ready", "running", "done"]
