"""실험·플레이·리포트·랭킹 샘플. 값은 Figma G-01, G-02, B-03~B-08, H-05 화면과 같다."""

import math

# 캐릭터 로스터 표 순서: #000 웜이 ~ #008 맵피
EXPERIMENTS = [
    {
        "id": "000", "code": "#000", "title": "302개 뉴런으로 꿈틀꿈틀", "subtitle": "신경망 기초",
        "level": "intro", "character": "wormy", "tags": ["신경망 기초"], "duration_min": 5,
        "status": "open", "progress": {"trial": 30, "max_trial": 30, "success_rate": 91},
        "thumbnail_color": "#F4A9B8",
    },
    {
        "id": "001", "code": "#001", "title": "나만의 초파리 키우기", "subtitle": "뇌 모사 AI",
        "level": "frontier", "character": "drosi", "tags": ["강화학습", "커넥톰"], "duration_min": 10,
        "status": "in_progress", "progress": {"trial": 34, "max_trial": 100, "success_rate": 58},
        "thumbnail_color": "#7C6CF2",
    },
    {
        "id": "002", "code": "#002", "title": "RAG 탐정", "subtitle": "RAG",
        "level": "advanced", "character": "owl", "tags": ["RAG", "임베딩"], "duration_min": 8,
        "status": "coming_soon", "unlock_condition": "10.31 오픈 · LLM 노드 완료 (#007)",
        "thumbnail_color": "#B08968",
    },
    {
        "id": "003", "code": "#003", "title": "도구 쓰는 문어", "subtitle": "Tool Calling",
        "level": "advanced", "character": "octo", "tags": ["Tool Calling"], "duration_min": 8,
        "status": "coming_soon", "unlock_condition": "투표 중 · 42%",
        "thumbnail_color": "#F28C6C",
    },
    {
        "id": "004", "code": "#004", "title": "Multi-Agent 회의실", "subtitle": "Multi-Agent",
        "level": "advanced", "character": "ants", "tags": ["Multi-Agent"], "duration_min": 12,
        "status": "locked", "unlock_condition": "에이전트 노드 해금 시",
        "thumbnail_color": "#C0504D",
    },
    {
        "id": "005", "code": "#005", "title": "기억하는 코끼리", "subtitle": "Memory",
        "level": "advanced", "character": "memo", "tags": ["Agent Memory"], "duration_min": 10,
        "status": "locked", "unlock_condition": "LLM + 강화학습 완료 시",
        "thumbnail_color": "#9AA5B1",
    },
    {
        "id": "006", "code": "#006", "title": "어디를 봤을까? 히트맵", "subtitle": "비전",
        "level": "basic", "character": "hawk", "tags": ["비전", "주목 영역"], "duration_min": 8,
        "status": "open", "progress": {"trial": 20, "max_trial": 20, "success_rate": 74},
        "thumbnail_color": "#D4A24C",
    },
    {
        "id": "007", "code": "#007", "title": "다음 단어 맞히기", "subtitle": "LLM",
        "level": "basic", "character": "parrot", "tags": ["LLM", "다음 단어 예측"], "duration_min": 8,
        "status": "in_progress", "progress": {"trial": 3, "max_trial": 50, "success_rate": 21},
        "thumbnail_color": "#4CAF7A",
    },
    {
        "id": "008", "code": "#008", "title": "머릿속 지도 생쥐", "subtitle": "월드 모델",
        "level": "frontier", "character": "mappy", "tags": ["World Model"], "duration_min": 12,
        "status": "locked", "unlock_condition": "비전 + 강화학습 완료 시",
        "thumbnail_color": "#8C8FA6",
    },
]

EXPERIMENTS_BY_ID = {e["id"]: e for e in EXPERIMENTS}

# 상세 화면용 추가 정보. #001은 G-02 화면 그대로, 나머지는 로스터 설명으로 채운다.
MISSIONS_001 = [
    {"id": "m1", "title": "먹이 찾기", "goal": "60초 안에 먹이에 도착", "status": "cleared", "success_threshold": 60, "best_rate": 86},
    {"id": "m2", "title": "장애물 피하기", "goal": "시야로 장애물을 보고 돌아가 먹이에 도착", "status": "open", "success_threshold": 60},
    {"id": "m3", "title": "짝 찾기", "goal": "두 가지 신호를 동시에 판단", "status": "locked", "success_threshold": 60},
]

