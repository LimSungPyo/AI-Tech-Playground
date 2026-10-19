# AI_Tech_Playground

> AI 기술을 **게임처럼 직접 실험해 보며** 배우는 인터랙티브 플랫폼
> 

AI 기술을 글로 읽기만 하지 않고, 직접 훈련하고 결과를 확인하며 배웁니다. 
결과를 보다가 궁금하면 **WHY?** 로 "AI가 왜 그렇게 판단했는지" 물어볼 수 있습니다. 실험은 강화학습 · 언어 모델 · 비전 · RAG · 에이전트 등 다양한 주제를 다룹니다.

---

## **핵심 기능**

- **실험 플레이**: 1회 실행, ×10 훈련을 하며 회차별 성공률과 결과를 시각화
- **WHY? 설명**: AI의 판단 근거를 사용자 수준(입문 / 중급 / 고급)에 맞춰 설명
- **예측하기**: 실험 전에 결과를 예측하고 실제 결과와 비교
- **기술 트리 · 기술 카드**: 실험을 완료하면 다음 기술 노드와 기술 카드가 해금
- **실험 추천**: 관심사 · 수준 · 플레이 기록을 바탕으로 다음 실험 추천
- **랭킹 · 공유**: 실험별 랭킹, 결과 공유 이미지 및 링크
- **기술 레이더**: 매주 월요일 기술 트렌드를 수집해 키워드 제공
- **관리자 콘솔**: 실험 · 사용자 · 문의/신고 · 레이더 운영 (별도 URL + 재인증)

---

## **사용자 흐름**

```
비회원   홈 → 게스트 체험 → 가입 유도
첫 로그인 가입 → 온보딩(관심사 · 수준) → 실험 추천 → 첫 실험
메인     홈 → 실험실 → 실험 상세 → 예측 → 플레이 ⇄ WHY? → 결과 리포트 → 기술 카드 / 기술 트리
마이     대시보드 · 내 실험 · 학습 기록 · 설정 · 알림 · 문의
관리자   관리자 URL 또는 프로필 메뉴 → 재인증(OTP + IP 확인) → 관리자 콘솔
```

---

## **기술 스택**

| **영역** | **기술** |
| --- | --- |
| Frontend | React + Vite |
| Backend | FastAPI |
| DB | PostgreSQL 16 |

---

## **폴더 구조**

```
ai-tech-playground/
├── frontend/        # React + Vite
│   └── src/
│       ├── pages/
│       ├── components/
│       └── api/
├── backend/         # FastAPI
│   └── app/
│       ├── api/
│       ├── models/
│       ├── schemas/
│       └── services/
└── README.md
```

---

## **시작하기**

### **1. DB**

```
createdb ai_playground
```

### **2. Backend**

```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API 문서: http://localhost:8000/docs

### **3. Frontend**

```
cd frontend
npm install
npm run dev
```

웹: http://localhost:5173

### **환경 변수**

backend/.env

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/ai_playground
JWT_SECRET=<랜덤 문자열>
```

frontend/.env

```
VITE_API_BASE_URL=http://localhost:8000
```