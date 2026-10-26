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
            {"title": "FlyWire Consortium — Whole-brain connectome of the adult Drosophila", "url": "https://flywire.ai", "kind": "paper"},
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
        "sources": [{"title": "OpenWorm", "url": "https://openworm.org", "kind": "code"}],
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
        "sources": [{"title": "Attention Is All You Need", "url": "https://arxiv.org/abs/1706.03762", "kind": "paper"}],
        "unlocked": False,
        "reveal": {"headline": "사실, 패롯은 확률표를 보고 말하고 있었어요", "body": "다음 단어 예측의 원리와 한계를 함께 봐요."},
    },
]


def _locked_card(card_id: str, exp_id: str, title: str, research: str, mechanism: str, headline: str, sources: list[dict]) -> dict:
    """v2 · 아직 잠긴 실험의 카드. 내용은 짧게 채우고 unlocked:false로 준다(H-10 모음에 9장 모두 보이게)."""
    return {
        "id": card_id,
        "title": title,
        "experiment_id": exp_id,
        "steps": [
            {"kind": "research", "title": research, "body": "이 실험이 열리면 원본 연구를 자세히 소개해요."},
            {"kind": "mechanism", "title": mechanism, "body": "어떤 원리를 가져왔는지 단계별로 보여 줄 예정이에요."},
            {"kind": "simplification", "title": "체험용 단순화", "body": "직접 해 볼 수 있게 줄인 부분을 정직하게 적어 둘게요."},
            {"kind": "implementation", "title": "게임 안 구현", "body": "실험 화면의 어떤 요소가 원리와 연결되는지 보여 줄 예정이에요."},
        ],
        "biological_vs_designed": {"biological": [], "designed": []},
        "sources": sources,
        "unlocked": False,
        "reveal": {"headline": headline, "body": "실험을 끝내면 반전과 원리를 함께 볼 수 있어요."},
        "status": "draft",
    }


