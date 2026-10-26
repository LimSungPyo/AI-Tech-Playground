"""사용자·마이페이지 서비스. 지금은 혜원 샘플을 돌려준다."""

from copy import deepcopy

from app.fixtures import content as content_fx
from app.fixtures import experiments as exp_fx
from app.fixtures import users as fx


def home(user: dict) -> dict:
    # TODO: 마지막 플레이 실험·미션, 어제 대비 성공률 변화, 파트너 메시지, 주간 학습 시간,
    #       추천(관심사·수준·기록 기반 점수), 레이더 상위 5개, Tech Drop, 팀 미션 해금 여부를 모은다.
    return deepcopy({
        "user": user,
        "continue": {
            "experiment": exp_fx.EXPERIMENTS_BY_ID["001"],
            "mission": exp_fx.MISSIONS_001[1],
            "last_played_at": "2026-10-16T14:20:00+09:00",
            "delta_pct": 6,
            "last_why": fx.LAST_WHY,
        },
        "partner": fx.HOME_PARTNER,
        "week": fx.WEEK,
        "recommendations": content_fx.RECOMMENDATIONS,
        "radar": content_fx.RADAR_KEYWORDS,
        "tech_drop": fx.HOME_TECH_DROP,
        "team": fx.HOME_TEAM,
    })


def save_onboarding(user: dict, interests: list[str], skill: str) -> dict:
    # TODO: 관심사와 수준을 사용자에 저장한다.
    return {**deepcopy(user), "interests": interests, "skill": skill}


def partner_recommendation(user: dict) -> dict:
    # TODO: 관심사 일치 + 수준 + 아직 만나지 않은 친구 가산점으로 캐릭터별 점수를 계산한다(C · 추천 로직).
    return deepcopy(fx.PARTNER_RECOMMENDATION)


def set_partner(user: dict, character: str) -> dict:
    # TODO: 파트너 캐릭터를 저장하고 도감에 만남 상태로 등록한다.
    return {**deepcopy(user), "partner": character}


def dashboard(user: dict) -> dict:
    # TODO: 실험·트라이얼·카드·배지 수를 집계하고 최근 실험, 학습 잔디, 파트너 도감 정보를 읽는다.
    recent = [exp_fx.EXPERIMENTS_BY_ID[i] for i in ("001", "007", "000")]
    return deepcopy({
        "user": user,
        "stats": fx.DASHBOARD_STATS,
        "recent": recent,
        "streak": {"days": user["streak_days"], "calendar": fx.STREAK_CALENDAR},
        "partner": fx.DEX[0],
    })


def my_experiments(user: dict) -> list[dict]:
    # TODO: 사용자가 플레이했거나 오픈 알림을 신청한 실험을 최근 플레이 순으로 읽는다.
    ids = ("001", "007", "000", "006", "002", "003")
    return deepcopy([exp_fx.EXPERIMENTS_BY_ID[i] for i in ids])


def my_characters(user: dict) -> list[dict]:
    # TODO: 사용자-캐릭터 테이블에서 레벨·상태·기록을 읽고 만나지 않은 캐릭터는 조건만 보여 준다.
    return deepcopy(fx.DEX)


def my_badges(user: dict) -> list[dict]:
    # TODO: 전체 배지 목록과 사용자 획득 기록을 합친다.
    return deepcopy(fx.BADGES)


def history(user: dict) -> dict:
    # TODO: 기간별 학습 시간과 활동 로그(훈련·WHY?·달성)를 읽는다.
    days = [{"date": d, "minutes": m["minutes"]} for d, m in zip(fx.WEEK_DATES, fx.WEEK["days"])]
    return deepcopy({"days": days, "logs": fx.HISTORY_LOGS})


def get_settings(user: dict) -> dict:
    # TODO: 사용자 설정을 읽는다.
    return deepcopy(fx.SETTINGS)


def update_settings(user: dict, settings: dict) -> dict:
    # TODO: 사용자 설정을 저장한다.
    return settings


def update_profile(user: dict, nickname: str, avatar: str) -> dict:
    # TODO: 닉네임 중복·금칙어를 확인하고 프로필을 저장한다.
    return {**deepcopy(user), "nickname": nickname, "avatar": avatar}


def change_password(user: dict, current: str, next_password: str) -> dict:
    # TODO: 현재 비밀번호를 검증하고 새 비밀번호 해시를 저장한 뒤 다른 세션을 끊는다.
    return {"ok": True}


def withdraw(user: dict, password: str, reason: str) -> dict:
    # TODO: 비밀번호를 확인하고 30일 뒤 삭제를 예약한 뒤 세션을 끊는다.
    return {"ok": True, "grace_days": 30}
