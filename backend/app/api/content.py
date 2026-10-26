"""기술 카드·트리·도감·레이더·홈·투표·Tech Drop·팀 미션 API."""

from fastapi import APIRouter

from app.core.auth import CurrentUser, OptionalUser
from app.schemas.common import DexEntry, RadarKeyword, TeamMission, TechCard
from app.schemas.content import (
    CarouselResponse,
    RadarResponse,
    SubscribeResponse,
    TeamMissionResult,
    TechDrop,
    TreeResponse,
    Vote,
    VoteRequest,
)
from app.services import content as service

router = APIRouter(prefix="/api", tags=["content"])


@router.get("/cards", response_model=list[TechCard])
def list_cards():
    """TODO: 실제로는 기술 카드 목록에 사용자 해금 여부를 합친다."""
    return service.list_cards()


@router.get("/cards/{card_id}", response_model=TechCard)
def get_card(card_id: str):
    """TODO: 실제로는 카드를 읽고 사용자 열람 기록을 남긴다."""
    return service.get_card(card_id)


@router.get("/tree", response_model=TreeResponse)
def tree():
    """TODO: 실제로는 사용자 실험 완료 기록으로 노드 상태를 계산한다."""
    return service.tree()


@router.get("/dex", response_model=list[DexEntry])
def dex():
    """TODO: 실제로는 캐릭터 정의와 사용자 도감 기록을 합친다."""
    return service.dex()


@router.get("/radar", response_model=RadarResponse)
def radar():
    """TODO: 실제로는 관리자가 승인한 이번 주 키워드를 읽는다."""
    return service.radar()


@router.get("/radar/{keyword_id}", response_model=RadarKeyword)
def radar_keyword(keyword_id: str):
    """TODO: 실제로는 키워드의 추이·출처·연결 실험을 읽는다."""
    return service.radar_keyword(keyword_id)


@router.get("/home/carousel", response_model=CarouselResponse)
def carousel():
    """TODO: 실제로는 관리자가 켠 캐러셀 슬라이드를 정렬 규칙대로 읽는다."""
    return service.carousel()


@router.get("/votes/current", response_model=Vote)
def current_vote(user: OptionalUser):
    """TODO: 실제로는 진행 중인 투표의 집계와 내 투표를 읽는다."""
    return service.current_vote(user)


@router.post("/votes/{vote_id}", response_model=Vote)
def cast_vote(vote_id: str, body: VoteRequest, user: CurrentUser):
    """TODO: 실제로는 1주 1표를 확인하고 투표 응답을 저장한다."""
    return service.cast_vote(vote_id, body.option_id)


@router.get("/tech-drops/{code}", response_model=TechDrop)
def tech_drop(code: str):
    """TODO: 실제로는 오픈 예정 실험과 내 알림 신청 여부를 읽는다."""
    return service.tech_drop(code)


@router.post("/tech-drops/{code}/subscribe", response_model=SubscribeResponse)
def subscribe_tech_drop(code: str, user: CurrentUser):
    """TODO: 실제로는 오픈 알림 신청을 저장한다."""
    return service.subscribe_tech_drop(code)


@router.get("/team-missions/{mission_id}", response_model=TeamMission)
def team_mission(mission_id: str):
    """TODO: 실제로는 마스터 캐릭터로 팀을 편성하고 에이전트 대화 로그를 읽는다."""
    return service.team_mission(mission_id)


@router.get("/team-missions/{mission_id}/result", response_model=TeamMissionResult)
def team_mission_result(mission_id: str):
    """TODO: 실제로는 팀 미션 실행 결과와 캐릭터별 기여를 읽는다."""
    return service.team_mission_result(mission_id)
