"""기술 카드·트리·도감·레이더·홈 캐러셀·투표·Tech Drop·팀 미션."""

from app.schemas.base import CamelModel
from app.schemas.common import CharacterId, RadarKeyword, TeamMission, TreeNode


class TreeResponse(CamelModel):
    nodes: list[TreeNode]


class RadarResponse(CamelModel):
    week: str
    updated_at: str
    keywords: list[RadarKeyword]


class CarouselSlide(CamelModel):
    code: str
    title: str
    body: str
    character: CharacterId
    cta: str
    target: str


class CarouselResponse(CamelModel):
    slides: list[CarouselSlide]


class VoteOption(CamelModel):
    id: str
    title: str
    votes: int


class Vote(CamelModel):
    id: str
    title: str
    options: list[VoteOption]
    my_vote: str | None = None
    ends_at: str


class VoteRequest(CamelModel):
    option_id: str


class TechDrop(CamelModel):
    code: str
    title: str
    body: str
    open_at: str
    character: CharacterId
    subscribed: bool


class SubscribeResponse(CamelModel):
    subscribed: bool = True


class Contribution(CamelModel):
    character: CharacterId
    text: str


class TeamMissionResult(CamelModel):
    mission: TeamMission
    summary: str
    contributions: list[Contribution]