# v2 · 9장(card-000 ~ card-008). #003 Tool Calling 카드는 관리자 F-04 편집기 예시라 내용을 다 채운다
CARDS += [
    _locked_card(
        "card-002", "002", "RAG는 어떻게 근거를 찾을까?", "검색 증강 생성(RAG)", "임베딩 유사도 검색",
        "사실, 부엉이는 도서관에서 근거 문단을 찾아와 답하고 있었어요",
        [{"title": "Retrieval-Augmented Generation (Lewis et al., 2020)", "url": "https://arxiv.org/abs/2005.11401", "kind": "paper"}],
    ),
    {
        "id": "card-003",
        "title": "AI는 언제 도구를 부를까?",
        "experiment_id": "003",
        "steps": [
            {"kind": "research", "title": "도구 사용 언어 모델", "body": "언어 모델이 계산기 · 검색 · 날씨 같은 외부 API를 스스로 골라 부르도록 학습한 연구."},
            {"kind": "mechanism", "title": "함수 설명 → 호출 결정 → 결과 반영", "body": "도구 목록과 설명을 보고, 지금 필요한 도구와 인자를 정해 부른 뒤 결과를 답에 섞어요."},
            {"kind": "simplification", "title": "도구 5개 · 정해진 응답", "body": "실제 API 대신 미리 준비한 응답을 돌려주는 도구 5개로 줄였어요."},
            {"kind": "implementation", "title": "옥토의 다리 = 도구", "body": "옥토가 다리를 뻗는 순간이 도구 호출이에요. 왜 그 도구를 골랐는지 WHY?로 볼 수 있어요."},
        ],
        "biological_vs_designed": {
            "biological": ["문어 다리가 따로 판단하는 분산 신경계(비유)"],
            "designed": ["도구 목록과 설명", "호출 결정 규칙", "가짜 API 응답", "호출 기록 시각화"],
        },
        "sources": [
            {"title": "Toolformer: Language Models Can Teach Themselves to Use Tools", "url": "https://arxiv.org/abs/2302.04761", "kind": "paper"},
            {"title": "GitHub · tool-calling 오픈소스 (예시)", "url": "https://github.com", "kind": "code"},
        ],
        "unlocked": False,
        "reveal": {"headline": "사실, 옥토는 다리마다 다른 API를 쥐고 있었어요", "body": "AI가 언제, 왜, 어떤 도구를 부르는지 단계별로 확인하세요."},
        "status": "review",
    },
    _locked_card(
        "card-004", "004", "에이전트들은 어떻게 협업할까?", "멀티 에이전트 시스템", "역할 분담과 메시지 교환",
        "사실, 앤티 팀은 각자 다른 역할의 에이전트였어요",
        [{"title": "Generative Agents (Park et al., 2023)", "url": "https://arxiv.org/abs/2304.03442", "kind": "paper"}],
    ),
    _locked_card(
        "card-005", "005", "에이전트는 무엇을 기억할까?", "에이전트 장기 기억", "기억 저장 · 검색 · 요약",
        "사실, 메모는 대화를 공책에 적어 두고 있었어요",
        [{"title": "MemGPT (Packer et al., 2023)", "url": "https://arxiv.org/abs/2310.08560", "kind": "paper"}],
    ),
    {
        **_locked_card(
            "card-006", "006", "AI는 그림의 어디를 볼까?", "합성곱 신경망과 주목 영역", "Grad-CAM 히트맵",
            "사실, 매눈이는 그림에서 가장 중요한 곳을 칠하고 있었어요",
            [{"title": "Grad-CAM (Selvaraju et al., 2017)", "url": "https://arxiv.org/abs/1610.02391", "kind": "paper"}],
        ),
        "unlocked": True,
        "status": "published",
    },
    _locked_card(
        "card-008", "008", "머릿속 지도는 어떻게 그릴까?", "월드 모델", "미리 상상하는 계획",
        "사실, 맵피는 움직이기 전에 머릿속에서 먼저 달려 보고 있었어요",
        [{"title": "World Models (Ha & Schmidhuber, 2018)", "url": "https://arxiv.org/abs/1803.10122", "kind": "paper"}],
    ),
]
for _card in CARDS:
    _card.setdefault("status", "published" if _card["unlocked"] else "approved")
CARDS.sort(key=lambda c: c["id"])

CARDS_BY_ID = {c["id"]: c for c in CARDS}

# v2 · F-04 관리자 카드 목록
ADMIN_CARD_META = {
    "card-000": {"author": "김도윤", "updated_at": "2026-10-01T10:00:00+09:00"},
    "card-001": {"author": "전혜원", "updated_at": "2026-10-01T10:00:00+09:00"},
    "card-002": {"author": "전혜원", "updated_at": "2026-10-16T18:20:00+09:00"},
    "card-003": {"author": "이서연", "updated_at": "2026-10-17T16:40:00+09:00"},
    "card-004": {"author": "이서연", "updated_at": "2026-10-15T14:00:00+09:00"},
    "card-005": {"author": "이서연", "updated_at": "2026-10-12T11:00:00+09:00"},
    "card-006": {"author": "김도윤", "updated_at": "2026-10-01T10:00:00+09:00"},
    "card-007": {"author": "이서연", "updated_at": "2026-10-01T10:00:00+09:00"},
    "card-008": {"author": "이서연", "updated_at": "2026-10-10T09:00:00+09:00"},
}

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

