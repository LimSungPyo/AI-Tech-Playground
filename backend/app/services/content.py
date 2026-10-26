"""기술 카드·트리·도감·레이더·홈·투표·팀 미션 서비스. 지금은 샘플을 돌려준다."""

from copy import deepcopy

from app.core.errors import AppError
from app.fixtures import content as fx
from app.fixtures import users as user_fx


def list_cards() -> list[dict]:
    # TODO: 카드 목록과 사용자 해금 여부를 합친다.
    return deepcopy(fx.CARDS)


def get_card(card_id: str) -> dict:
    # TODO: 카드를 읽고 사용자 열람 기록을 남긴다(기술 카드 수집가 배지 진행).
    #       잠긴 실험의 카드도 404 대신 unlocked:false로 준다(9장).
    if card_id not in fx.CARDS_BY_ID:
        raise AppError(404, "CARD_NOT_FOUND", f"기술 카드 {card_id}을(를) 찾을 수 없어요.")
    return deepcopy(fx.CARDS_BY_ID[card_id])


def tree() -> dict:
    # TODO: 노드 정의와 사용자 실험 완료 기록으로 노드 상태(완료·해금·잠김)를 계산한다.
    return deepcopy({"nodes": fx.TREE_NODES})


def dex() -> list[dict]:
    # TODO: 캐릭터 정의와 사용자-캐릭터 기록을 합친다(비회원이면 전부 미획득).
    return deepcopy(user_fx.DEX)


def radar(week: str | None = None) -> dict:
    # TODO: 관리자가 승인한 그 주(기본 이번 주) 키워드를 상승률 순으로 읽고 수집 규모 · AI 해설을 붙인다.
    if week in (None, fx.RADAR_WEEK):
        return deepcopy({
            "week": fx.RADAR_WEEK,
            "updated_at": fx.RADAR_UPDATED_AT,
            "keywords": fx.RADAR_KEYWORDS,
            "source_count": fx.RADAR_SOURCE_COUNT,
            "post_count": fx.RADAR_POST_COUNT,
            "commentary": fx.RADAR_COMMENTARY,
            "available_weeks": fx.RADAR_WEEKS,
        })
    if week not in fx.RADAR_PAST:
        raise AppError(404, "RADAR_WEEK_NOT_FOUND", f"{week} 주의 레이더가 없어요.")
    offset = fx.RADAR_WEEKS.index(week)
    keywords = []
    for keyword in fx.RADAR_KEYWORDS:
        weeks = [keyword["weeks"][0]] * offset + keyword["weeks"][: len(keyword["weeks"]) - offset]
        prev, last = weeks[-2], weeks[-1]
        keywords.append({**keyword, "weeks": weeks, "change_pct": round((last - prev) / prev * 100) if prev else 0})
    keywords.sort(key=lambda k: k["change_pct"], reverse=True)
    past = fx.RADAR_PAST[week]
    return deepcopy({"week": week, "keywords": keywords, "available_weeks": fx.RADAR_WEEKS, **past})


def radar_keyword(keyword_id: str) -> dict:
    # TODO: 키워드의 4주 추이·출처·연결 실험을 읽는다.
    if keyword_id not in fx.RADAR_BY_ID:
        raise AppError(404, "KEYWORD_NOT_FOUND", f"키워드 {keyword_id}을(를) 찾을 수 없어요.")
    return deepcopy(fx.RADAR_BY_ID[keyword_id])


def carousel() -> dict:
    # TODO: 관리자가 켠 슬라이드를 FEATURED → NOW OPEN → COMING SOON 순으로 읽는다.
    return deepcopy({"slides": fx.CAROUSEL})


def current_vote(user: dict | None) -> dict:
    # TODO: 진행 중인 투표와 옵션별 득표, 사용자의 투표 여부를 읽는다.
    vote = deepcopy(fx.VOTE)
    if user is not None:
        vote["my_vote"] = "003"
    return vote


def cast_vote(vote_id: str, option_id: str) -> dict:
    # TODO: 1주 1표 제한을 확인하고 투표 응답을 저장한 뒤 집계를 돌려준다.
    if vote_id != fx.VOTE["id"]:
        raise AppError(404, "VOTE_NOT_FOUND", "진행 중인 투표가 아니에요.")
    vote = deepcopy(fx.VOTE)
    if not any(o["id"] == option_id for o in vote["options"]):
        raise AppError(400, "INVALID_OPTION", "투표 항목이 올바르지 않아요.")
    for option in vote["options"]:
        if option["id"] == option_id:
            option["votes"] += 1
    vote["my_vote"] = option_id
    return vote


def tech_drop(code: str) -> dict:
    # TODO: 오픈 예정 실험 정보와 사용자의 알림 신청 여부를 읽는다.
    if code not in fx.TECH_DROPS:
        raise AppError(404, "TECH_DROP_NOT_FOUND", f"오픈 예정 실험 {code}을(를) 찾을 수 없어요.")
    return deepcopy(fx.TECH_DROPS[code])


def subscribe_tech_drop(code: str) -> dict:
    # TODO: 오픈 알림 신청을 저장한다.
    tech_drop(code)
    return {"subscribed": True}


def unsubscribe_tech_drop(code: str) -> dict:
    # TODO: 오픈 알림 신청을 지운다.
    tech_drop(code)
    return {"subscribed": False}


def team_mission(mission_id: str) -> dict:
    # TODO: 마스터 캐릭터로 팀을 편성하고 에이전트 대화 로그를 읽는다.
    if mission_id != fx.TEAM_MISSION["id"]:
        raise AppError(404, "TEAM_MISSION_NOT_FOUND", f"팀 미션 {mission_id}을(를) 찾을 수 없어요.")
    return deepcopy(fx.TEAM_MISSION)


def team_mission_result(mission_id: str) -> dict:
    # TODO: 팀 미션 실행 결과와 캐릭터별 기여를 읽는다.
    mission = {**team_mission(mission_id), "status": "done"}
    return deepcopy({"mission": mission, **fx.TEAM_RESULT})
