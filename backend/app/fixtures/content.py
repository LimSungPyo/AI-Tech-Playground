"""기술 카드·트리·레이더·홈·투표·팀 미션 샘플. 값은 Figma B-02, B-10, B-12, B-13, D-07~D-10 화면과 같다."""

# B-02 오늘의 추천 (D-06 추천 점수)
RECOMMENDATIONS = [
    {
        "id": "rec-001-m2", "kind": "continue", "badge": "이어하기", "title": "미션 2 · 장애물 피하기",
        "body": "성공률 60%를 넘겨 새로 열렸어요", "meta": "최근 성공률 상승 중", "character": "drosi",
        "target": "/experiments/001/missions/m2/briefing",
        "reason": "추천 점수 0.92 · 성공률 60% 돌파 · 해금 직후 · 3일 연속 상승",
    },
    {
        "id": "rec-007", "kind": "in_progress", "badge": "진행 중", "title": "#007 다음 단어 맞히기",
        "body": "Trial 3에서 멈춰 있어요", "meta": "3일째 미접속", "character": "parrot",
        "target": "/experiments/007/play",
        "reason": "추천 점수 0.71 · 3일째 미접속 · 진행률 6%",
    },
    {
        "id": "rec-card-001", "kind": "card", "badge": "기술 카드", "title": "커넥톰은 어떻게 만들까?",
        "body": "반전을 봤다면 다음은 원리", "meta": "이해 배지까지 1장", "character": "drosi",
        "target": "/cards/card-001",
        "reason": "추천 점수 0.66 · 반전 시청 완료 · 카드 미열람 · 배지까지 1장",
    },
]

# B-10 기술 카드
CARDS = [
    {
        "id": "card-001",
        "title": "커넥톰은 어떻게 만들까?",
        "experiment_id": "001",
        "steps": [
            {"kind": "research", "title": "FlyWire 초파리 전체 뇌 커넥톰", "body": "성체 초파리 뇌의 뉴런과 시냅스 연결을 전자현미경 영상으로 재구성한 공개 데이터셋."},
            {"kind": "mechanism", "title": "감각 → 중간 → 운동 뉴런 경로", "body": "먹이·장애물 감지와 관련된 회로의 연결 구조와 방향성을 가져왔어요."},
            {"kind": "simplification", "title": "회로 축소 + 단순 발화 모델", "body": "관련 회로만 추리고 각 뉴런을 단순한 발화 모델로 근사했어요. 실제 뇌의 복제가 아니에요."},
            {"kind": "implementation", "title": "게임 입력 ↔ 뉴런 ↔ 행동", "body": "감각 정보를 뉴런 입력으로, 운동 뉴런 활동을 캐릭터 행동으로 연결하고 보상에 따라 강화학습으로 조정해요."},
        ],
        "biological_vs_designed": {
            "biological": ["뉴런 간 연결 여부와 방향", "감각 → 중간 → 운동 경로의 구조", "연결 강도(시냅스 수) 초기값"],
            "designed": ["뉴런 발화 모델 (단순화)", "게임 입력 / 출력 매핑", "보상 함수와 강화학습 계층", "회차 · 성공률 등 지표 정의"],
        },
        "sources": [
            {"title": "FlyWire Consortium — Whole-brain connectome of the adult Drosophila", "url": "https://flywire.ai"},
        ],
        "unlocked": True,
        "reveal": {
            "headline": "사실, 드로시는 초파리의 신경 연결망으로 움직이고 있었어요",
            "body": "지금까지 플레이한 캐릭터의 행동은 공개된 초파리 커넥톰(FlyWire 등)을 단순화한 뉴런 모델에서 나왔어요. 아래 기술 카드에서 무엇을 가져와 어떻게 단순화했는지 확인하세요.",
        },
    },
    {
        "id": "card-000",
        "title": "302개 뉴런의 지도",
        "experiment_id": "000",
        "steps": [
            {"kind": "research", "title": "예쁜꼬마선충 커넥톰 (1986)", "body": "과학자들이 전자현미경 사진 수천 장으로 선충의 모든 뉴런 연결을 그렸어요."},
            {"kind": "mechanism", "title": "화학 주성 회로", "body": "감각 ASE · AWC → 중간 AIY · AIZ → 운동 SMD로 이어지는 냄새 따라가기 회로."},
            {"kind": "simplification", "title": "회로 축소", "body": "302개 중 이번 행동에 쓰이는 회로만 골라 단순한 발화 모델로 근사했어요."},
            {"kind": "implementation", "title": "냄새 농도 ↔ 머리 방향", "body": "냄새 농도를 감각 입력으로, 운동 뉴런 활동을 머리 방향으로 연결했어요."},
        ],
        "biological_vs_designed": {
            "biological": ["302개 뉴런의 연결 지도", "화학 주성 회로 구조"],
            "designed": ["발화 모델 (단순화)", "보상 함수", "꿈틀 효율 지표"],
        },
        "sources": [{"title": "OpenWorm", "url": "https://openworm.org"}],
        "unlocked": True,
        "reveal": {"headline": "사실, 웜이는 선충의 302개 뉴런 지도대로 움직이고 있었어요", "body": "실제 예쁜꼬마선충의 화학 주성 회로를 단순화했어요."},
    },
    {
        "id": "card-007",
        "title": "다음 단어는 어떻게 고를까?",
        "experiment_id": "007",
        "steps": [
            {"kind": "research", "title": "언어 모델", "body": "앞 단어들을 보고 다음 단어의 확률을 계산하는 모델."},
            {"kind": "mechanism", "title": "다음 단어 예측", "body": "가장 그럴듯한 단어를 확률로 골라 이어 말해요."},
            {"kind": "simplification", "title": "작은 어휘 집합", "body": "어휘를 줄이고 확률표를 그대로 보여 줘요."},
            {"kind": "implementation", "title": "패롯의 말 잇기", "body": "패롯이 고른 단어와 확률을 단계별로 보여 줘요. 그럴듯하지만 틀릴 수 있어요(환각)."},
        ],
        "biological_vs_designed": {"biological": [], "designed": ["어휘 집합", "확률 시각화", "환각 예시"]},
        "sources": [{"title": "Attention Is All You Need", "url": "https://arxiv.org/abs/1706.03762"}],
        "unlocked": False,
        "reveal": {"headline": "사실, 패롯은 확률표를 보고 말하고 있었어요", "body": "다음 단어 예측의 원리와 한계를 함께 봐요."},
    },
]

