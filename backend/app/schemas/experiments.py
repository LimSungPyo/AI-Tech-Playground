"""실험·플레이·리포트·랭킹·공유 요청·응답."""

from typing import Literal

from app.schemas.base import CamelModel
from app.schemas.common import Badge, CharacterId, ExperimentSummary, Mission


class Prediction(CamelModel):
    question: str
    options: list[str]


class BriefingResponse(CamelModel):
    mission: Mission
    story: str
    objectives: list[str]
    prediction: Prediction
    tips: list[str]


class PredictRequest(CamelModel):
    option: str


class TrialRequest(CamelModel):
    mission_id: str
    speed: float = 1


class TrainBatchRequest(CamelModel):
    mission_id: str
    count: int = 10


class Unlocked(CamelModel):
    kind: str
    id: str
    title: str


class MissionClearResponse(CamelModel):
    mission: Mission
    rate: float
    trials: int
    unlocked: list[Unlocked]
    badge: Badge | None = None


class RankingReportRequest(CamelModel):
    nickname: str
    reason: str


class ShareResponse(CamelModel):
    share_id: str
    url: str


class SharedResult(CamelModel):
    nickname: str
    experiment: ExperimentSummary
    rate: float
    trials: int
    character: CharacterId


WhyLevel = Literal["beginner", "intermediate", "advanced"]
