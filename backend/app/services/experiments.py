"""실험·플레이 서비스. 지금은 샘플 결과를 돌려준다(학습 시뮬레이션 없음)."""

import itertools
import threading
import uuid
from copy import deepcopy

from app.core.errors import AppError
from app.fixtures import content as content_fx
from app.fixtures import experiments as fx
from app.fixtures import users as user_fx

# 호출마다 trial이 1씩 오르는 척하기 위한 프로세스 메모리 카운터. 실험별로 따로 센다
# (재시작하면 각 실험의 progress.trial 다음부터 다시, 진행 기록이 없는 실험은 1부터)
_trial_lock = threading.Lock()
_trial_counters: dict[str, itertools.count] = {}


def _next_trials(exp_id: str, count: int) -> list[int]:
    with _trial_lock:
        counter = _trial_counters.get(exp_id)
        if counter is None:
            progress = fx.EXPERIMENTS_BY_ID[exp_id].get("progress")
            counter = itertools.count((progress["trial"] if progress else 0) + 1)
            _trial_counters[exp_id] = counter
        return [next(counter) for _ in range(count)]


def _require_experiment(exp_id: str) -> dict:
    if exp_id not in fx.EXPERIMENTS_BY_ID:
        raise AppError(404, "EXPERIMENT_NOT_FOUND", f"실험 {exp_id}을(를) 찾을 수 없어요.")
    return fx.EXPERIMENTS_BY_ID[exp_id]


def _require_mission(exp_id: str, mission_id: str) -> dict:
    detail = fx.detail_for(_require_experiment(exp_id)["id"])
    for mission in detail["missions"]:
        if mission["id"] == mission_id:
            return mission
    raise AppError(404, "MISSION_NOT_FOUND", f"미션 {mission_id}을(를) 찾을 수 없어요.")


def list_experiments(level: str | None, q: str | None) -> list[dict]:
    # TODO: 사용자 진행 상황을 합쳐 상태(진행 중·잠김 등)를 계산하고 level·검색어로 거른다.
    items = fx.EXPERIMENTS
    if level:
        items = [e for e in items if e["level"] == level]
    if q:
        needle = q.lower()
        items = [
            e for e in items
            if needle in e["title"].lower() or needle in e["subtitle"].lower() or needle in e["code"]
            or any(needle in t.lower() for t in e["tags"])
        ]
    return deepcopy(items)


def get_experiment(exp_id: str) -> dict:
    # TODO: 실험·미션 정의와 사용자 진행 상황, 1회차/100회차 통계를 읽는다.
    _require_experiment(exp_id)
    return deepcopy(fx.detail_for(exp_id))


def briefing(exp_id: str, mission_id: str, user: dict | None = None) -> dict:
    # TODO: 미션 정의에서 스토리·목표·예측 문항·보상 규칙을 읽고, 전체 사용자 예측 분포와 내 예측을 붙인다.
    mission = _require_mission(exp_id, mission_id)
    data = fx.BRIEFINGS.get(mission_id, fx.BRIEFINGS["m1"])
    result = {
        "mission": mission,
        **data,
        "prediction_stats": fx.PREDICTION_STATS.get(mission_id, fx.PREDICTION_STATS["m1"]),
    }
    if user is not None:
        result["my_prediction"] = fx.MY_PREDICTION.get(mission_id)
        result["last_prediction"] = fx.LAST_PREDICTION.get(mission_id)
    return deepcopy(result)


def predict(exp_id: str, mission_id: str, option: str) -> dict:
    # TODO: 사용자의 예측을 저장하고 리포트에서 정답과 비교한다.
    _require_mission(exp_id, mission_id)
    return {"ok": True}