CARDS_BY_ID = {c["id"]: c for c in CARDS}

# B-12 기술 트리. position은 0~100 캔버스 비율(열 = 티어, 행 = 줄).
TREE_NODES = [
    {
        "id": "node-llm", "title": "LLM", "level": "basic", "status": "done", "experiment_id": "007", "character": "parrot",
        "parents": [], "position": {"x": 14, "y": 18},
        "description": "다음 단어를 예측하며 말을 잇는 언어 모델. 완료 · EXP #007",
    },
    {
        "id": "node-vision", "title": "비전", "level": "basic", "status": "done", "experiment_id": "006", "character": "hawk",
        "parents": [], "position": {"x": 14, "y": 50},
        "description": "이미지에서 무엇을, 어디를 보는지 배우는 기술. 완료 · EXP #006",
    },
    {
        "id": "node-rl", "title": "강화학습", "level": "basic", "status": "done", "experiment_id": "001", "character": "drosi",
        "parents": [], "position": {"x": 14, "y": 82},
        "description": "잘하면 보상, 못하면 벌점. 수없이 시도하면서 점점 더 나은 행동을 찾아가는 학습 방법이에요. 완료 · EXP #001 일부",
    },
    {
        "id": "node-rag", "title": "RAG", "level": "advanced", "status": "open", "experiment_id": "002", "character": "owl",
        "parents": ["node-llm"], "position": {"x": 50, "y": 18},
        "description": "질문과 가까운 문서를 찾아와 근거로 답하는 검색 + 생성. 해금됨 · EXP #002",
    },
    {
        "id": "node-agent", "title": "에이전트", "level": "advanced", "status": "open", "experiment_id": "003", "character": "octo",
        "parents": ["node-llm", "node-rl"], "position": {"x": 50, "y": 50},
        "description": "LLM이 목표를 위해 스스로 계획을 세우고 도구를 호출하는 구조. LLM과 강화학습 노드를 완료해서 해금됐어요.",
    },
    {
        "id": "node-world-model", "title": "월드 모델", "level": "frontier", "status": "locked", "experiment_id": "008", "character": "mappy",
        "parents": ["node-vision", "node-rl"], "position": {"x": 50, "y": 82},
        "description": "세상의 모델을 머릿속에 만들고 미리 상상해 보는 기술.",
        "unlock_condition": "비전 + 강화학습 완료 시",
    },
    {
        "id": "node-brain", "title": "뇌 모사 AI", "level": "frontier", "status": "in_progress", "experiment_id": "001", "character": "drosi",
        "parents": ["node-agent", "node-world-model"], "position": {"x": 86, "y": 50},
        "description": "실제 뇌의 연결망(커넥톰)을 단순화한 뉴런 모델로 움직이는 AI. 플레이 중 · EXP #001",
    },
]

