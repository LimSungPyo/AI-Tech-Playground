"""알림·문의 샘플. 값은 Figma D-01, G-07, G-08 화면과 같다."""

NOTIFICATIONS = [
    {"id": "n-005", "kind": "experiment", "title": "미션 2 · 장애물 피하기가 열렸어요!", "body": "성공률 60%를 넘겼어요. 브리핑부터 시작해 보세요.", "created_at": "2026-10-17T13:00:00+09:00", "read": False, "target": "/experiments/001/missions/m2/briefing"},
    {"id": "n-004", "kind": "team", "title": '웜이: "어제 드로시 52% → 58%!"', "body": "오늘의 추천을 확인해 보세요.", "created_at": "2026-10-16T14:01:00+09:00", "read": False, "target": "/"},
    {"id": "n-003", "kind": "badge", "title": "배지 획득 · WHY? 탐구자", "body": "WHY?를 20번 열어봤어요.", "created_at": "2026-10-14T19:30:00+09:00", "read": True, "target": "/my/badges"},
    {"id": "n-002", "kind": "experiment", "title": "Tech Drop #002 · D-14", "body": "오픈 알림 신청이 완료됐어요.", "created_at": "2026-10-13T10:00:00+09:00", "read": True, "target": "/experiments/002"},
    {"id": "n-001", "kind": "system", "title": "주간 리포트가 도착했어요", "body": "10.06 – 10.12 · 학습 1h 18m", "created_at": "2026-10-13T09:00:00+09:00", "read": True, "target": "/my/history"},
]

INQUIRIES = [
    {
        "id": "T-2058", "category": "WHY? · 설명이 이상해요", "title": "STEP 37 WHY? 설명이 실제 움직임과 달라요",
        "body": "WHY?에서는 오른쪽 위로 갔다고 하는데, 리플레이로 보면 마지막에 왼쪽으로 꺾어요. 설명이 틀린 건지 궁금해요.",
        "status": "answered", "created_at": "2026-10-18T10:30:00+09:00",
        "answer": "제보 고마워요! 확인해 보니 드로시가 장애물을 피하려고 마지막에 방향을 바꾼 \"보정\" 단계가 WHY? 설명에 빠져 있었어요. 다음 업데이트에서 설명에 추가할게요.",
    },
    {
        "id": "T-2061", "category": "버그 · 오류", "title": "모바일에서 그래프가 잘려요",
        "body": "휴대폰으로 성장 리포트를 보면 학습 곡선 오른쪽이 잘려 보여요.",
        "status": "received", "created_at": "2026-10-18T15:20:00+09:00",
    },
    {
        "id": "T-2041", "category": "계정 · 기록", "title": "탈퇴 신청을 취소하고 싶어요",
        "body": "실수로 탈퇴를 신청했어요. 기록을 되살릴 수 있나요?",
        "status": "answered", "created_at": "2026-10-17T09:10:00+09:00",
        "answer": "가입 이메일로 본인 확인을 마치고 계정을 복구했어요. 실험 기록 · 캐릭터 · 도감 · 배지가 그대로 돌아왔어요.",
    },
]

NEW_INQUIRY_ID = "T-2062"
