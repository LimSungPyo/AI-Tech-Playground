"""사용자·마이페이지 샘플. 값은 Figma B-02, C-02~C-07, A-03 화면과 같다.

성공률·유사도·확률 같은 비율은 모두 0~100(%) 숫자다.
"""

TODAY = "2026-10-17"

HYEWON = {
    "id": "u_hyewon",
    "nickname": "혜원",
    "email": "hyewon@playground.ai",
    "level": 7,
    "avatar": "wormy",
    "role": "user",
    "streak_days": 6,
    "created_at": "2026-10-01T09:00:00+09:00",
    "interests": ["brain", "self_learning", "conversation"],
    "skill": "beginner",
    "partner": "wormy",
    "has_played": True,
}

# G-09: 관리자 권한이 있는 같은 혜원 계정
ADMIN_USER = {**HYEWON, "role": "admin"}

# 회원가입 직후(E-02) 사용자: 아직 파트너가 없다
NEW_USER = {
    **HYEWON,
    "level": 1,
    "streak_days": 0,
    "created_at": "2026-10-17T10:00:00+09:00",
    "interests": [],
    "partner": None,
    "has_played": True,  # 게스트 체험 기록을 이어받았다
}

SETTINGS = {
    "notifications": {"email": True, "push": True, "marketing": False},
    "theme": "light",
    "why_level": "beginner",
}

# B-02 이번 주 2h 06m (C-06 요일별: 토 12 · 일 18 · 월 34 · 화 8 · 수 26 · 목 0 · 금 28)
WEEK = {
    "total_minutes": 126,
    "days": [
        {"day": "토", "minutes": 12},
        {"day": "일", "minutes": 18},
        {"day": "월", "minutes": 34},
        {"day": "화", "minutes": 8},
        {"day": "수", "minutes": 26},
        {"day": "목", "minutes": 0},
        {"day": "금", "minutes": 28},
    ],
}

WEEK_DATES = ["2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17"]

HOME_PARTNER = {
    "character": "wormy",
    "level": 3,
    "title": "MASTER",
    "message": "어제 드로시가 52% → 58%까지 올랐어! 오늘은 장애물 피하기에 도전해 볼래?",
}

HOME_TECH_DROP = {"code": "002", "title": "RAG 탐정", "d_day": 14, "subscribed": True}

HOME_TEAM = {
    "ready": True,
    "text": '마스터 2명(웜이 · 드로시)이 모였어요. 첫 팀 미션 "드로시의 생일 파티"가 열렸어요!',
    "mission_id": "t1",
}

LAST_WHY = "지난번 마지막 선택 — 오른쪽 위로 이동 (확률 78%, 유사도 83%)"

# A-03 파트너 추천
PARTNER_RECOMMENDATION = {
    "primary": {
        "character": "wormy",
        "reason": "「뇌를 닮은 AI」를 골랐죠? 웜이는 전체 신경 연결이 처음 밝혀진 가장 작은 뇌예요. 「처음이에요」 → 5분이면 끝나는 입문 실험부터.",
        "score": 1.0,
    },
    "alternatives": [
        {"character": "parrot", "reason": "관심사 「대화하는 AI」 일치. 다음 단어를 예측하는 원리를 배워요."},
        {"character": "drosi", "reason": "관심사 「스스로 배우는 AI」 일치. 서비스의 대표 경험이라 항상 함께 추천해요."},
    ],
}

# C-02 대시보드
DASHBOARD_STATS = {"experiments": 4, "trials": 187, "cards": 3, "badges": 5}


def _streak_calendar() -> list[dict]:
    """최근 15주 학습 잔디. 마지막 6일은 연속 학습(목요일은 보호권)."""
    import datetime as dt

    end = dt.date(2026, 10, 17)
    pattern = [0, 22, 0, 35, 14, 0, 48, 9, 0, 0, 27, 31, 0, 16]
    days = []
    for i in range(105):
        day = end - dt.timedelta(days=104 - i)
        minutes = pattern[(i * 5) % len(pattern)]
        days.append({"date": day.isoformat(), "minutes": minutes})
    for d, m in zip(WEEK_DATES, [12, 18, 34, 8, 26, 0, 28]):
        days[-7 + WEEK_DATES.index(d)] = {"date": d, "minutes": m}
    return days


