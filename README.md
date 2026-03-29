# AI Travel Guide

LangChain + RAG 기반 대화형 AI 여행 가이드 서비스

**라이브 데모**: https://jhwwon.github.io/ai-travel-guide

---

## 주요 기능

- **대화형 AI 여행 상담** — 여행지 추천, 일정 계획, 맛집, 교통 등 자유롭게 질문
- **RAG 기반 정보 검색** — 국내외 306개 여행지 데이터(위키피디아)를 Chroma 벡터DB에 저장 후 유사도 검색
- **실시간 스트리밍 응답** — SSE(Server-Sent Events)로 ChatGPT처럼 타이핑 효과 출력
- **대화 맥락 유지** — 이전 대화를 기억하며 연속적인 상담 가능
- **실시간 날씨** — OpenWeatherMap API로 여행지 현재 날씨 표시
- **인터랙티브 지도** — OpenStreetMap + Leaflet으로 여행지 위치 시각화
- **여행 일정표 자동 생성** — 일정표 파싱 + PDF 다운로드
- **대화 내보내기** — 대화 기록 .txt 저장

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| LLM | Groq API (LLaMA 3.3 70B) |
| AI 프레임워크 | LangChain + RAG + Chroma DB |
| 임베딩 모델 | sentence-transformers/all-MiniLM-L6-v2 |
| 백엔드 | FastAPI + Uvicorn (Python 3.10) |
| 프론트엔드 | React 18 + TypeScript + Tailwind CSS |
| 컨테이너 | Docker + Docker Compose |
| CI/CD | Jenkins |
| 오케스트레이션 | Kubernetes (Minikube) |
| 클라우드 | AWS EC2 t3.micro (Amazon Linux 2023) |
| 웹서버 | nginx (리버스 프록시 + SSL) |
| SSL | Let's Encrypt + DuckDNS 무료 도메인 |
| 프론트엔드 배포 | GitHub Pages |
| 데이터 | Wikipedia API (국내 103개 + 해외 203개 = 306개 여행지) |

---

## 시스템 아키텍처

```
[사용자]
    ↓ HTTPS
[GitHub Pages]  →  React 프론트엔드
    ↓ HTTPS SSE (jhwwon-travel.duckdns.org)
[nginx] → 리버스 프록시
    ↓
[FastAPI + Uvicorn :8000]
    ↓
[Chroma VectorDB]  →  RAG 유사도 검색
    ↓
[Groq LLM API]  →  스트리밍 응답 생성
```

---

## 로컬 실행 방법

### 사전 준비
- Python 3.10+
- Node.js 18+
- Groq API 키 (https://console.groq.com)
- OpenWeatherMap API 키 (https://openweathermap.org/api)

### 1. 저장소 클론 및 환경변수 설정

```bash
git clone https://github.com/jhwwon/ai-travel-guide.git
cd ai-travel-guide
```

`.env` 파일 생성:
```
GROQ_API_KEY=your_groq_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
```

### 2. 백엔드 실행

```bash
# 가상환경 생성 및 활성화
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# 패키지 설치
pip install -r requirements.txt

# 벡터DB 구축 (최초 1회)
python app/data_loader.py

# 서버 실행
uvicorn app.main:app --reload
```

백엔드 실행 후 API 문서: http://127.0.0.1:8000/docs

### 3. 프론트엔드 실행

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

브라우저에서 http://localhost:3000 접속

---

## Docker로 실행

```bash
docker compose up --build
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000

---

## 배포 구성

| 서비스 | URL |
|--------|-----|
| 프론트엔드 (GitHub Pages) | https://jhwwon.github.io/ai-travel-guide |
| 백엔드 API | https://jhwwon-travel.duckdns.org |
| API 문서 | https://jhwwon-travel.duckdns.org/docs |

---

## 폴더 구조

```
ai-travel-guide/
├── app/                      # FastAPI 백엔드
│   ├── main.py               # API 엔드포인트
│   ├── chain.py              # LangChain + RAG + 스트리밍
│   ├── data_loader.py        # Wikipedia 데이터 수집
│   ├── vector_store.py       # Chroma 벡터DB 관리
│   └── data/chroma_db/       # 벡터DB 저장소
├── frontend/                 # React 프론트엔드
│   ├── src/components/
│   │   ├── ChatBox.tsx       # 메인 채팅 UI
│   │   └── TravelMap.tsx     # Leaflet 지도
│   └── public/
├── k8s/                      # Kubernetes 매니페스트
├── Dockerfile                # 백엔드 Docker 이미지
├── docker-compose.yml        # 멀티 컨테이너 구성
├── Jenkinsfile               # CI/CD 파이프라인
└── requirements.txt          # Python 패키지 목록
```

---

## API 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/chat` | 일반 채팅 응답 |
| POST | `/chat/stream` | SSE 스트리밍 응답 |
| GET | `/weather/{city}` | 실시간 날씨 조회 |
| GET | `/health` | 서버 상태 확인 |
