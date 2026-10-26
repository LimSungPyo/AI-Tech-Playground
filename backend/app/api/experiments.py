"""실험·플레이·리포트·랭킹·공유 API."""

from fastapi import APIRouter

from app.core.auth import OptionalUser
from app.schemas.base import Ok
from app.schemas.common import (
    BatchTraining,
    ExperimentDetail,
    ExperimentSummary,
    Level,
    RankingRow,
    Report,
    TrialResult,
    WhyExplanation,
)
from app.schemas.experiments import (
    BriefingResponse,
    MissionClearResponse,
    PredictRequest,
    RankingPeriod,
    RankingReportRequest,
    SharedResult,
    ShareResponse,
    TrainBatchRequest,
    TrialRequest,
    WhyLevel,
)
from app.services import experiments as service

router = APIRouter(prefix="/api", tags=["experiments"])


@router.get("/experiments", response_model=list[ExperimentSummary])
def list_experiments(level: Level | None = None, q: str | None = None):
    """TODO: 실제로는 실험 목록에 사용자 진행 상황을 합쳐 level·검색어로 거른다."""
    return service.list_experiments(level, q)


@router.get("/experiments/{exp_id}", response_model=ExperimentDetail)
def get_experiment(exp_id: str):
    """TODO: 실제로는 실험·미션 정의와 사용자 진행 상황을 읽는다."""
    return service.get_experiment(exp_id)


@router.get("/experiments/{exp_id}/missions/{mission_id}/briefing", response_model=BriefingResponse)
def briefing(exp_id: str, mission_id: str, user: OptionalUser):
    """TODO: 실제로는 미션의 스토리·목표·예측 문항·보상 규칙과 예측 분포·내 예측을 읽는다."""
    return service.briefing(exp_id, mission_id, user)


@router.post("/experiments/{exp_id}/missions/{mission_id}/predict", response_model=Ok)
def predict(exp_id: str, mission_id: str, body: PredictRequest):
    """TODO: 실제로는 사용자의 예측을 저장해 리포트에서 정답과 비교한다."""
    return service.predict(exp_id, mission_id, body.option)


@router.post("/experiments/{exp_id}/trials", response_model=TrialResult)
def run_trial(exp_id: str, body: TrialRequest):
    """TODO: 실제로는 뉴런 모델로 1회 시뮬레이션하고 보상으로 가중치를 갱신해 기록한다."""
    return service.run_trial(exp_id, body.mission_id, body.speed)


@router.post("/experiments/{exp_id}/train-batch", response_model=BatchTraining)
def train_batch(exp_id: str, body: TrainBatchRequest):
    """TODO: 실제로는 훈련 작업을 큐에 넣고 count회 돌리며 진행률을 갱신한다."""
    return service.train_batch(exp_id, body.mission_id, body.count)


@router.get("/experiments/{exp_id}/trials/{trial}/why", response_model=WhyExplanation)
def why(exp_id: str, trial: int, level: WhyLevel = "beginner"):
    """TODO: 실제로는 트라이얼 기록에서 선택 근거를 읽어 수준별 설명을 만든다."""
    return service.why(exp_id, trial, level)


@router.get("/experiments/{exp_id}/missions/{mission_id}/clear", response_model=MissionClearResponse)
def mission_clear(exp_id: str, mission_id: str):
    """TODO: 실제로는 성공 조건을 확인하고 다음 미션·카드·배지를 해금한다."""
    return service.mission_clear(exp_id, mission_id)


@router.get("/experiments/{exp_id}/report", response_model=Report)
def report(exp_id: str):
    """TODO: 실제로는 트라이얼 기록을 집계해 지표·사건·AI 해설을 만든다."""
    return service.report(exp_id)


@router.get("/experiments/{exp_id}/ranking", response_model=list[RankingRow])
def ranking(exp_id: str, mission: str | None = None, period: RankingPeriod = "week"):
    """TODO: 실제로는 기간·미션별 기록으로 순위를 매기고 내 순위를 붙인다."""
    return service.ranking(exp_id, mission, period)


@router.post("/ranking/report", response_model=Ok)
def report_nickname(body: RankingReportRequest):
    """TODO: 실제로는 닉네임 신고를 관리자 신고 큐에 넣는다."""
    return service.report_nickname(body.nickname, body.reason)


@router.post("/experiments/{exp_id}/share", response_model=ShareResponse)
def share(exp_id: str):
    """TODO: 실제로는 결과 스냅샷을 저장하고 공유 id를 발급한다."""
    return service.share(exp_id)


@router.get("/share/{share_id}", response_model=SharedResult)
def shared_result(share_id: str):
    """TODO: 실제로는 공유 id로 저장된 결과 스냅샷을 읽는다."""
    return service.shared_result(share_id)