def run_trial(exp_id: str, mission_id: str, speed: float) -> dict:
    # TODO: 사용자의 현재 뉴런 가중치로 시뮬레이션을 1회 돌리고, 보상으로 가중치를 갱신해
    #       경로·뉴런 활성·WHY? 근거를 기록한 뒤 돌려준다.
    _require_mission(exp_id, mission_id)
    (trial,) = _next_trials(exp_id, 1)
    return deepcopy({
        "trial": trial,
        "success": trial % 5 != 0,
        "path": fx.trained_path(trial),
        "first_path": fx.first_path(),
        "time_sec": round(max(5.8, 24.1 - trial * 0.18), 1),
        "collisions": max(0, 9 - trial // 5),
        "neurons": fx.NEURONS,
        "why": fx.why_for("beginner"),
        "curve": fx.curve_until(trial),
        "journal": fx.JOURNAL.get(trial, fx.JOURNAL_DEFAULT),
    })


def train_batch(exp_id: str, mission_id: str, count: int) -> dict:
    # TODO: 훈련 작업을 큐에 넣고 백그라운드로 count회 돌리며 진행률을 갱신한다(지금은 즉시 완료).
    _require_mission(exp_id, mission_id)
    trials = _next_trials(exp_id, count)
    rows = []
    for i, t in enumerate(trials):
        success = fx.BATCH_SUCCESS[i % len(fx.BATCH_SUCCESS)]
        rows.append({
            "trial": t,
            "success_rate": fx.success_rate_at(t),
            "success": success,
            "time_sec": fx.BATCH_TIMES[i % len(fx.BATCH_TIMES)],
            # 실패 회차는 1회차처럼 헤매는 경로
            "path": fx.trained_path(t, points=20) if success else fx.first_path(points=20),
        })
    return deepcopy({
        "job_id": f"job-{uuid.uuid4().hex[:12]}",
        "from_trial": trials[0],
        "to_trial": trials[-1],
        "status": "done",
        "progress": 100,
        "trials": rows,
        "connections": fx.BATCH_CONNECTIONS,
        "journal": fx.BATCH_JOURNAL,
    })


def why(exp_id: str, trial: int, level: str) -> dict:
    # TODO: 저장된 트라이얼 기록에서 그 순간의 선택 확률·유사 경험·신경 경로를 읽어 수준별 설명을 만든다.
    _require_experiment(exp_id)
    return fx.why_for(level)


def mission_clear(exp_id: str, mission_id: str) -> dict:
    # TODO: 미션 성공 조건을 확인하고 다음 미션·도감 카드·기술 카드·배지를 해금한다.
    mission = _require_mission(exp_id, mission_id)
    prophet = next(b for b in user_fx.BADGES if b["id"] == "prophet")
    return deepcopy({
        "mission": {**mission, "status": "cleared"},
        "rate": mission.get("best_rate") or 86,
        "trials": 100,
        "unlocked": fx.CLEAR_UNLOCKED.get(mission_id, []),
        "badge": prophet if mission_id == "m1" else None,
        # TODO: 첫 성공 회차는 트라이얼 기록에서, 예측 정답은 브리핑 때 저장한 예측과 비교해 정한다.
        "first_success_trial": fx.FIRST_SUCCESS_TRIAL.get(mission_id),
        "my_prediction": fx.MY_PREDICTION.get(mission_id),
        "prediction_correct": True if mission_id in fx.MY_PREDICTION else None,
    })


def report(exp_id: str) -> dict:
    # TODO: 트라이얼 기록에서 회차별 지표와 주요 사건을 집계하고 AI 해설을 생성한다.
    _require_experiment(exp_id)
    data = {**fx.REPORT_001, "experiment_id": exp_id}
    detail = fx.detail_for(exp_id)
    return deepcopy({
        **data,
        "curve": fx.curve_until(100),
        "next_recommendations": content_fx.RECOMMENDATIONS[:2],
        "mission_title": "미션 1 · 먹이 찾기",
        "metrics": fx.report_metrics(),
        "replay": {"first": fx.first_path(), "last": fx.trained_path(100)},
        "prediction": {"option": fx.MY_PREDICTION["m1"], "correct": True},
        "participants": detail["participants"],
        "avg_improvement": detail["avg_improvement"],
    })


def ranking(exp_id: str, mission_id: str | None = None, period: str = "week") -> list[dict]:
    # TODO: 기간(week·month·all·friends) · 미션별로 최종 성공률 → 첫 성공 회차 순 순위를 매기고 내 순위를 붙인다.
    #       지금은 기간 · 미션과 상관없이 같은 샘플을 준다.
    exp = _require_experiment(exp_id)
    if mission_id is not None:
        _require_mission(exp_id, mission_id)
    if exp_id == "001":
        return deepcopy(fx.RANKING_001)
    if exp["status"] in ("locked", "coming_soon"):
        return []
    # 다른 열린 실험: 그 실험 캐릭터로 짧은 샘플 순위표를 만든다
    best = fx.detail_for(exp_id)["stats"]["hundredth_trial_rate"] or 80
    rows = [
        {"rank": i + 1, "nickname": nick, "character": exp["character"], "success_rate": max(0, best + 4 - i * 2),
         "trials": 20 + i * 3, "is_me": False, "first_success_trial": 3 + i}
        for i, nick in enumerate(fx.RANKING_NICKNAMES)
    ]
    progress = exp.get("progress")
    if progress:
        rows.append({"rank": 12, "nickname": "혜원", "character": exp["character"], "success_rate": progress["success_rate"],
                     "trials": progress["trial"], "is_me": True, "first_success_trial": 6})
    return rows


def report_nickname(nickname: str, reason: str) -> dict:
    # TODO: 닉네임 신고를 관리자 문의·신고 큐에 넣는다.
    return {"ok": True}


def share(exp_id: str) -> dict:
    # TODO: 결과 스냅샷을 저장하고 공유 id를 발급한다.
    _require_experiment(exp_id)
    return {"share_id": fx.SHARE_ID, "url": f"/share/{fx.SHARE_ID}"}


def shared_result(share_id: str) -> dict:
    # TODO: 공유 id로 저장된 결과 스냅샷을 읽는다.
    if share_id != fx.SHARE_ID:
        raise AppError(404, "SHARE_NOT_FOUND", "공유된 결과를 찾을 수 없어요.")
    return deepcopy({**fx.SHARED_RESULT, "experiment": fx.EXPERIMENTS_BY_ID["001"]})
