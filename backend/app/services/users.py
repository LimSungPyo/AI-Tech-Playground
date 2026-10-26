"""사용자·마이페이지 서비스. 지금은 혜원 샘플을 돌려준다."""

from copy import deepcopy

from app.core.errors import AppError
from app.fixtures import content as content_fx
from app.fixtures import experiments as exp_fx
from app.fixtures import users as fx


def home(user: dict, dormant: bool = False) -> dict:
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
        # TODO: 마지막 접속이 7일 이상 지났으면 그동안 바뀐 것(Tech Drop · 레이더 · 연속 기록)을 모은다.
        "dormant": fx.DORMANT if dormant else None,
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
        "streak": {
            "days": user["streak_days"],
            "calendar": fx.STREAK_CALENDAR,
            "best": fx.BEST_STREAK,
            "protections_left": fx.STREAK_PROTECTIONS_LEFT,
        },
        "partner": fx.DEX[0],
        # TODO: XP는 실험·배지 활동으로 쌓고, 총 실험 시간은 세션 기록 합으로 계산한다.
        "xp": fx.DASHBOARD_XP,
        "total_minutes": fx.DASHBOARD_TOTAL_MINUTES,
        "week_minutes_delta": fx.DASHBOARD_WEEK_DELTA,
        "best_streak": fx.BEST_STREAK,
    })


def my_experiments(user: dict) -> list[dict]:
    # TODO: 사용자가 플레이했거나 오픈 알림을 신청한 실험을 최근 플레이 순으로 읽는다.
    ids = ("001", "007", "000", "006", "002", "003")
    items = []
    for i in ids:
        item = deepcopy(exp_fx.EXPERIMENTS_BY_ID[i])
        extra = fx.MY_EXPERIMENT_EXTRA.get(i)
        if extra:
            item["last_played_at"] = extra["last_played_at"]
            item["first_rate"] = extra["first_rate"]
            if "curve_trials" in extra:
                item["curve"] = [{"trial": t, "success_rate": exp_fx.success_rate_at(t)} for t in extra["curve_trials"]]
            else:
                item["curve"] = [{"trial": t, "success_rate": r} for t, r in extra["curve_rates"]]
        items.append(item)
    return items


def my_characters(user: dict) -> list[dict]:
    # TODO: 사용자-캐릭터 테이블에서 레벨·상태·기록을 읽고 만나지 않은 캐릭터는 조건만 보여 준다.
    return deepcopy(fx.DEX)


def my_badges(user: dict) -> list[dict]:
    # TODO: 전체 배지 목록과 사용자 획득 기록을 합친다.
    return deepcopy(fx.BADGES)


def history(user: dict, period: str = "week") -> dict:
    # TODO: 기간(week·month·all)별 학습 시간·성공률과 활동 로그(훈련·WHY?·달성), 통계, AI 주간 요약을 읽는다.
    #       지금 days는 기간과 상관없이 이번 주 7일만 준다(month·all 잔디는 /me/dashboard의 streak.calendar).
    days = []
    for d, m, rate in zip(fx.WEEK_DATES, fx.WEEK["days"], fx.WEEK_SUCCESS_RATES):
        day = {"date": d, "minutes": m["minutes"]}
        if rate is not None:
            day["success_rate"] = rate
        days.append(day)
    return deepcopy({
        "days": days,
        "logs": fx.HISTORY_LOGS,
        "period": period,
        "range_label": fx.HISTORY_RANGE_LABEL[period],
        "stats": fx.HISTORY_STATS[period],
        "weekly_summary": fx.WEEKLY_SUMMARY,
        "records": fx.HISTORY_RECORDS,
    })


def get_settings(user: dict) -> dict:
    # TODO: 사용자 설정을 읽는다.
    return deepcopy(fx.SETTINGS)