DETAILS = {
    "000": {
        "description": "전체 신경 연결이 처음 밝혀진 가장 작은 뇌. 5분이면 \"신경망이 뭔지\" 감이 와요.",
        "missions": [
            {"id": "m1", "title": "냄새 따라가기", "goal": "냄새 진한 쪽으로 이동해 먹이에 도착", "status": "cleared", "success_threshold": 85, "best_rate": 91},
            {"id": "m2", "title": "온도 맞추기", "goal": "좋아하는 온도 구역에 머물기", "status": "open", "success_threshold": 60},
        ],
        "stats": {"first_trial_rate": 12, "hundredth_trial_rate": 91},
        "principle": "실제 예쁜꼬마선충의 화학 주성 회로(감각 ASE · AWC → 중간 AIY · AIZ → 운동 SMD)를 단순화했어요.",
    },
    "001": {
        "description": "초파리 뇌 커넥톰을 단순화한 뉴런 모델로 움직이는 드로시를 훈련시켜요. 미션을 하나씩 깰 때마다 같은 뇌가 새로운 행동을 배워요.",
        "missions": MISSIONS_001,
        "stats": {"first_trial_rate": 12, "hundredth_trial_rate": 86},
        "principle": "보상으로 배우는 강화학습 · 감각 → 중간 → 운동 뉴런 경로 · 실제 뇌와 단순화 모델의 차이(정직 고지)",
    },
}


def detail_for(exp_id: str) -> dict:
    """상세 응답 dict. 따로 적어 둔 실험이 아니면 로스터 설명으로 기본값을 만든다."""
    summary = EXPERIMENTS_BY_ID[exp_id]
    extra = DETAILS.get(exp_id) or {
        "description": f"{summary['subtitle']}의 원리를 {summary['title']} 실험으로 직접 해 봐요.",
        "missions": [
            {"id": "m1", "title": "미션 1", "goal": "첫 목표 달성", "status": "locked" if summary["status"] != "open" else "open", "success_threshold": 60},
            {"id": "m2", "title": "미션 2", "goal": "두 번째 목표 달성", "status": "locked", "success_threshold": 60},
        ],
        "stats": {"first_trial_rate": 0, "hundredth_trial_rate": 0},
        "principle": summary["subtitle"],
    }
    return {**summary, **extra, "card_id": f"card-{exp_id}"}


# B-03 · G-04 미션 브리핑
BRIEFINGS = {
    "m1": {
        "story": "드로시에게 먹이 찾는 법을 가르쳐 주세요. Trial 1의 드로시는 아무것도 몰라요. 보상을 받을수록 감각과 행동을 잇는 연결이 조금씩 강해집니다.",
        "objectives": ["60초 안에 먹이에 도착", "냄새(감각 뉴런 S1–S3)로 먹이 방향 찾기"],
        "prediction": {
            "question": "드로시가 몇 번째 훈련에서 처음 먹이에 도착할까요?",
            "options": ["1 – 10회", "11 – 30회", "31 – 60회", "61회 이상"],
        },
        "tips": [
            "+1.0 먹이에 도착",
            "+0.1 먹이에 가까워질 때마다",
            "−0.5 장애물에 부딪힘",
            "−0.01 한 걸음마다 (빨리 찾도록)",
        ],
    },
    "m2": {
        "story": "이번엔 장애물을 피해서 먹이까지 가 보자. 미션 1에서 배운 \"냄새 따라가기\"는 그대로 가져가요. 새로 배울 건 \"보고 멈추고 돌아가기\"예요.",
        "objectives": ["장애물에 부딪히지 않고 먹이에 도착", "시야(감각 뉴런 S4–S5)로 장애물까지의 거리 판단"],
        "prediction": {
            "question": "드로시가 처음 장애물을 피하는 건 몇 번째 훈련일까요?",
            "options": ["1 – 10회", "11 – 30회", "31 – 60회", "61회 이상"],
        },
        "tips": [
            "+1.0 먹이에 도착",
            "−0.5 장애물에 부딪힘",
            "+0.2 장애물을 보고 돌아감 (NEW)",
            "−0.01 한 걸음마다",
            "미션 1에서 강해진 연결(냄새 오른쪽 → 오른쪽 이동 +0.34)을 그대로 가져와요.",
        ],
    },
}

