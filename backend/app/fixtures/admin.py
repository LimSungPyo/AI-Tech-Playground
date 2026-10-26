"""관리자 콘솔 샘플. 값은 Figma F-02~F-13 화면과 같다."""

DASHBOARD = {
    "kpis": [
        {"label": "DAU", "value": "1,284", "delta": "+8.2%"},
        {"label": "신규 가입", "value": "92", "delta": "+12%"},
        {"label": "게스트 → 회원", "value": "18.4%", "delta": "+1.6%p"},
        {"label": "첫 실험 완료율", "value": "71%", "delta": "-2.1%p"},
        {"label": "평균 성공률 향상", "value": "+46%p", "delta": "1회차 → 마지막"},
        {"label": "WHY? 열람률", "value": "63%", "delta": "+5%p"},
    ],
    "alerts": [
        {"level": "warning", "text": "레이더 키워드 검수 대기 12"},
        {"level": "info", "text": "기술 카드 초안 검토 3"},
        {"level": "warning", "text": "문의 미답변 5"},
        {"level": "danger", "text": "신고 접수 1"},
        {"level": "info", "text": "투표 마감 D-1 · 1,284명"},
    ],
    "signups": [
        {"date": "2026-10-12", "count": 71},
        {"date": "2026-10-13", "count": 84},
        {"date": "2026-10-14", "count": 78},
        {"date": "2026-10-15", "count": 88},
        {"date": "2026-10-16", "count": 81},
        {"date": "2026-10-17", "count": 92},
        {"date": "2026-10-18", "count": 64},
    ],
}

# F-03 기술 레이더 검수 (점수 = 증가율 × 출처 다양성 × 최신성)
RADAR_CANDIDATES = [
    {"id": "rc-tool-calling", "keyword": "Tool Calling", "source": "논문 18 · 코드 31 · 커뮤 44", "score": 0.94, "status": "pending"},
    {"id": "rc-function-calling", "keyword": "Function Calling", "source": "논문 6 · 코드 12", "score": 0.71, "status": "pending"},
    {"id": "rc-agent-memory", "keyword": "Agent Memory", "source": "논문 14 · 코드 9 · 커뮤 21", "score": 0.88, "status": "pending"},
    {"id": "rc-connectome", "keyword": "Connectome", "source": "논문 22 · 커뮤 8", "score": 0.79, "status": "approved"},
    {"id": "rc-agi-soon", "keyword": "AGI 곧 온다", "source": "커뮤 52", "score": 0.32, "status": "rejected"},
    {"id": "rc-small-lm", "keyword": "Small LM", "source": "논문 9 · 코드 17", "score": 0.66, "status": "pending"},
]

# F-05 실험 모듈 파이프라인
MODULES = [
    {"id": "008", "code": "#008", "title": "머릿속 지도 생쥐", "stage": "idea", "owner": "이서연", "updated_at": "2026-10-16T11:00:00+09:00"},
    {"id": "005", "code": "#005", "title": "기억하는 코끼리", "stage": "idea", "owner": "이서연", "updated_at": "2026-10-17T09:30:00+09:00"},
    {"id": "003", "code": "#003", "title": "도구 쓰는 문어", "stage": "build", "owner": "김도윤", "updated_at": "2026-10-17T16:40:00+09:00"},
    {"id": "004", "code": "#004", "title": "에이전트 회의실", "stage": "design", "owner": "이서연", "updated_at": "2026-10-15T14:00:00+09:00"},
    {"id": "002", "code": "#002", "title": "RAG 탐정", "stage": "qa", "owner": "전혜원", "updated_at": "2026-10-17T15:12:00+09:00"},
    {"id": "001", "code": "#001", "title": "나만의 초파리", "stage": "live", "owner": "전혜원", "updated_at": "2026-10-01T10:00:00+09:00"},
    {"id": "000", "code": "#000", "title": "302개 뉴런", "stage": "live", "owner": "김도윤", "updated_at": "2026-10-01T10:00:00+09:00"},
    {"id": "007", "code": "#007", "title": "다음 단어", "stage": "live", "owner": "이서연", "updated_at": "2026-10-01T10:00:00+09:00"},
    {"id": "006", "code": "#006", "title": "히트맵", "stage": "live", "owner": "김도윤", "updated_at": "2026-10-01T10:00:00+09:00"},
]