STREAK_CALENDAR = _streak_calendar()

# C-06 학습 기록
HISTORY_LOGS = [
    {"date": "2026-10-17T14:20:00+09:00", "experiment_id": "001", "text": "#001 Trial 30–34 훈련 · 성공률 52% → 58%"},
    {"date": "2026-10-17T14:05:00+09:00", "experiment_id": "001", "text": 'STEP 37 "오른쪽 위" 선택 근거 확인 (유사도 83%)'},
    {"date": "2026-10-16T21:40:00+09:00", "experiment_id": "000", "text": '웜이 마스터(Lv.3) 달성 · 반전 연출 시청 · 배지 "커넥톰 입문"'},
    {"date": "2026-10-15T20:10:00+09:00", "experiment_id": "007", "text": "#007 시작 · Trial 1–3"},
    {"date": "2026-10-14T19:30:00+09:00", "experiment_id": "001", "text": 'WHY? 9회 열람 · 배지 "WHY? 탐구자" 획득'},
    {"date": "2026-10-12T16:00:00+09:00", "experiment_id": "001", "text": '미션 1 첫 성공 (Trial 10) · 예측 적중 · 배지 "예언가"'},
]

# C-05 배지 (5 / 12 획득)
BADGES = [
    {"id": "first-clear", "name": "첫 성공", "description": "미션을 처음 성공", "obtained": True, "obtained_at": "2026-10-12", "icon": "★"},
    {"id": "prophet", "name": "예언가", "description": "브리핑 예측을 맞힘", "obtained": True, "obtained_at": "2026-10-12", "icon": "◎"},
    {"id": "hundred-trials", "name": "100회 훈련", "description": "한 실험에서 100회 훈련", "obtained": False, "icon": "C"},
    {"id": "why-explorer", "name": "WHY? 탐구자", "description": "WHY?를 20번 열어봄", "obtained": True, "obtained_at": "2026-10-14", "icon": "?"},
    {"id": "reveal-witness", "name": "반전 목격자", "description": "반전 연출을 끝까지 봄", "obtained": True, "obtained_at": "2026-10-16", "icon": "✦"},
    {"id": "card-collector", "name": "기술 카드 수집가", "description": "기술 카드 5장 열람", "obtained": False, "icon": "▦"},
    {"id": "connectome-intro", "name": "커넥톰 입문", "description": "웜이를 마스터", "obtained": True, "obtained_at": "2026-10-16", "icon": "◈"},
    {"id": "streak-7", "name": "7일 연속", "description": "7일 연속 학습", "obtained": False, "icon": "7"},
    {"id": "streak-30", "name": "30일 연속", "description": "30일 연속 학습", "obtained": False, "icon": "30"},
    {"id": "team-leader", "name": "팀 리더", "description": "팀 미션 첫 완료", "obtained": False, "icon": "♛"},
    {"id": "rag-detective", "name": "RAG 탐정", "description": "#002 실험 완료", "obtained": False, "icon": "❖"},
    {"id": "creator", "name": "창조자", "description": "Create Your AI로 첫 AI 만들기", "obtained": False, "icon": "✚"},
]