# 플레이 좌표계: 0~100. 출발점은 왼쪽 아래, 먹이는 오른쪽 위.
START = (14.0, 82.0)
FOOD = (82.0, 20.0)


def first_path(points: int = 32) -> list[dict]:
    """1회차 경로: 목표와 상관없이 지그재그로 헤맨다."""
    path = []
    for i in range(points):
        t = i / (points - 1)
        x = START[0] + 34 * t + 9 * math.sin(i * 1.3)
        y = START[1] - 22 * t + (8 if i % 2 else -8) + 4 * math.cos(i * 0.7)
        path.append({"x": round(min(max(x, 2), 98), 1), "y": round(min(max(y, 2), 98), 1)})
    return path


def trained_path(trial: int, points: int = 24) -> list[dict]:
    """훈련된 경로: 목표 쪽으로 거의 곧게. 회차가 클수록 흔들림이 준다."""
    wobble = max(0.5, 6.0 - trial * 0.08)
    path = []
    for i in range(points):
        t = i / (points - 1)
        x = START[0] + (FOOD[0] - START[0]) * t + wobble * math.sin(i * 0.9) * (1 - t)
        y = START[1] + (FOOD[1] - START[1]) * t + wobble * math.cos(i * 1.1) * (1 - t)
        path.append({"x": round(x, 1), "y": round(y, 1)})
    return path


NEURONS = [
    {"layer": "sensory", "id": "S1", "activation": 0.21},
    {"layer": "sensory", "id": "S2", "activation": 0.34},
    {"layer": "sensory", "id": "S3", "activation": 0.82},
    {"layer": "sensory", "id": "S4", "activation": 0.47},
    {"layer": "inter", "id": "I1", "activation": 0.12},
    {"layer": "inter", "id": "I2", "activation": 0.38},
    {"layer": "inter", "id": "I3", "activation": 0.25},
    {"layer": "inter", "id": "I4", "activation": 0.51},
    {"layer": "inter", "id": "I5", "activation": 0.67},
    {"layer": "inter", "id": "I6", "activation": 0.09},
    {"layer": "motor", "id": "M1", "activation": 0.14},
    {"layer": "motor", "id": "M2", "activation": 0.91},
    {"layer": "motor", "id": "M3", "activation": 0.33},
]

# B-04 · B-05 WHY? (TRIAL 12 · STEP 37)
WHY_BASE = {
    "similar_experiences": 12,
    "similarity": 83,
    "choices": [
        {"label": "오른쪽 위", "probability": 78},
        {"label": "직진", "probability": 12},
        {"label": "왼쪽", "probability": 7},
        {"label": "멈춤", "probability": 3},
    ],
    "neuron_path": ["S3", "I5", "M2"],
}

WHY_BY_LEVEL = {
    "beginner": {
        "summary": "오른쪽 위에서 먹이 냄새가 강했고, 비슷한 상황에서 오른쪽으로 갔을 때 보상을 받은 적이 많아서 오른쪽 위를 골랐어요.",
        "detail": "먹이 냄새 감지 → 감각 뉴런 S3 활성 → 운동 뉴런 M2 발화 → 오른쪽 위로 이동",
    },
    "intermediate": {
        "summary": "지난 12회 경험에서 오른쪽 위 경로의 보상이 높았고, 지금 상황과 과거 상황의 유사도가 83%여서 이 방향을 고를 확률이 78%였어요.",
        "detail": "S3 냄새(오른쪽) 활성도 0.82 → I5 중간 뉴런 0.67 → M2 오른쪽으로 0.91. 비슷했던 과거 경험 T4(71%, +1.0) · T7(79%, +1.0) · T9(83%, +1.0) · T11(64%, −0.5).",
    },
    "advanced": {
        "summary": "P(오른쪽 위)=0.78 · P(직진)=0.12 · P(왼쪽)=0.07 · P(멈춤)=0.03",
        "detail": "근거 · 유사 상황 12회 · 유사도 83% · 보상 +0.6 · 경로 S3(0.82) → I5(0.67) → M2(0.91)",
    },
}


def why_for(level: str = "beginner") -> dict:
    return {**WHY_BASE, **WHY_BY_LEVEL[level], "level": level}


# 화면 값에 맞춘 성공률 기준점: T1 12% · T12 42% · T22 51% · T33 52% · T34 58% · T100 86%
RATE_ANCHORS = [(1, 12), (6, 20), (10, 34), (12, 42), (22, 51), (33, 52), (34, 58), (47, 68), (70, 79), (100, 86)]