# v2 · 노드마다 연결된 실험 여러 개 · 숙련도(도감 레벨 0~3)
TREE_EXTRA = {
    "node-llm": {"experiment_ids": ["007"], "mastery": {"level": 1, "max": 3, "hint": "패롯 Lv2까지 성공률 60% (현재 21%)"}},
    "node-vision": {"experiment_ids": ["006"], "mastery": {"level": 0, "max": 3, "hint": "매눈이를 만나면 숙련도가 올라가요"}},
    "node-rl": {"experiment_ids": ["001", "000"], "mastery": {"level": 3, "max": 3, "hint": "드로시 · 웜이 마스터 완료"}},
    "node-rag": {"experiment_ids": ["002"], "mastery": {"level": 0, "max": 3, "hint": "#002 오픈 후 시작할 수 있어요"}},
    "node-agent": {"experiment_ids": ["003", "004"], "mastery": {"level": 0, "max": 3, "hint": "#003 투표 중 · #004 준비 중"}},
    "node-world-model": {"experiment_ids": ["008"], "mastery": {"level": 0, "max": 3, "hint": "비전 + 강화학습 완료 시 열려요"}},
    "node-brain": {"experiment_ids": ["001"], "mastery": {"level": 2, "max": 3, "hint": "미션 2 · 장애물 피하기를 깨면 Lv3"}},
}
for _node in TREE_NODES:
    _node.update(TREE_EXTRA[_node["id"]])

# B-02 · D-07 · D-08 기술 레이더 (2026.10.13 주)
RADAR_WEEK = "2026-10-13"
RADAR_UPDATED_AT = "2026-10-13T09:00:00+09:00"

RADAR_KEYWORDS = [
    {
        "id": "tool-calling", "name": "Tool Calling", "change_pct": 42, "weeks": [61, 74, 98, 139],
        "summary": "AI가 혼자 답하지 않고, 날씨 · 계산기 · 검색 같은 \"도구(API)\"를 골라 불러서 일을 해결하는 기술이에요.",
        "related_experiment_id": "003",
        "sources": [
            {"title": "arXiv · 도구 사용 에이전트 벤치마크 (예시)", "url": "https://arxiv.org", "kind": "paper"},
            {"title": "GitHub · tool-calling 오픈소스 (예시)", "url": "https://github.com", "kind": "code"},
            {"title": "Hacker News · 토론 스레드 (예시)", "url": "https://news.ycombinator.com", "kind": "community"},
        ],
    },
    {
        "id": "agent-memory", "name": "Agent Memory", "change_pct": 31, "weeks": [40, 46, 55, 72],
        "summary": "에이전트가 대화와 경험을 기억해 두었다가 다음 행동에 활용하는 기술이에요.",
        "related_experiment_id": "005",
        "sources": [{"title": "arXiv · 에이전트 장기 기억 (예시)", "url": "https://arxiv.org", "kind": "paper"}],
    },
    {
        "id": "connectome", "name": "Connectome", "change_pct": 18, "weeks": [30, 33, 38, 45],
        "summary": "뇌의 뉴런과 시냅스 연결 전체를 지도로 그린 것. 드로시가 이 지도를 단순화한 모델로 움직여요.",
        "related_experiment_id": "001",
        "sources": [{"title": "FlyWire Consortium", "url": "https://flywire.ai", "kind": "paper"}],
    },
    {
        "id": "small-lm", "name": "Small LM", "change_pct": 12, "weeks": [25, 27, 29, 32],
        "summary": "작은 크기로도 쓸 만한 성능을 내는 언어 모델이에요.",
        "sources": [{"title": "Hugging Face · 소형 언어 모델 (예시)", "url": "https://huggingface.co", "kind": "code"}],
    },
    {
        "id": "world-model", "name": "World Model", "change_pct": -4, "weeks": [28, 27, 26, 25],
        "summary": "세상의 모델을 만들고 행동하기 전에 미리 상상해 보는 기술이에요.",
        "related_experiment_id": "008",
        "sources": [{"title": "arXiv · 월드 모델 (예시)", "url": "https://arxiv.org", "kind": "paper"}],
    },
]

RADAR_BY_ID = {k["id"]: k for k in RADAR_KEYWORDS}

