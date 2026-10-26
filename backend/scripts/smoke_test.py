"""샘플 API 스모크 테스트 (표준 라이브러리만 사용).

    uvicorn app.main:app --port 8201        # 다른 터미널에서
    python scripts/smoke_test.py http://127.0.0.1:8201

contract.md · contract-v2.md의 모든 엔드포인트를 한 번씩 부르고, 의도한 오류 케이스가
의도한 상태 코드와 `{"error": {"code", "message"}}` 형식으로 오는지 확인한다.
"""

import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:8201"
USER = "sample-smoke"
ADMIN = "admin-smoke"

failures: list[str] = []
count = 0


def call(method: str, path: str, body=None, token: str | None = None, raw: bytes | None = None, content_type: str | None = None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(BASE + path, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", content_type or "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            status, text = res.status, res.read().decode()
    except urllib.error.HTTPError as err:
        status, text = err.code, err.read().decode()
    try:
        payload = json.loads(text)
    except ValueError:
        payload = text
    return status, payload


def check(method: str, path: str, expect: int = 200, body=None, token: str | None = None, error_code: str | None = None, keys: tuple = (), **kw):
    global count
    count += 1
    status, payload = call(method, path, body, token, **kw)
    problems = []
    if status != expect:
        problems.append(f"status {status} != {expect}")
    if expect >= 400:
        err = payload.get("error") if isinstance(payload, dict) else None
        if not (isinstance(err, dict) and "code" in err and "message" in err):
            problems.append("error 형식 아님")
        elif error_code and err["code"] != error_code:
            problems.append(f"code {err['code']} != {error_code}")
    for key in keys:
        target = payload[0] if isinstance(payload, list) and payload else payload
        if not isinstance(target, dict) or key not in target:
            problems.append(f"키 {key} 없음")
    mark = "ok " if not problems else "FAIL"
    print(f"[{mark}] {method:6} {path} -> {status}" + (f"  ({'; '.join(problems)})" if problems else ""))
    if problems:
        failures.append(f"{method} {path}: {'; '.join(problems)}")
    return payload


def main() -> None:
    # 기본
    check("GET", "/health", keys=("status",))
    global count
    count += 1
    req = urllib.request.Request(BASE + "/docs")
    with urllib.request.urlopen(req, timeout=10) as res:
        ok = res.status == 200
    print(f"[{'ok ' if ok else 'FAIL'}] GET    /docs -> {res.status}")
    if not ok:
        failures.append("GET /docs")

    # 인증
    check("POST", "/api/auth/login", body={"email": "hyewon@playground.ai", "password": "pw1234!", "remember": True}, keys=("token", "user"))
    check("POST", "/api/auth/login", 401, {"email": "hyewon@playground.ai", "password": "wrong", "remember": False}, error_code="INVALID_PASSWORD")
    check("POST", "/api/auth/login", 423, {"email": "hyewon@playground.ai", "password": "locked", "remember": False}, error_code="ACCOUNT_LOCKED")
    check("POST", "/api/auth/social/google", body={"code": "abc"}, keys=("token",))
    check("POST", "/api/auth/social/google", 409, {"code": "conflict"}, error_code="SOCIAL_CONFLICT")
    check("POST", "/api/auth/logout", token=USER, keys=("ok",))
    me = check("GET", "/api/auth/me", token=USER, keys=("streakDays", "hasPlayed", "partner"))
    if isinstance(me, dict) and (me.get("nickname") != "혜원" or me.get("level") != 7 or me.get("role") != "user"):
        failures.append("GET /api/auth/me: 혜원 Lv.7 user 아님")
    admin_me = check("GET", "/api/auth/me", token=ADMIN)
    if isinstance(admin_me, dict) and admin_me.get("role") != "admin":
        failures.append("GET /api/auth/me (admin 토큰): role이 admin 아님")
    check("GET", "/api/auth/me", 401, error_code="UNAUTHORIZED")
    check("POST", "/api/auth/signup", body={"email": "new@playground.ai", "password": "pw1234!", "nickname": "새싹", "agreeTerms": True, "agreeMarketing": False}, keys=("verificationId",))
    check("POST", "/api/auth/verify-email", body={"verificationId": "v-1", "code": "482731"}, keys=("token", "importedGuestTrials"))
    check("POST", "/api/auth/verify-email", 400, {"verificationId": "v-1", "code": "000000"}, error_code="INVALID_CODE")
    check("POST", "/api/auth/password/forgot", body={"email": "hyewon@playground.ai"}, keys=("expiresInMin",))
    check("POST", "/api/auth/password/reset", body={"resetToken": "r-1", "password": "new-pw1!"}, keys=("ok",))
    check("POST", "/api/auth/restore", body={"email": "hyewon@playground.ai"}, keys=("deletionScheduledAt",))
    check("POST", "/api/auth/guest/merge", body={"trials": 3}, token=USER, keys=("merged",))
    check("POST", "/api/auth/login", 422, {"email": "not-an-email"}, error_code="VALIDATION_ERROR")

    # 사용자·온보딩
    home = check("GET", "/api/me/home", token=USER, keys=("continue", "techDrop", "recommendations", "radar", "team"))
    if isinstance(home, dict) and home.get("continue", {}).get("experiment", {}).get("progress", {}).get("trial") != 34:
        failures.append("GET /api/me/home: Trial 34 아님")
    check("GET", "/api/me/home", 401, error_code="UNAUTHORIZED")
    check("PUT", "/api/me/onboarding", body={"interests": ["brain"], "skill": "beginner"}, token=USER, keys=("interests",))
    check("GET", "/api/me/partner-recommendation", token=USER, keys=("primary", "alternatives"))
    check("PUT", "/api/me/partner", body={"character": "wormy"}, token=USER, keys=("partner",))
    check("GET", "/api/me/dashboard", token=USER, keys=("stats", "streak", "partner"))
    check("GET", "/api/me/experiments", token=USER, keys=("thumbnailColor",))
    check("GET", "/api/me/characters", token=USER, keys=("meetCondition",))
    check("GET", "/api/me/badges", token=USER, keys=("obtained",))
    check("GET", "/api/me/history", token=USER, keys=("days", "logs"))
    settings = check("GET", "/api/me/settings", token=USER, keys=("whyLevel",))
    check("PUT", "/api/me/settings", body=settings, token=USER, keys=("whyLevel",))
    check("PUT", "/api/me/profile", body={"nickname": "혜원", "avatar": "wormy"}, token=USER, keys=("nickname",))
    check("PUT", "/api/me/password", body={"current": "a", "next": "b"}, token=USER, keys=("ok",))
    check("POST", "/api/me/withdraw", body={"password": "a", "reason": "잠시 쉬어요"}, token=USER, keys=("graceDays",))

    # 실험
    exps = check("GET", "/api/experiments", keys=("code", "durationMin"))
    if isinstance(exps, list) and [e["id"] for e in exps] != [f"{i:03d}" for i in range(9)]:
        failures.append("GET /api/experiments: #000~#008 아님")
    check("GET", "/api/experiments?level=advanced&q=rag")
    detail = check("GET", "/api/experiments/001", keys=("missions", "stats", "cardId"))
    if isinstance(detail, dict) and [m["status"] for m in detail.get("missions", [])][:2] != ["cleared", "open"]:
        failures.append("GET /api/experiments/001: 미션 1 cleared · 미션 2 open 아님")
    check("GET", "/api/experiments/999", 404, error_code="EXPERIMENT_NOT_FOUND")
    check("GET", "/api/experiments/001/missions/m1/briefing", keys=("story", "prediction"))
    check("GET", "/api/experiments/001/missions/m2/briefing", keys=("objectives",))
    check("POST", "/api/experiments/001/missions/m1/predict", body={"option": "11 – 30회"}, keys=("ok",))
    t1 = check("POST", "/api/experiments/001/trials", body={"missionId": "m2", "speed": 1}, keys=("firstPath", "neurons", "why", "curve"))
    t2 = check("POST", "/api/experiments/001/trials", body={"missionId": "m2", "speed": 2})
    if isinstance(t1, dict) and isinstance(t2, dict) and t2.get("trial") != t1.get("trial", 0) + 1:
        failures.append("POST trials: trial이 1씩 오르지 않음")
    if isinstance(t1, dict) and not (20 <= len(t1.get("path", [])) <= 40 and 20 <= len(t1.get("firstPath", [])) <= 40):
        failures.append("POST trials: 경로 점 개수가 20~40 아님")
    batch = check("POST", "/api/experiments/001/train-batch", body={"missionId": "m2", "count": 10}, keys=("jobId", "fromTrial", "toTrial"))
    if isinstance(batch, dict) and (batch.get("status") != "done" or len(batch.get("trials", [])) != 10):
        failures.append("POST train-batch: done · 10개 trial 아님")
    for level in ("beginner", "intermediate", "advanced"):
        check("GET", f"/api/experiments/001/trials/12/why?level={level}", keys=("similarExperiences", "neuronPath"))
    check("GET", "/api/experiments/001/missions/m1/clear", keys=("unlocked", "badge"))
    check("GET", "/api/experiments/001/missions/m9/clear", 404, error_code="MISSION_NOT_FOUND")
    check("GET", "/api/experiments/001/report", keys=("before", "after", "nextRecommendations"))
    check("GET", "/api/experiments/001/ranking", keys=("isMe", "successRate"))
    check("POST", "/api/ranking/report", body={"nickname": "?? 부적절한닉 ??", "reason": "부적절한 닉네임"}, keys=("ok",))
    share = check("POST", "/api/experiments/001/share", token=USER, keys=("shareId", "url"))
    share_id = share.get("shareId", "s-hyewon-001") if isinstance(share, dict) else "s-hyewon-001"
    check("GET", f"/api/share/{share_id}", keys=("experiment", "rate"))

    # 콘텐츠
    check("GET", "/api/cards", keys=("biologicalVsDesigned",))
    check("GET", "/api/cards/card-001", keys=("steps", "reveal"))
    check("GET", "/api/cards/card-999", 404, error_code="CARD_NOT_FOUND")
    check("GET", "/api/tree", keys=("nodes",))
    check("GET", "/api/dex", keys=("species",))
    radar = check("GET", "/api/radar", keys=("week", "updatedAt", "keywords"))
    if isinstance(radar, dict):
        got = [(k["name"], k["changePct"]) for k in radar.get("keywords", [])]
        want = [("Tool Calling", 42), ("Agent Memory", 31), ("Connectome", 18), ("Small LM", 12), ("World Model", -4)]
        if got != want:
            failures.append(f"GET /api/radar: 키워드 {got}")
    check("GET", "/api/radar/tool-calling", keys=("changePct", "sources"))
    check("GET", "/api/home/carousel", keys=("slides",))
    vote = check("GET", "/api/votes/current", keys=("options", "endsAt"))
    vote_id = vote.get("id", "vote") if isinstance(vote, dict) else "vote"
    check("POST", f"/api/votes/{vote_id}", body={"optionId": "003"}, token=USER, keys=("myVote",))
    check("GET", "/api/tech-drops/002", keys=("openAt", "subscribed"))
    check("POST", "/api/tech-drops/002/subscribe", token=USER, keys=("subscribed",))
    team = check("GET", "/api/team-missions/t1", keys=("members", "messages"))
    if isinstance(team, dict) and "from" not in (team.get("messages") or [{}])[0]:
        failures.append("GET /api/team-missions/t1: messages[].from 없음")
    check("GET", "/api/team-missions/t1/result", keys=("summary", "contributions"))

    # 알림·문의
    check("GET", "/api/notifications", token=USER, keys=("kind", "createdAt"))
    check("POST", "/api/notifications/read-all", token=USER, keys=("ok",))
    check("GET", "/api/inquiries", token=USER, keys=("status",))
    check("POST", "/api/inquiries", body={"category": "버그 · 오류", "title": "제목", "body": "내용"}, token=USER, keys=("id",))
    boundary = "----smoke"
    form = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"category\"\r\n\r\n버그 · 오류\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"title\"\r\n\r\n첨부 문의\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"body\"\r\n\r\n스크린샷을 붙였어요\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"attachments\"; filename=\"a.png\"\r\nContent-Type: image/png\r\n\r\nPNG\r\n"
        f"--{boundary}--\r\n"
    ).encode()
    check("POST", "/api/inquiries", token=USER, raw=form, content_type=f"multipart/form-data; boundary={boundary}", keys=("id",))
    check("POST", "/api/inquiries", 422, {"category": "기타"}, token=USER, error_code="VALIDATION_ERROR")
    check("GET", "/api/system/status", keys=("maintenance",))

    # 관리자
    check("POST", "/api/admin/login", body={"email": "admin.hyewon@playground.ai", "password": "pw"}, keys=("otpRequired", "otpId"))
    otp = check("POST", "/api/admin/otp", body={"otpId": "otp-1", "code": "391204"}, keys=("adminToken", "ipVerified"))
    if isinstance(otp, dict) and not str(otp.get("adminToken", "")).startswith("admin"):
        failures.append("POST /api/admin/otp: adminToken이 admin으로 시작하지 않음")
    check("POST", "/api/admin/otp", 403, {"otpId": "otp-1", "code": "999999"}, error_code="IP_BLOCKED")
    check("GET", "/api/admin/dashboard", token=ADMIN, keys=("kpis", "alerts", "signups"))
    check("GET", "/api/admin/dashboard", 403, token=USER, error_code="FORBIDDEN")
    check("GET", "/api/admin/dashboard", 401, error_code="UNAUTHORIZED")
    check("GET", "/api/admin/radar", token=ADMIN, keys=("candidates",))
    check("POST", "/api/admin/radar/rc-tool-calling/decision", body={"decision": "approved"}, token=ADMIN, keys=("ok",))
    card = check("GET", "/api/admin/cards/card-001", token=ADMIN, keys=("steps",))
    check("PUT", "/api/admin/cards/card-001", body=card, token=ADMIN, keys=("steps",))
    check("GET", "/api/admin/modules", token=ADMIN, keys=("modules",))
    check("PUT", "/api/admin/modules/002/publish", body={"visibility": "scheduled", "openAt": "2026-10-31T10:00:00+09:00", "audience": "all"}, token=ADMIN, keys=("ok",))
    admin_home = check("GET", "/api/admin/home", token=ADMIN, keys=("slides", "vote"))
    check("PUT", "/api/admin/home", body=admin_home, token=ADMIN, keys=("slides",))
    check("GET", "/api/admin/users?q=혜원".replace("혜원", "%ED%98%9C%EC%9B%90"), token=ADMIN, keys=("users",))
    check("POST", "/api/admin/users/u_hyewon/action", body={"action": "restore", "reason": "본인 요청"}, token=ADMIN, keys=("ok",))
    check("GET", "/api/admin/inquiries", token=ADMIN, keys=("items",))
    check("GET", "/api/admin/analytics", token=ADMIN, keys=("funnel", "retention", "experiments"))
    check("POST", "/api/admin/notifications", body={"audience": "#002 알림 신청자", "title": "부엉이 사서가 문을 열었어요!", "body": "#002 RAG 탐정이 오픈했어요.", "sendAt": "2026-10-31T10:00:00+09:00"}, token=ADMIN, keys=("scheduled",))
    check("GET", "/api/admin/audit", token=ADMIN, keys=("admins", "logs"))

    # ── v2 (contract-v2.md) ──
    def expect(cond: bool, label: str) -> None:
        if not cond:
            failures.append(label)
            print(f"[FAIL] {label}")

    # 인증
    locked = call("POST", "/api/auth/login", {"email": "hyewon@playground.ai", "password": "locked", "remember": False})[1]
    expect("2026-10-17T14:30" not in json.dumps(locked), "login 423: unlockAt이 지금+10분이 아님")
    login = check("POST", "/api/auth/login", body={"email": "hyewon@playground.ai", "password": "pw1234!", "remember": True}, keys=("user",))
    expect(isinstance(login, dict) and login["user"].get("title") == "탐험가" and login["user"].get("lastPlayed", {}).get("trial") == 34, "login: user.title · lastPlayed 없음")
    check("POST", "/api/auth/verify-email/resend", body={"verificationId": "v-1"}, keys=("expiresInSec", "cooldownSec"))
    check("POST", "/api/auth/social/google/link", body={"email": "hyewon@playground.ai", "password": "pw"}, keys=("token", "user"))
    check("POST", "/api/auth/social/google/link", 401, {"email": "hyewon@playground.ai", "password": "wrong"}, error_code="INVALID_PASSWORD")
    check("GET", "/api/auth/restore/preview?email=hyewon%40playground.ai", keys=("deletionScheduledAt", "daysLeft", "counts"))
    check("POST", "/api/auth/guest/merge", body={"trials": 3}, token=USER, keys=("successRate", "character", "predictions"))

    # 사용자
    home = check("GET", "/api/me/home", token=USER)
    expect(isinstance(home, dict) and "dormant" not in home, "me/home: 일반 토큰인데 dormant가 있음")
    check("GET", "/api/me/home", token="sample-dormant", keys=("dormant",))
    rec = check("GET", "/api/me/partner-recommendation", token=USER)
    expect(isinstance(rec, dict) and "score" in rec["alternatives"][0] and "greeting" in rec["primary"], "partner-recommendation: score · greeting 없음")
    dash = check("GET", "/api/me/dashboard", token=USER, keys=("xp", "totalMinutes", "bestStreak"))
    expect(isinstance(dash, dict) and dash["streak"].get("protectionsLeft") == 1, "dashboard: streak.protectionsLeft 없음")
    mine = check("GET", "/api/me/experiments", token=USER, keys=("lastPlayedAt", "firstRate", "curve"))
    expect(isinstance(mine, list) and "vote" in next(e for e in mine if e["id"] == "003"), "me/experiments: #003 vote 없음")
    chars = check("GET", "/api/me/characters", token=USER, keys=("playMinutes", "revealWatched", "whyCount", "badges"))
    badges = check("GET", "/api/me/badges", token=USER, keys=("category", "progress", "rarity"))
    expect(isinstance(badges, list) and any(b.get("featured") for b in badges), "me/badges: 대표 배지 없음")
    for period in ("week", "month", "all"):
        hist = check("GET", f"/api/me/history?period={period}", token=USER, keys=("stats", "weeklySummary", "records", "period"))
        expect(isinstance(hist, dict) and all("kind" in log for log in hist.get("logs", [])), f"me/history?period={period}: logs[].kind 없음")
    check("GET", "/api/me/history?period=year", 422, token=USER, error_code="VALIDATION_ERROR")
    settings = check("GET", "/api/me/settings", token=USER, keys=("rankingAlert", "trainingSpeed", "language", "a11y", "privacy", "connections", "passwordChangedAt"))
    saved = check("PUT", "/api/me/settings", body={"notifications": {"email": False, "push": True, "marketing": False}, "theme": "dark", "whyLevel": "advanced"}, token=USER, keys=("a11y", "privacy"))
    expect(isinstance(saved, dict) and saved.get("theme") == "dark", "PUT me/settings: 보낸 값이 반영되지 않음")
    check("PUT", "/api/me/profile", body={"nickname": "혜원", "avatar": "wormy", "bio": "안녕"}, token=USER, keys=("bio",))
    check("PUT", "/api/me/password", 401, {"current": "wrong", "next": "b"}, token=USER, error_code="INVALID_PASSWORD")
    check("POST", "/api/me/withdraw", 401, {"password": "wrong", "reason": ""}, token=USER, error_code="INVALID_PASSWORD")
    check("PUT", "/api/me/badges/featured", body={"badgeId": "prophet"}, token=USER, keys=("featuredBadgeId",))
    check("PUT", "/api/me/badges/featured", 400, {"badgeId": "creator"}, token=USER, error_code="BADGE_NOT_OBTAINED")
    check("POST", "/api/me/social/kakao", body={"code": "abc"}, token=USER, keys=("connected",))
    check("DELETE", "/api/me/social/google", token=USER, keys=("connected",))
    check("PUT", "/api/me/email", body={"email": "new@playground.ai", "password": "pw"}, token=USER, keys=("verificationRequired",))
    check("POST", "/api/me/export", token=USER, keys=("readyInMin",))
    check("POST", "/api/me/reset", body={"password": "pw", "scope": "experiments"}, token=USER, keys=("ok",))

    # 실험
    exps = call("GET", "/api/experiments")[1]
    exp003 = next((e for e in exps if e["id"] == "003"), {}) if isinstance(exps, list) else {}
    expect(exp003.get("vote", {}).get("pct") == 42, "experiments: #003 vote.pct 42 아님")
    detail = check("GET", "/api/experiments/001", keys=("participants", "avgImprovement", "scene"))
    expect(isinstance(detail, dict) and detail.get("participants") == 3120 and detail.get("avgImprovement") == 46, "experiments/001: 3,120명 · +46%p 아님")
    expect(isinstance(detail, dict) and all("scene" in m for m in detail.get("missions", [])), "experiments/001: missions[].scene 없음")
    check("GET", "/api/experiments/001/missions/m1/briefing", keys=("predictionStats",))
    brief = check("GET", "/api/experiments/001/missions/m1/briefing", token=USER, keys=("myPrediction",))
    check("GET", "/api/experiments/001/missions/m2/briefing", token=USER, keys=("lastPrediction",))
    a = call("POST", "/api/experiments/000/trials", {"missionId": "m1", "speed": 1})[1]
    b = call("POST", "/api/experiments/001/trials", {"missionId": "m1", "speed": 1})[1]
    expect(isinstance(a, dict) and isinstance(b, dict) and a["trial"] < 34 < b["trial"], f"trials: 실험별 카운터가 분리되지 않음 ({a.get('trial')}, {b.get('trial')})")
    why = check("GET", "/api/experiments/001/trials/12/why?level=intermediate", keys=("similarCases", "reward", "step"))
    batch = check("POST", "/api/experiments/001/train-batch", body={"missionId": "m2", "count": 10}, keys=("connections", "journal"))
    expect(isinstance(batch, dict) and all({"success", "timeSec", "path"} <= set(t) for t in batch.get("trials", [])), "train-batch: trials[].success · timeSec · path 없음")
    expect(isinstance(batch, dict) and len(batch.get("connections", [])) == 5 and "from" in batch["connections"][0], "train-batch: connections TOP 5 아님")
    check("GET", "/api/experiments/001/missions/m1/clear", keys=("firstSuccessTrial", "myPrediction", "predictionCorrect"))
    report = check("GET", "/api/experiments/001/report", keys=("metrics", "replay", "prediction", "missionTitle", "participants"))
    expect(isinstance(report, dict) and len(report.get("metrics", [])) == 100 and {"timeSec", "collisions"} <= set(report["metrics"][0]), "report: metrics 100회차 아님")
    r001 = check("GET", "/api/experiments/001/ranking?mission=m1&period=month", keys=("firstSuccessTrial",))
    r000 = check("GET", "/api/experiments/000/ranking", keys=("firstSuccessTrial",))
    expect(isinstance(r000, list) and all(r["character"] == "wormy" for r in r000), "ranking/000: #001 랭킹이 그대로 옴")
    r003 = check("GET", "/api/experiments/003/ranking")
    expect(r003 == [], "ranking/003: 오픈 전 실험인데 순위가 있음")
    check("GET", "/api/experiments/001/ranking?mission=m9", 404, error_code="MISSION_NOT_FOUND")
    check("GET", "/api/share/s-hyewon-001", keys=("missionTitle", "prediction"))

    # 콘텐츠
    cards = check("GET", "/api/cards", keys=("status",))
    expect(isinstance(cards, list) and [c["id"] for c in cards] == [f"card-{i:03d}" for i in range(9)], "cards: 9장 아님")
    for i in range(9):
        card = check("GET", f"/api/cards/card-{i:03d}", keys=("unlocked",))
    tree = check("GET", "/api/tree")
    expect(isinstance(tree, dict) and all("experimentIds" in n and "mastery" in n for n in tree.get("nodes", [])), "tree: experimentIds · mastery 없음")
    check("GET", "/api/dex", keys=("playMinutes", "whyCount"))
    check("GET", "/api/radar", keys=("sourceCount", "postCount", "commentary", "availableWeeks"))
    past = check("GET", "/api/radar?week=2026-10-06", keys=("keywords", "commentary"))
    expect(isinstance(past, dict) and past.get("week") == "2026-10-06", "radar?week=: 지난 주가 아님")
    check("GET", "/api/radar?week=2020-01-01", 404, error_code="RADAR_WEEK_NOT_FOUND")
    kw = check("GET", "/api/radar/tool-calling")
    expect(isinstance(kw, dict) and all("kind" in src for src in kw.get("sources", [])), "radar/tool-calling: sources[].kind 없음")
    check("GET", "/api/home/carousel")
    slides = call("GET", "/api/home/carousel")[1].get("slides", [])
    expect(all({"badge", "level", "durationMin", "tags", "bubble"} <= set(sl) for sl in slides), "carousel: badge · level · durationMin · tags · bubble 없음")
    check("GET", "/api/tech-drops/002", keys=("learn", "conditions"))
    check("DELETE", "/api/tech-drops/002/subscribe", token=USER, keys=("subscribed",))
    check("DELETE", "/api/tech-drops/002/subscribe", 401, error_code="UNAUTHORIZED")
    team = check("GET", "/api/team-missions/t1")
    expect(isinstance(team, dict) and any("event" in m for m in team.get("messages", [])), "team-missions/t1: messages[].event 없음")
    check("GET", "/api/team-missions/t1/result", keys=("metrics",))

    # 알림 · 문의
    notes = check("GET", "/api/notifications", token=USER)
    expect(isinstance(notes, list) and {"character", "ranking", "radar"} <= {n["kind"] for n in notes}, "notifications: character · ranking · radar 종류 없음")
    inq = check("GET", "/api/inquiries", token=USER)
    expect(isinstance(inq, list) and any("answeredAt" in i for i in inq), "inquiries: answeredAt 없음")
    check("POST", "/api/inquiries", body={"category": "WHY?", "title": "t", "body": "b", "notify": True, "experimentId": "001", "trial": 12}, token=USER, keys=("experimentId", "trial", "notify"))
    form2 = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"category\"\r\n\r\n버그\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"title\"\r\n\r\n첨부\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"body\"\r\n\r\n본문\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"trial\"\r\n\r\n12\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"files\"; filename=\"a.png\"\r\nContent-Type: image/png\r\n\r\nPNG\r\n"
        f"--{boundary}--\r\n"
    ).encode()
    check("POST", "/api/inquiries", token=USER, raw=form2, content_type=f"multipart/form-data; boundary={boundary}", keys=("trial",))

    # 관리자
    blocked = call("POST", "/api/admin/otp", {"otpId": "otp-1", "code": "999999"})[1]
    expect(isinstance(blocked, dict) and {"ip", "at"} <= set(blocked.get("error", {})), "admin/otp 403: error.ip · at 없음")
    check("GET", "/api/admin/dashboard", token=ADMIN, keys=("dau", "conversion", "system"))
    cands = check("GET", "/api/admin/radar", token=ADMIN)
    expect(isinstance(cands, dict) and all("growth" in c for c in cands.get("candidates", [])), "admin/radar: growth 없음")
    check("POST", "/api/admin/radar/rc-function-calling/decision", body={"decision": "merged", "mergeInto": "rc-tool-calling"}, token=ADMIN, keys=("ok",))
    check("POST", "/api/admin/radar/rc-function-calling/decision", 404, {"decision": "merged", "mergeInto": "nope"}, token=ADMIN, error_code="CANDIDATE_NOT_FOUND")
    admin_cards = check("GET", "/api/admin/cards", token=ADMIN, keys=("cards",))
    expect(isinstance(admin_cards, dict) and len(admin_cards.get("cards", [])) == 9, "admin/cards: 9장 아님")
    check("GET", "/api/admin/cards/card-003", token=ADMIN, keys=("status",))
    mods = check("GET", "/api/admin/modules", token=ADMIN)
    expect(isinstance(mods, dict) and "voting" in {m["stage"] for m in mods.get("modules", [])}, "admin/modules: voting 단계 없음")
    check("PUT", "/api/admin/modules/003/stage", body={"stage": "scheduled"}, token=ADMIN, keys=("ok",))
    check("PUT", "/api/admin/modules/999/stage", 404, {"stage": "live"}, token=ADMIN, error_code="MODULE_NOT_FOUND")
    users = check("GET", "/api/admin/users", token=ADMIN)
    expect(isinstance(users, dict) and all("level" in u and "partner" in u for u in users.get("users", [])), "admin/users: level · partner 없음")
    for action in ("reset_password", "wipe", "unlock"):
        check("POST", "/api/admin/users/u_8812/action", body={"action": action, "reason": "본인 요청"}, token=ADMIN, keys=("ok",))
    items = check("GET", "/api/admin/inquiries", token=ADMIN)
    expect(isinstance(items, dict) and all("body" in i and "category" in i for i in items.get("items", [])), "admin/inquiries: body · category 없음")
    check("POST", "/api/admin/inquiries/T-2058/answer", body={"body": "답변", "memo": "메모"}, token=ADMIN, keys=("answeredAt",))
    check("POST", "/api/admin/inquiries/T-9999/answer", 404, {"body": "답변"}, token=ADMIN, error_code="INQUIRY_NOT_FOUND")
    check("GET", "/api/admin/notifications", token=ADMIN, keys=("items",))
    check("POST", "/api/admin/admins", body={"email": "new.admin@playground.ai", "role": "콘텐츠 에디터"}, token=ADMIN, keys=("invited",))

    print(f"\n{count}개 호출, 실패 {len(failures)}개")
    for f in failures:
        print(" -", f)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
