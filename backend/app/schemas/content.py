"""기술 카드·트리·도감·레이더·홈 캐러셀·투표·Tech Drop·팀 미션."""

from typing import Literal

from app.schemas.base import CamelModel
from app.schemas.common import CharacterId, Level, RadarKeyword, TeamMission, TreeNode


class TreeResponse(CamelModel):
    nodes: list[TreeNode]


class RadarResponse(CamelModel):
    week: str
    updated_at: str
    keywords: list[RadarKeyword]
    # v2
    source_count: int | None = None  # 12개 출처
    post_count: int | None = None  # 글 3,412개
    commentary: str | None = None  # AI 해설
    available_weeks: list[str] | None = None  # ?week= 로 고를 수 있는 주(최신순)


class CarouselSlide(CamelModel):
    code: str
    title: str
    body: str
    character: CharacterId
    cta: str
    target: str
    # v2
    badge: Literal["FEATURED", "NOW OPEN", "COMING SOON"] | None = None
    level: Level | None = None
    duration_min: int | None = None
    tags: list[str] | None = None
    bubble: str | None = None  # 말풍선 "뉴런 302개" · "D-14"


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
    # v2
    learn: list["LearnStep"] | None = None
    conditions: list["StartCondition"] | None = None
    condition_hint: str | None = None


class LearnStep(CamelModel):
    title: str
    body: str


class StartCondition(CamelModel):
    label: str
    done: bool


class SubscribeResponse(CamelModel):
    subscribed: bool = True


class TeamMetrics(CamelModel):
    messages: int
    tool_calls: int
    searches: int


class Contribution(CamelModel):
    character: CharacterId
    text: str


class TeamMissionResult(CamelModel):
    mission: TeamMission
    summary: str
    contributions: list[Contribution]
    metrics: TeamMetrics | None = None  # v2


TechDrop.model_rebuild()