# v2 · D-07 수집 규모 · AI 해설 · 지난 주 조회
RADAR_SOURCE_COUNT = 12
RADAR_POST_COUNT = 3412
RADAR_COMMENTARY = (
    "이번 주는 Tool Calling과 Agent Memory가 함께 뛰었어요. AI가 혼자 답하지 않고 도구를 부르고, "
    "그 경험을 기억해 다음 행동에 쓰는 \"에이전트\" 흐름이 커지고 있다는 신호예요. "
    "#003 도구 쓰는 문어 투표에 참여하면 이 흐름을 직접 실험해 볼 수 있어요."
)
RADAR_WEEKS = ["2026-10-13", "2026-10-06", "2026-09-29"]
# 지난 주 스냅샷: 같은 키워드의 그 주 추이(앞 4칸)로 만든다
RADAR_PAST = {
    "2026-10-06": {"updated_at": "2026-10-06T09:00:00+09:00", "source_count": 12, "post_count": 3127,
                   "commentary": "Tool Calling 언급이 3주째 늘고 있어요. 코드 저장소 쪽 증가가 특히 커요."},
    "2026-09-29": {"updated_at": "2026-09-29T09:00:00+09:00", "source_count": 11, "post_count": 2980,
                   "commentary": "Connectome 관련 논문이 몰린 주예요. 초파리 전체 뇌 지도 후속 연구가 소개됐어요."},
}

# Hero Carousel 슬라이드 000~004
# v2 · 슬라이드 배지 · 난이도 · 시간 · 태그 · 말풍선
CAROUSEL_EXTRA = {
    "#000": {"badge": "NOW OPEN", "level": "intro", "duration_min": 5, "tags": ["신경망 기초"], "bubble": "뉴런 302개"},
    "#001": {"badge": "FEATURED", "level": "frontier", "duration_min": 10, "tags": ["강화학습", "커넥톰"], "bubble": "12% → 86%"},
    "#002": {"badge": "COMING SOON", "level": "advanced", "duration_min": 8, "tags": ["RAG", "임베딩"], "bubble": "D-14"},
    "#003": {"badge": "COMING SOON", "level": "advanced", "duration_min": 8, "tags": ["Tool Calling"], "bubble": "투표 42%"},
    "#004": {"badge": "COMING SOON", "level": "advanced", "duration_min": 12, "tags": ["Multi-Agent"], "bubble": "에이전트 노드 해금 시"},
}

CAROUSEL = [
    {"code": "#000", "title": "302개 뉴런으로 꿈틀꿈틀", "body": "전체 신경 연결이 처음 밝혀진 가장 작은 뇌. 5분이면 \"신경망이 뭔지\" 감이 와요.", "character": "wormy", "cta": "지금 실험하기 →", "target": "/experiments/000"},
    {"code": "#001", "title": "나만의 초파리 키우기", "body": "초파리 뇌 커넥톰으로 움직이는 드로시를 훈련시켜, 1회차의 엉뚱함이 100회차의 능숙함으로 바뀌는 걸 지켜보세요.", "character": "drosi", "cta": "지금 실험하기 →", "target": "/experiments/001"},
    {"code": "#002", "title": "RAG 탐정", "body": "AI가 어떤 문단을 몇 점의 유사도로 찾아서 답했는지 하나하나 펼쳐 봐요.", "character": "owl", "cta": "오픈 알림 받기", "target": "/experiments/002"},
    {"code": "#003", "title": "도구 쓰는 문어", "body": "AI가 언제, 왜, 어떤 도구(API)를 불러 쓰는지 단계별로 관찰해요.", "character": "octo", "cta": "오픈 알림 받기", "target": "/experiments/003"},
    {"code": "#004", "title": "Multi-Agent 회의실", "body": "역할을 나눈 에이전트들이 주고받는 메시지를 엿보며 협업의 원리를 배워요.", "character": "ants", "cta": "오픈 알림 받기", "target": "/experiments/004"},
]

for _slide in CAROUSEL:
    _slide.update(CAROUSEL_EXTRA[_slide["code"]])

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