# B-02 · D-07 · D-08 기술 레이더 (2026.10.13 주)
RADAR_WEEK = "2026-10-13"
RADAR_UPDATED_AT = "2026-10-13T09:00:00+09:00"

RADAR_KEYWORDS = [
    {
        "id": "tool-calling", "name": "Tool Calling", "change_pct": 42, "weeks": [61, 74, 98, 139],
        "summary": "AI가 혼자 답하지 않고, 날씨 · 계산기 · 검색 같은 \"도구(API)\"를 골라 불러서 일을 해결하는 기술이에요.",
        "related_experiment_id": "003",
        "sources": [
            {"title": "arXiv · 도구 사용 에이전트 벤치마크 (예시)", "url": "https://arxiv.org"},
            {"title": "GitHub · tool-calling 오픈소스 (예시)", "url": "https://github.com"},
            {"title": "Hacker News · 토론 스레드 (예시)", "url": "https://news.ycombinator.com"},
        ],
    },
    {
        "id": "agent-memory", "name": "Agent Memory", "change_pct": 31, "weeks": [40, 46, 55, 72],
        "summary": "에이전트가 대화와 경험을 기억해 두었다가 다음 행동에 활용하는 기술이에요.",
        "related_experiment_id": "005",
        "sources": [{"title": "arXiv · 에이전트 장기 기억 (예시)", "url": "https://arxiv.org"}],
    },
    {
        "id": "connectome", "name": "Connectome", "change_pct": 18, "weeks": [30, 33, 38, 45],
        "summary": "뇌의 뉴런과 시냅스 연결 전체를 지도로 그린 것. 드로시가 이 지도를 단순화한 모델로 움직여요.",
        "related_experiment_id": "001",
        "sources": [{"title": "FlyWire Consortium", "url": "https://flywire.ai"}],
    },
    {
        "id": "small-lm", "name": "Small LM", "change_pct": 12, "weeks": [25, 27, 29, 32],
        "summary": "작은 크기로도 쓸 만한 성능을 내는 언어 모델이에요.",
        "sources": [{"title": "Hugging Face · 소형 언어 모델 (예시)", "url": "https://huggingface.co"}],
    },
    {
        "id": "world-model", "name": "World Model", "change_pct": -4, "weeks": [28, 27, 26, 25],
        "summary": "세상의 모델을 만들고 행동하기 전에 미리 상상해 보는 기술이에요.",
        "related_experiment_id": "008",
        "sources": [{"title": "arXiv · 월드 모델 (예시)", "url": "https://arxiv.org"}],
    },
]

RADAR_BY_ID = {k["id"]: k for k in RADAR_KEYWORDS}

# Hero Carousel 슬라이드 000~004
CAROUSEL = [
    {"code": "#000", "title": "302개 뉴런으로 꿈틀꿈틀", "body": "전체 신경 연결이 처음 밝혀진 가장 작은 뇌. 5분이면 \"신경망이 뭔지\" 감이 와요.", "character": "wormy", "cta": "지금 실험하기 →", "target": "/experiments/000"},
    {"code": "#001", "title": "나만의 초파리 키우기", "body": "초파리 뇌 커넥톰으로 움직이는 드로시를 훈련시켜, 1회차의 엉뚱함이 100회차의 능숙함으로 바뀌는 걸 지켜보세요.", "character": "drosi", "cta": "지금 실험하기 →", "target": "/experiments/001"},
    {"code": "#002", "title": "RAG 탐정", "body": "AI가 어떤 문단을 몇 점의 유사도로 찾아서 답했는지 하나하나 펼쳐 봐요.", "character": "owl", "cta": "오픈 알림 받기", "target": "/experiments/002"},
    {"code": "#003", "title": "도구 쓰는 문어", "body": "AI가 언제, 왜, 어떤 도구(API)를 불러 쓰는지 단계별로 관찰해요.", "character": "octo", "cta": "오픈 알림 받기", "target": "/experiments/003"},
    {"code": "#004", "title": "Multi-Agent 회의실", "body": "역할을 나눈 에이전트들이 주고받는 메시지를 엿보며 협업의 원리를 배워요.", "character": "ants", "cta": "오픈 알림 받기", "target": "/experiments/004"},
]

