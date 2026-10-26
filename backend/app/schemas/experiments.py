"""실험·플레이·리포트·랭킹·공유 요청·응답."""

from typing import Literal

from app.schemas.base import CamelModel
from app.schemas.common import Badge, CharacterId, ExperimentSummary, Mission, PredictionResult


class Prediction(CamelModel):
    question: str
    options: list[str]


class PredictionStat(CamelModel):
    option: str
    pct: float


class BriefingResponse(CamelModel):
    mission: Mission
    story: str
    objectives: list[str]
    prediction: Prediction
    tips: list[str]
    # v2
    prediction_stats: list[PredictionStat] | None = None  # 다른 사용자들의 예측
    my_prediction: str | None = None  # 회원이 이미 고른 예측
    last_prediction: "LastPrediction | None" = None  # G-04 지난 미션 예측 적중


class LastPrediction(CamelModel):
    mission_id: str
    option: str
    correct: bool


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
    # v2
    first_success_trial: int | None = None
    my_prediction: str | None = None
    prediction_correct: bool | None = None


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
    # v2
    mission_title: str | None = None
    prediction: PredictionResult | None = None


WhyLevel = Literal["beginner", "intermediate", "advanced"]

RankingPeriod = Literal["week", "month", "all", "friends"]

BriefingResponse.model_rebuild()