# 캐릭터 로스터(NOTES A) + C-04 내 캐릭터 상태. 만남 3 · 발견 1 · 잠김 5
DEX = [
    {
        "id": "dex-wormy", "character": "wormy", "name": "웜이", "species": "예쁜꼬마선충", "experiment_id": "000",
        "level": 3, "title": "MASTER", "obtained": True, "obtained_at": "2026-10-03", "best_rate": 91, "trials": 128,
        "why": "뉴런 302개, 처음으로 전체 연결(커넥톰)이 밝혀진 생물. 가장 작은 신경망 교과서.",
        "personality": "느긋하고 다정함", "meet_condition": '처음부터 · "아직 잘 몰라요" 추천', "state": "master",
    },
    {
        "id": "dex-drosi", "character": "drosi", "name": "드로시", "species": "초파리", "experiment_id": "001",
        "level": 3, "title": "MASTER", "obtained": True, "obtained_at": "2026-10-10", "best_rate": 86, "trials": 134,
        "why": "초파리 뇌 커넥톰을 단순화한 뉴런 모델로 움직여요. 서비스의 대표 얼굴.",
        "personality": "호기심 많고 엉뚱함", "meet_condition": "기본 제공 · 대표 실험", "state": "master",
    },
    {
        "id": "dex-parrot", "character": "parrot", "name": "패롯", "species": "앵무새", "experiment_id": "007",
        "level": 1, "title": "훈련 중", "obtained": True, "obtained_at": "2026-10-15", "best_rate": 21, "trials": 3,
        "why": "들은 말을 그럴듯하게 이어 말하는 앵무새. 다음 단어 예측과 그 한계(환각)를 함께 배워요.",
        "personality": "수다쟁이, 가끔 아는 척", "meet_condition": '온보딩 "대화하는 AI"', "state": "growing",
    },
    {
        "id": "dex-hawk", "character": "hawk", "name": "매눈이", "species": "매", "experiment_id": "006",
        "level": 0, "title": "발견", "obtained": False,
        "why": '멀리 있는 작은 움직임도 잡아내는 눈. 이미지 인식과 "어디를 봤는지(주목 영역)".',
        "personality": "예리하고 집중력 최고", "meet_condition": '온보딩 "그림을 보는 AI"', "state": "egg",
    },
    {
        "id": "dex-owl", "character": "owl", "name": "부엉", "species": "부엉이 사서", "experiment_id": "002",
        "level": 0, "title": "잠김", "obtained": False,
        "why": "질문과 가까운 책을 찾아와 근거로 답하는 도서관 사서. 검색 + 생성.",
        "personality": "차분한 박식가", "meet_condition": "LLM 노드 완료", "state": "egg",
    },
    {
        "id": "dex-octo", "character": "octo", "name": "옥토", "species": "문어", "experiment_id": "003",
        "level": 0, "title": "잠김", "obtained": False,
        "why": "다리마다 다른 도구를 쥔 문어. 필요할 때 알맞은 도구(API)를 골라 써요.",
        "personality": "손 빠른 해결사", "meet_condition": "LLM 노드 완료", "state": "egg",
    },
    {
        "id": "dex-ants", "character": "ants", "name": "앤티 팀", "species": "개미 군단", "experiment_id": "004",
        "level": 0, "title": "잠김", "obtained": False,
        "why": "역할을 나눠 협업하는 개미. 계획 · 조사 · 실행 에이전트의 분업과 소통.",
        "personality": "셋이 하나, 팀워크", "meet_condition": "에이전트 노드 해금", "state": "egg",
    },
    {
        "id": "dex-memo", "character": "memo", "name": "메모", "species": "코끼리", "experiment_id": "005",
        "level": 0, "title": "잠김", "obtained": False,
        "why": '"코끼리는 잊지 않는다." 대화와 경험을 기억해 다음 행동에 활용해요.',
        "personality": "신중한 기록가", "meet_condition": "LLM + 강화학습 완료", "state": "egg",
    },
    {
        "id": "dex-mappy", "character": "mappy", "name": "맵피", "species": "생쥐", "experiment_id": "008",
        "level": 0, "title": "잠김", "obtained": False,
        "why": "미로 속 생쥐가 머릿속 지도를 그리듯, 세상의 모델을 만들고 미리 상상해요.",
        "personality": "계획적인 탐험가", "meet_condition": "비전 + 강화학습 완료", "state": "egg",
    },
]