# v2 · D-10 이 실험에서 배워요 · 시작 조건
TECH_DROP_EXTRA = {
    "002": {
        "learn": [
            {"title": "검색", "body": "질문과 가까운 문단을 임베딩 유사도로 찾아요"},
            {"title": "근거", "body": "답변의 문장마다 어느 문단에서 왔는지 인용 번호로 연결"},
            {"title": "검증", "body": "왜 4번 문단은 안 썼는지 — 유사도 기준선과 한계"},
        ],
        "conditions": [
            {"label": "LLM 노드 완료 (#007)", "done": False},
            {"label": "기초 노드 1개 이상", "done": True},
            {"label": "로그인", "done": True},
        ],
        "condition_hint": "#007 패롯 실험을 끝내면 오픈 당일 바로 시작할 수 있어요.",
    },
    "003": {
        "learn": [
            {"title": "도구 고르기", "body": "질문을 보고 어떤 도구(API)가 필요한지 정해요"},
            {"title": "호출", "body": "도구에 넘길 값을 만들고 결과를 받아요"},
            {"title": "답 합치기", "body": "도구 결과를 섞어 최종 답을 만들어요"},
        ],
        "conditions": [
            {"label": "투표에서 1위", "done": False},
            {"label": "LLM 노드 완료 (#007)", "done": False},
            {"label": "로그인", "done": True},
        ],
        "condition_hint": "투표가 끝나면 오픈 일정이 확정돼요.",
    },
    "004": {
        "learn": [
            {"title": "역할 나누기", "body": "계획 · 조사 · 실행 에이전트로 일을 나눠요"},
            {"title": "메시지", "body": "에이전트들이 주고받는 메시지를 엿봐요"},
            {"title": "합의", "body": "의견이 다를 때 어떻게 결론을 내는지 봐요"},
        ],
        "conditions": [
            {"label": "에이전트 노드 해금", "done": False},
            {"label": "로그인", "done": True},
        ],
        "condition_hint": "기술 트리에서 에이전트 노드를 해금하면 열려요.",
    },
}
for _code, _drop in TECH_DROPS.items():
    _drop.update(TECH_DROP_EXTRA[_code])

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
        {"from": "parrot", "text": "파티 계획을 세울게! 부엉, 초파리가 좋아하는 음식 좀 찾아줘.", "at": 0.0,
         "event": {"kind": "assign", "text": "assign · 부엉 → 음식 조사"}},
        {"from": "owl", "text": "자료 3개를 찾았어. 잘 익은 과일, 특히 바나나를 좋아한대. (유사도 0.88)", "at": 3.2,
         "event": {"kind": "retrieve", "text": "retrieve · 문서 3개 · 최고 유사도 0.88"}},
        {"from": "octo", "text": "토요일 날씨 확인 완료 — 맑음! 장보기 목록도 만들어 뒀어.", "at": 7.5,
         "event": {"kind": "tool_call", "text": "tool_call · weather(토요일) · shopping_list()"}},
        {"from": "memo", "text": "작년 파티 때 드로시가 장애물에 부딪혔던 거 기억나? 이번엔 넓은 공원으로 하자.", "at": 10.8,
         "event": {"kind": "memory", "text": "memory · 작년 파티 기록 1건"}},
        {"from": "parrot", "text": "좋아, 최종 계획 정리 완료! 확인해 줄래?", "at": 14.0},
    ],
    "status": "ready",
}

TEAM_RESULT = {
    "metrics": {"messages": 8, "tool_calls": 2, "searches": 1},
    "summary": "토요일 · 넓은 공원에서 잘 익은 바나나로 파티를 열어요. 메시지 8 · 도구 호출 2 · 검색 1.",
    "contributions": [
        {"character": "parrot", "text": "계획을 세우고 역할을 나눴어요."},
        {"character": "owl", "text": "잘 익은 바나나 (검색 · 유사도 0.88)"},
        {"character": "octo", "text": "토요일 날씨 확인 · 장보기 목록 완료"},
        {"character": "memo", "text": "토요일 · 넓은 공원 (작년 기억)"},
    ],
}