# F-08 사용자 관리 (마스킹된 이메일)
USERS = [
    {"id": "u_hyewon", "nickname": "혜원", "email": "hy***@gmail.com", "status": "withdrawing", "joined_at": "2026-10-01", "last_seen_at": "2026-10-17T21:40:00+09:00"},
    {"id": "u_1203", "nickname": "flylab_kim", "email": "fl***@naver.com", "status": "active", "joined_at": "2026-09-12", "last_seen_at": "2026-10-18T09:12:00+09:00"},
    {"id": "u_8812", "nickname": "neuron_j", "email": "ne***@gmail.com", "status": "suspended", "joined_at": "2026-09-30", "last_seen_at": "2026-10-18T08:30:00+09:00"},
    {"id": "u_0457", "nickname": "buzzbuzz", "email": "bu***@kakao.com", "status": "dormant", "joined_at": "2026-08-21", "last_seen_at": "2026-10-02T19:00:00+09:00"},
    {"id": "u_7720", "nickname": "tiny_brain", "email": "ti***@gmail.com", "status": "active", "joined_at": "2026-10-05", "last_seen_at": "2026-10-17T22:10:00+09:00"},
    {"id": "u_9012", "nickname": "guest→u_9012", "email": "—", "status": "active", "joined_at": "2026-10-18", "last_seen_at": "2026-10-18T10:41:00+09:00"},
]

# F-10 문의 · 신고
INQUIRY_ITEMS = [
    {"id": "T-2058", "kind": "inquiry", "title": "WHY? 설명이 실제 움직임과 달라요", "user": "tiny_brain", "status": "우선순위 높음", "created_at": "2026-10-18T10:30:00+09:00"},
    {"id": "T-2057", "kind": "inquiry", "title": "게스트 기록이 안 옮겨졌어요", "user": "buzzbuzz", "status": "우선순위 높음", "created_at": "2026-10-18T10:02:00+09:00"},
    {"id": "T-2055", "kind": "inquiry", "title": "오픈 알림을 끄고 싶어요", "user": "flylab_kim", "status": "우선순위 보통", "created_at": "2026-10-18T08:42:00+09:00"},
    {"id": "R-0031", "kind": "report", "title": "랭킹 닉네임 신고", "user": "neuron_j", "status": "우선순위 높음", "created_at": "2026-10-18T07:40:00+09:00"},
    {"id": "T-2052", "kind": "inquiry", "title": "모바일에서 그래프가 잘려요", "user": "혜원", "status": "우선순위 보통", "created_at": "2026-10-17T15:20:00+09:00"},
]

# F-11 데이터 분석 (최근 30일)
ANALYTICS = {
    "funnel": [
        {"step": "홈 방문", "count": 10000},
        {"step": "게스트 체험 시작", "count": 4100},
        {"step": "회원가입", "count": 1020},
        {"step": "온보딩 완료", "count": 890},
        {"step": "첫 실험 완료", "count": 720},
        {"step": "첫 성공", "count": 610},
        {"step": "캐릭터 마스터", "count": 210},
    ],
    "retention": [
        {"week": "W1", "rate": 100},
        {"week": "W2", "rate": 54},
        {"week": "W3", "rate": 41},
        {"week": "W4", "rate": 35},
    ],
    "experiments": [
        {"code": "#001", "plays": 3120, "clear_rate": 68},
        {"code": "#000", "plays": 2110, "clear_rate": 88},
        {"code": "#007", "plays": 1480, "clear_rate": 61},
        {"code": "#006", "plays": 1210, "clear_rate": 74},
    ],
}

# F-13 권한 · 감사 로그
ADMINS = [
    {"id": "a_hyewon", "name": "전혜원", "role": "슈퍼관리자"},
    {"id": "a_seoyeon", "name": "이서연", "role": "콘텐츠 에디터"},
    {"id": "a_doyun", "name": "김도윤", "role": "CS 담당"},
]

AUDIT_LOGS = [
    {"at": "2026-10-18T10:42:00+09:00", "admin": "이서연", "action": "키워드 병합: Function Calling → Tool Calling", "target": "Tool Calling", "ip": "10.0.12.31"},
    {"at": "2026-10-18T10:20:00+09:00", "admin": "김도윤", "action": "개인정보 원본 열람", "target": "u_8812", "ip": "10.0.12.48"},
    {"at": "2026-10-18T09:58:00+09:00", "admin": "김도윤", "action": "잠금 해제 (2차 인증)", "target": "u_8812", "ip": "10.0.12.48"},
    {"at": "2026-10-17T18:00:00+09:00", "admin": "system", "action": "레이더 공개", "target": "10.13 주", "ip": "127.0.0.1"},
    {"at": "2026-10-17T15:12:00+09:00", "admin": "전혜원", "action": "#002 공개 예약", "target": "10.31 10:00", "ip": "10.0.12.7"},
]