def success_rate_at(trial: int) -> int:
    """기준점 사이를 직선으로 이은 샘플 성공률(%)."""
    if trial <= RATE_ANCHORS[0][0]:
        return RATE_ANCHORS[0][1]
    for (t0, r0), (t1, r1) in zip(RATE_ANCHORS, RATE_ANCHORS[1:]):
        if trial <= t1:
            return round(r0 + (r1 - r0) * (trial - t0) / (t1 - t0))
    return RATE_ANCHORS[-1][1]


def curve_until(trial: int) -> list[dict]:
    return [{"trial": t, "success_rate": success_rate_at(t)} for t in range(1, trial + 1)]


JOURNAL = {
    1: "제자리를 빙글빙글 돌았어요.",
    6: "먹이 냄새 쪽으로 고개를 돌리기 시작했어요.",
    10: "처음으로 먹이까지 직진했어요!",
    12: "장애물 앞에서 멈칫하는 횟수가 줄었어요.",
}
JOURNAL_DEFAULT = "오른쪽에서 냄새가 나면… 오른쪽! 이제 좀 알 것 같아!"

# B-06 ×10 훈련: 성공 여부 순서 (T13~T22)
BATCH_SUCCESS = [True, False, True, True, False, True, True, True, False, True]

# B-07 미션 성공
CLEAR_UNLOCKED = {
    "m1": [
        {"kind": "mission", "id": "m2", "title": "미션 2 · 장애물 피하기"},
        {"kind": "dex", "id": "dex-drosi-03", "title": "AI 도감 No.003 카드"},
        {"kind": "card", "id": "card-001", "title": "기술 카드 · 커넥톰"},
    ],
    "m2": [{"kind": "mission", "id": "m3", "title": "미션 3 · 짝 찾기"}],
}

# B-08 성장 리포트
REPORT_001 = {
    "experiment_id": "001",
    "summary": "100회 훈련 동안 성공률 12% → 86% (+74%p), 평균 도달 시간 24.1s → 6.3s (-74%), 평균 충돌 수 9.4 → 0.8 (-91%)",
    "before": {"trial": 1, "success_rate": 12, "time_sec": 24.1, "collisions": 9.4},
    "after": {"trial": 100, "success_rate": 86, "time_sec": 6.3, "collisions": 0.8},
    "events": [
        {"trial": 10, "label": "처음으로 먹이까지 직진"},
        {"trial": 47, "label": "장애물 회피 학습"},
    ],
    "commentary": "드로시는 초반 10회 동안 거의 무작위로 움직였지만, 먹이 냄새를 감지한 감각 뉴런과 오른쪽 운동 뉴런 사이의 연결이 강화되면서 직진 비율이 크게 높아졌어요. 다음에는 「장애물 피하기」 미션이나 기술 트리의 「강화학습」 노드를 추천해요.",
}

# H-05 랭킹 전체 (#001 미션 1, 이번 주)
RANKING_001 = [
    {"rank": 1, "nickname": "flylab_kim", "character": "drosi", "success_rate": 94, "trials": 61, "is_me": False},
    {"rank": 2, "nickname": "neuron_j", "character": "drosi", "success_rate": 91, "trials": 48, "is_me": False},
    {"rank": 3, "nickname": "beebrain", "character": "drosi", "success_rate": 89, "trials": 52, "is_me": False},
    {"rank": 4, "nickname": "synapse_lee", "character": "drosi", "success_rate": 88, "trials": 42, "is_me": False},
    {"rank": 5, "nickname": "도로롱", "character": "drosi", "success_rate": 87, "trials": 38, "is_me": False},
    {"rank": 6, "nickname": "fly_master", "character": "drosi", "success_rate": 87, "trials": 55, "is_me": False},
    {"rank": 7, "nickname": "?? 부적절한닉 ??", "character": "drosi", "success_rate": 86, "trials": 40, "is_me": False},
    {"rank": 42, "nickname": "드로시 #03", "character": "drosi", "success_rate": 86, "trials": 34, "is_me": True},
]

SHARE_ID = "s-hyewon-001"
SHARED_RESULT = {"nickname": "hyewon", "rate": 86, "trials": 10, "character": "drosi"}