# D-09 다음 실험 투표 (1,284명 참여 · 일요일 23:59 마감)
VOTE = {
    "id": "vote-2026-w42",
    "title": "다음에 열릴 실험을 골라 주세요",
    "options": [
        {"id": "003", "title": "#003 도구 쓰는 문어", "votes": 539},
        {"id": "005", "title": "#005 기억하는 코끼리", "votes": 398},
        {"id": "008", "title": "#008 머릿속 지도 생쥐", "votes": 347},
    ],
    "ends_at": "2026-10-18T23:59:00+09:00",
}

# D-10 오픈 예정 실험
TECH_DROPS = {
    "002": {
        "code": "002", "title": "RAG 탐정 — AI는 이 답을 어디서 찾아왔을까?",
        "body": "질문을 던지면, AI가 어떤 문단을 몇 점의 유사도로 찾아 답변에 썼는지 하나하나 펼쳐 봐요. 사서 부엉이와 함께 \"근거 있는 답\"의 원리를 배워요.",
        "open_at": "2026-10-31T10:00:00+09:00", "character": "owl", "subscribed": True,
    },
    "003": {
        "code": "003", "title": "도구 쓰는 문어",
        "body": "AI가 언제, 왜, 어떤 도구(API)를 불러 쓰는지 단계별로 관찰해요.",
        "open_at": "2026-11-16T10:00:00+09:00", "character": "octo", "subscribed": True,
    },
    "004": {
        "code": "004", "title": "Multi-Agent 회의실",
        "body": "역할을 나눈 에이전트들이 주고받는 메시지를 엿보며 협업의 원리를 배워요.",
        "open_at": "2026-12-01T10:00:00+09:00", "character": "ants", "subscribed": False,
    },
}

# B-13 팀 미션 "드로시의 생일 파티"
TEAM_MISSION = {
    "id": "t1",
    "title": "드로시의 생일 파티를 준비해 줘!",
    "members": [
        {"character": "parrot", "role": "리더 · 대화", "level": 1},
        {"character": "owl", "role": "조사 · 검색", "level": 1},
        {"character": "octo", "role": "실행 · 도구", "level": 1},
        {"character": "memo", "role": "기억", "level": 1},
    ],
    "goal": "마스터한 친구들이 각자 하나의 에이전트가 되어 드로시의 생일 파티 계획을 세워요.",
    "messages": [
        {"from": "parrot", "text": "파티 계획을 세울게! 부엉, 초파리가 좋아하는 음식 좀 찾아줘.", "at": 0.0},
        {"from": "owl", "text": "자료 3개를 찾았어. 잘 익은 과일, 특히 바나나를 좋아한대. (유사도 0.88)", "at": 3.2},
        {"from": "octo", "text": "토요일 날씨 확인 완료 — 맑음! 장보기 목록도 만들어 뒀어.", "at": 7.5},
        {"from": "memo", "text": "작년 파티 때 드로시가 장애물에 부딪혔던 거 기억나? 이번엔 넓은 공원으로 하자.", "at": 10.8},
        {"from": "parrot", "text": "좋아, 최종 계획 정리 완료! 확인해 줄래?", "at": 14.0},
    ],
    "status": "ready",
}

TEAM_RESULT = {
    "summary": "토요일 · 넓은 공원에서 잘 익은 바나나로 파티를 열어요. 메시지 8 · 도구 호출 2 · 검색 1.",
    "contributions": [
        {"character": "parrot", "text": "계획을 세우고 역할을 나눴어요."},
        {"character": "owl", "text": "잘 익은 바나나 (검색 · 유사도 0.88)"},
        {"character": "octo", "text": "토요일 날씨 확인 · 장보기 목록 완료"},
        {"character": "memo", "text": "토요일 · 넓은 공원 (작년 기억)"},
    ],
}