def update_settings(user: dict, settings: dict) -> dict:
    # TODO: 사용자 설정을 저장한다. 연결 계정 · 비밀번호 변경일 · 이메일은 읽기 전용이라 무시한다.
    merged = deepcopy(fx.SETTINGS)
    merged.update({k: v for k, v in settings.items() if v is not None and k not in ("connections", "password_changed_at", "email")})
    return merged


def update_profile(user: dict, nickname: str, avatar: str, bio: str | None = None) -> dict:
    # TODO: 닉네임 중복·금칙어를 확인하고 프로필(소개 포함)을 저장한다.
    updated = {**deepcopy(user), "nickname": nickname, "avatar": avatar}
    if bio is not None:
        updated["bio"] = bio
    return updated


def _check_password(password: str) -> None:
    # 샘플 규칙: 로그인과 같이 "wrong"이면 틀린 비밀번호(401). 프론트는 이 호출에 silent401을 쓴다.
    if password == "wrong":
        raise AppError(401, "INVALID_PASSWORD", "비밀번호가 맞지 않아요.")


def change_password(user: dict, current: str, next_password: str) -> dict:
    # TODO: 현재 비밀번호를 검증하고 새 비밀번호 해시를 저장한 뒤 다른 세션을 끊는다.
    _check_password(current)
    return {"ok": True}


def withdraw(user: dict, password: str, reason: str) -> dict:
    # TODO: 비밀번호를 확인하고 30일 뒤 삭제를 예약한 뒤 세션을 끊는다.
    _check_password(password)
    return {"ok": True, "grace_days": 30}


def set_featured_badge(user: dict, badge_id: str) -> dict:
    # TODO: 획득한 배지인지 확인하고 대표 배지로 저장한다(랭킹 · 도감 카드에 표시).
    badge = next((b for b in fx.BADGES if b["id"] == badge_id), None)
    if badge is None:
        raise AppError(404, "BADGE_NOT_FOUND", f"배지 {badge_id}을(를) 찾을 수 없어요.")
    if not badge["obtained"]:
        raise AppError(400, "BADGE_NOT_OBTAINED", "아직 얻지 못한 배지예요.")
    return {"ok": True, "featured_badge_id": badge_id}


def _require_provider(provider: str) -> None:
    if provider not in ("google", "kakao", "github"):
        raise AppError(404, "PROVIDER_NOT_FOUND", f"지원하지 않는 로그인 방법이에요: {provider}")


def connect_social(user: dict, provider: str, code: str) -> dict:
    # TODO: OAuth code를 교환해 소셜 계정을 현재 사용자에 연결한다(다른 계정에 이미 연결돼 있으면 409).
    _require_provider(provider)
    if code == "conflict":
        raise AppError(409, "SOCIAL_ALREADY_LINKED", "이미 다른 계정에 연결된 소셜 계정이에요.")
    return {"ok": True, "provider": provider, "connected": True}


def disconnect_social(user: dict, provider: str) -> dict:
    # TODO: 소셜 연결을 해제한다(로그인 수단이 하나뿐이면 400).
    _require_provider(provider)
    return {"ok": True, "provider": provider, "connected": False}


def change_email(user: dict, email: str, password: str) -> dict:
    # TODO: 비밀번호를 확인하고 새 이메일로 인증 메일을 보낸다(인증 전까지 기존 이메일 유지).
    _check_password(password)
    return {"ok": True, "email": email, "verification_required": True}


def request_export(user: dict) -> dict:
    # TODO: 실험 기록 · 도감 · 배지를 묶은 내보내기 작업을 큐에 넣고 완료되면 메일로 링크를 보낸다.
    return {"ok": True, "requested_at": "2026-10-17T15:00:00+09:00", "ready_in_min": 10, "email": user["email"]}


def reset_records(user: dict, password: str, scope: str) -> dict:
    # TODO: 비밀번호를 확인하고 학습 기록(experiments) 또는 계정 데이터 전체(all)를 초기화한다.
    _check_password(password)
    return {"ok": True}
