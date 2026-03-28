# AI 여행 가이드 (AI Travel Guide) 프로젝트 기획서

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | AI Travel Guide (대화형 AI 여행 도우미) |
| 목적 | LangChain, RAG, LLM을 활용한 대화형 여행 가이드 서비스 |
| 특징 | 국내외 여행지 정보 검색 + 실시간 날씨/지도/이미지 + 대화 맥락 유지 + CI/CD 자동 배포 |

---

## 2. 서비스 주요 기능

### 2.1 핵심 기능
- **대화형 여행 상담**: 사용자가 여행지를 입력하면 AI가 맞춤 정보 제공
- **RAG 기반 정보 검색**: 사전 수집된 여행지 데이터를 Chroma 벡터DB에 저장 후 검색
- **스트리밍 응답**: ChatGPT처럼 답변이 실시간으로 타이핑되듯 출력 (SSE)
- **대화 맥락 유지**: 이전 대화 내용을 기억하며 연속적인 상담 가능
- **국내외 여행지 지원**: 국내 + 해외 총 301개 여행지 (위키피디아 API 기반)

### 2.2 제공 정보
- 주요 관광지 추천
- 현지 음식/맛집 정보
- 교통 수단 안내
- 여행 팁 및 문화 정보
- 실시간 날씨 정보 (OpenWeatherMap API)
- 인터랙티브 지도 (OpenStreetMap + Leaflet)
- 여행 일정표 자동 생성 + PDF 다운로드
- 예산 계획 도움

### 2.3 수집 데이터 현황

| 구분 | 수집 지역 수 | 데이터 소스 |
|------|------------|------------|
| 국내 | 91개 | 위키피디아 API |
| 해외 | 210개 | 위키피디아 API |
| **합계** | **301개** | - |

**국내 수집 지역**
- 특별시/광역시: 서울, 부산, 인천, 대구, 광주, 대전, 울산, 세종
- 경기도: 수원, 성남, 용인, 고양, 부천, 안산, 안양, 평택, 가평, 양평 등
- 강원도: 춘천, 강릉, 속초, 평창, 원주, 홍천, 양양, 태백, 정선 등
- 충청도: 공주, 부여, 천안, 청주, 충주, 단양, 아산, 보령, 태안 등
- 전라도: 전주, 여수, 순천, 목포, 담양, 보성, 광양, 남원, 완도 등
- 경상도: 경주, 안동, 통영, 거제, 남해, 포항, 구미, 창원, 울릉도 등
- 제주도: 제주도, 서귀포, 우도, 마라도

**해외 수집 지역**
- 일본: 도쿄, 오사카, 교토, 삿포로, 후쿠오카, 오키나와 등 20개
- 중국/홍콩: 베이징, 상하이, 홍콩, 마카오, 청두, 시안 등 19개
- 동남아시아: 방콕, 싱가포르, 발리, 하노이, 호치민, 푸켓 등 23개
- 남아시아: 뭄바이, 뉴델리, 콜카타, 카트만두 등 11개
- 유럽: 파리, 런던, 로마, 바르셀로나, 프라하, 아테네, 취리히 등 60개
- 중동: 두바이, 이스탄불, 아부다비, 도하 등 11개
- 아프리카: 카이로, 케이프타운, 나이로비, 마라케시 등 10개
- 오세아니아: 시드니, 멜버른, 오클랜드, 퀸스타운 등 10개
- 북미: 뉴욕, 로스앤젤레스, 밴쿠버, 토론토, 호놀룰루 등 24개
- 중미/카리브: 칸쿤, 멕시코시티, 하바나 등 7개
- 남미: 리우데자네이루, 부에노스아이레스, 마추픽추 등 14개

---

## 3. 기술 스택

### 3.1 AI/ML
| 기술 | 용도 |
|------|------|
| LangChain | AI 체인 구성, 프롬프트 관리, Memory |
| Groq (LLaMA 3.3 70B) | LLM 추론 엔진 |
| LangChain-Groq | LangChain-Groq 연동 |
| Chroma DB | 벡터DB — 여행지 문서 저장 및 유사도 검색 |
| RAG | 검색 기반 답변 생성 구조 |

### 3.2 데이터 수집
| 기술 | 용도 |
|------|------|
| 위키피디아 API | 국내 + 해외 여행지 데이터 (301개) |
| 위키피디아 API | 국내 + 해외 여행지 데이터 수집 (301개) |

### 3.3 백엔드
| 기술 | 용도 |
|------|------|
| Python 3.10.6 | 백엔드 언어 |
| FastAPI | REST API + SSE 스트리밍 서버 |
| Uvicorn | ASGI 서버 |
| python-dotenv | 환경변수 관리 |
| OpenWeatherMap API | 실시간 날씨 정보 |

### 3.4 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | v24.14.1 (LTS) | 프론트엔드 런타임 환경 |
| npm | 11.11.0 | 패키지 매니저 |
| React 18 | 18+ | UI 프레임워크 |
| TypeScript | 최신 | 타입 안전성 |
| Tailwind CSS | 3.x | 스타일링 |
| Axios | 최신 | API 통신 |
| react-markdown + remark-gfm | 최신 | AI 답변 마크다운 렌더링 |
| react-leaflet + Leaflet | 최신 | 인터랙티브 지도 (OpenStreetMap) |
| jspdf + html2canvas | 최신 | 여행 일정표 PDF 다운로드 |
> ⚠️ Unsplash source.unsplash.com 은 2023년 서비스 종료로 이미지 기능 미제공

### 3.5 인프라 / DevOps
| 기술 | 용도 |
|------|------|
| Docker | 백엔드/프론트엔드 컨테이너화 |
| Docker Compose | 로컬 멀티 컨테이너 관리 |
| Jenkins | CI/CD 파이프라인 자동화 |
| Kubernetes (Minikube) | 컨테이너 오케스트레이션 및 배포 |
| GitHub | 소스코드 버전 관리 |

---

## 4. 시스템 아키텍처

### 서비스 흐름
```
[사용자]
    ↓ 채팅 메시지 입력
[React 프론트엔드]
    ↓ SSE 스트리밍 요청 (POST /chat/stream)
[FastAPI 백엔드]
    ↓ LangChain 처리
[Chroma 벡터DB] ← 유사 여행지 문서 검색 (RAG)
    ↓
[Groq LLM API] ← 문서 + 질문으로 답변 스트리밍 생성
    ↓
[응답 스트리밍 반환]
    ↓ 병렬 처리
[OpenWeatherMap API] ← 실시간 날씨
[Unsplash]           ← 여행지 이미지
[OpenStreetMap]      ← 지도 렌더링
```

### 데이터 수집 흐름 (초기 1회)
```
위키피디아 API → 국내 + 해외 여행지 데이터 (301개)
        ↓
   텍스트 전처리
        ↓
   Chroma 벡터DB 저장 (로컬 디스크)
```

### CI/CD 파이프라인
```
GitHub Push
    ↓
Jenkins (자동 빌드/테스트)
    ↓
Docker 이미지 빌드 & Docker Hub 푸시
    ↓
Kubernetes (Minikube) 자동 배포
    ↓
React Pod + FastAPI Pod 실행
```

---

## 5. 프로젝트 폴더 구조

```
ai-travel-guide/
├── app/                            # FastAPI 백엔드
│   ├── __init__.py
│   ├── main.py                     # FastAPI 앱 진입점 (chat, chat/stream, weather)
│   ├── chain.py                    # LangChain + Groq + RAG + 스트리밍 로직
│   ├── data_loader.py              # 데이터 수집 (위키피디아 API)
│   ├── vector_store.py             # Chroma 벡터DB 관리
│   └── data/
│       └── chroma_db/              # Chroma 벡터DB 저장 위치
├── frontend/                       # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBox.tsx         # 메인 채팅 UI (스트리밍, 날씨, 지도, 이미지, 일정표)
│   │   │   └── TravelMap.tsx       # Leaflet 지도 컴포넌트
│   │   ├── App.tsx
│   │   └── index.css               # Tailwind CSS
│   ├── Dockerfile
│   └── package.json
├── k8s/                            # Kubernetes 설정
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── service.yaml
├── Jenkinsfile                     # Jenkins CI/CD 파이프라인
├── Dockerfile                      # 백엔드 Dockerfile
├── docker-compose.yml              # 로컬 개발 환경
├── .env                            # 환경변수
├── requirements.txt                # Python 패키지 목록
└── PROJECT_PLAN.md                 # 프로젝트 기획서
```

---

## 6. API 명세

### POST /chat
- **설명**: 여행 관련 질문에 AI가 답변 (일반 응답)
- **Request Body**:
```json
{
  "message": "도쿄 여행 추천해줘",
  "session_id": "user_001"
}
```
- **Response**:
```json
{
  "response": "도쿄는 일본의 수도로..."
}
```

### POST /chat/stream
- **설명**: 여행 관련 질문에 AI가 실시간 스트리밍으로 답변 (SSE)
- **Request Body**: `/chat` 동일
- **Response**: `text/event-stream` 형식으로 청크 단위 전송
```
data: "도쿄는"
data: " 일본의"
data: " 수도로..."
data: "[DONE]"
```

### GET /weather/{city}
- **설명**: 특정 도시의 실시간 날씨 정보 조회
- **Response**:
```json
{
  "city": "Tokyo",
  "temp": 18,
  "feels_like": 17,
  "description": "맑음",
  "humidity": 60,
  "icon": "01d"
}
```

### GET /health
- **설명**: 서버 상태 확인
- **Response**:
```json
{
  "status": "ok"
}
```

---

## 7. 개발 단계별 계획

| 단계 | 내용 | 상태 |
|------|------|------|
| 1단계 | AI 코어 개발 (LangChain + Groq + FastAPI) | ✅ 완료 |
| 2단계 | 데이터 수집 및 Chroma RAG 구성 (위키피디아 301개) | ✅ 완료 |
| 3단계 | React 프론트엔드 개발 | ✅ 완료 |
| 4단계 | Docker 컨테이너화 | ✅ 완료 |
| 5단계 | Jenkins CI/CD 구성 | ✅ 완료 |
| 6단계 | Kubernetes (Minikube) 배포 | ✅ 완료 |
| 7단계 | 클라우드 배포 (Render + GitHub Pages) | ✅ 완료 |

### 3단계 세부 구현 내용
- 다크 글래스모피즘 UI 디자인
- SSE 스트리밍 수신 및 실시간 렌더링
- react-markdown 기반 마크다운 렌더링 (표, 목록, 강조 등)
- OpenWeatherMap 실시간 날씨 카드
- Leaflet + OpenStreetMap 인터랙티브 지도
- 여행 일정표 자동 파싱 + PDF 다운로드
- 대화 기록 저장/불러오기 (sessionStorage — 탭 닫으면 초기화)
- 메시지 복사 버튼
- 대화 내보내기 (.txt)
- React.memo + streamingContent 분리로 렌더링 최적화
- 사이드바: 지역별 2열 그리드 카테고리 + pill 형태 추천 질문

---

## 8. 환경변수 목록

| 변수명 | 설명 |
|--------|------|
| GROQ_API_KEY | Groq LLM API 키 |
| OPENWEATHER_API_KEY | OpenWeatherMap 실시간 날씨 API 키 |

---

## 9. 트러블슈팅

### 1. Microsoft Store Python 별칭 문제
- **문제**: `python --version` 실행 시 "Python was not found" 오류
- **원인**: Windows App execution aliases에서 Microsoft Store Python이 실제 Python보다 우선순위를 가짐
- **해결**: 설정 → 앱 → 고급 앱 설정 → 앱 실행 별칭에서 `python.exe` 끄기 + Python 재설치 시 "Add Python to environment variables" 체크

---

### 2. LangChain 버전 호환성 문제
- **문제**: `No module named 'langchain.chains'`, `No module named 'langchain.schema'`
- **원인**: LangChain 1.x 버전에서 모듈 경로 대폭 변경됨
- **해결**:
  - `langchain.schema.Document` → `langchain_core.documents.Document`
  - `ConversationalRetrievalChain` → LCEL(LangChain Expression Language) 방식으로 체인 구성

---

### 3. Gemini 모델명 오류
- **문제**: `models/gemini-1.5-pro is not found for API version v1beta`
- **원인**: 최신 langchain-google-genai 버전에서 모델명 형식 변경
- **해결**: 모델명을 `gemini-1.5-pro` → `gemini-2.0-flash`로 변경

---

### 4. Gemini API 무료 할당량 초과
- **문제**: `429 RESOURCE_EXHAUSTED` - 무료 티어 할당량 초과
- **원인**: 개발/테스트 중 API 호출 횟수 초과
- **해결**: LLM을 Gemini → **Groq (LLaMA 3.3 70B)**으로 교체 (무료 할당량 넉넉)

---

### 5. Wikipedia API 403 오류
- **문제**: `403 Forbidden - Please set a user-agent`
- **원인**: Wikipedia REST API는 User-Agent 헤더 필수
- **해결**: 요청 헤더에 `User-Agent` 추가
```python
HEADERS = {"User-Agent": "AITravelGuide/1.0 (travel-guide-project)"}
requests.get(url, headers=HEADERS)
```

---

### 7. Windows 터미널 한글 인코딩 문제
- **문제**: 터미널에서 한글이 `????` 로 깨져서 출력됨
- **원인**: Windows cmd의 기본 인코딩(cp949)이 일부 유니코드 문자(이모지 등) 미지원
- **해결**: print문에서 이모지 제거, 영문/ASCII 문자로 대체

---

### 8. SSE 스트리밍에서 줄바꿈 손실 문제
- **문제**: 스트리밍 응답 시 AI 답변의 줄바꿈(`\n`)이 사라져 텍스트가 한 줄로 붙어서 출력됨
- **원인**: SSE 형식은 `data: 내용\n\n` 구조인데, 내용 안에 `\n`이 포함되면 메시지 구분자로 인식되어 잘림
- **해결**: 백엔드에서 `json.dumps(chunk)`로 청크를 JSON 직렬화하여 전송, 프론트엔드에서 `JSON.parse()`로 파싱
```python
# 백엔드 (main.py)
yield f"data: {json.dumps(chunk)}\n\n"

# 프론트엔드 (ChatBox.tsx)
const data = JSON.parse(line.slice(6));
```

---

### 9. 스트리밍 중 메시지 전체 리렌더링으로 인한 화면 깜빡임
- **문제**: AI가 답변을 스트리밍할 때 화면이 지지직거리며 깜빡이는 현상 발생
- **원인**: 매 청크마다 `setMessages`로 배열 전체를 교체하면서 `React.memo`를 적용해도 `msg` 객체가 새 참조로 생성되어 이전 메시지까지 모두 리렌더링됨
- **해결**: 스트리밍 중인 내용을 별도 `streamingContent` state로 분리하여 `messages` 배열을 건드리지 않음. 스트리밍 완료 후에만 완성된 메시지를 `messages`에 한 번 추가
```tsx
// 스트리밍 중 - streamingContent만 업데이트 (이전 메시지 리렌더링 없음)
setStreamingContent(fullContent);

// 스트리밍 완료 후 - 완성된 메시지를 messages에 한 번만 추가
setMessages((prev) => [...prev, completedMsg]);
setStreamingContent('');
```

---

### 10. LLM 답변에 한자/외래어 혼용 문제
- **문제**: AI 답변에 "제주黑豚", "güi", "SEAFOOD뚝배기" 등 한자·영문이 혼용되어 출력됨
- **원인**: LLaMA 모델의 학습 데이터에 다국어 텍스트가 섞여 있어 한국어 응답 중 다른 언어를 혼용하는 경향이 있음
- **해결**: 시스템 프롬프트에 한국어 전용 답변 규칙 명시
```python
"반드시 지켜야 할 규칙: 모든 답변은 한국어로만 작성하세요. 한자, 일본어, 영어, 로마자 표기 등을 절대 섞지 마세요."
```

---

### 11. PowerShell 스크립트 실행 정책 오류
- **문제**: `npm start` 실행 시 "이 시스템에서 스크립트를 실행할 수 없으므로" 오류
- **원인**: Windows PowerShell의 기본 실행 정책이 RemoteSigned 미만으로 설정됨
- **해결**: PowerShell 관리자 권한으로 실행 후 정책 변경
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

### 12. Docker 소켓 권한 오류 (Jenkins)
- **문제**: Jenkins 파이프라인에서 `docker build` 실행 시 `permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock` 오류
- **원인**: Jenkins 컨테이너의 jenkins 사용자가 호스트의 Docker 소켓에 접근할 권한 없음
- **해결**: `docker-compose.yml`의 Jenkins 서비스에 `user: root` 추가

```yaml
jenkins:
  user: root
```

---

### 13. Jenkins 빌드 컨텍스트 경로 오류
- **문제**: `docker build /app` 실행 시 `unable to prepare context: path "/app" not found` 오류
- **원인**: Jenkins 컨테이너 내부의 `/app` 경로를 호스트 Docker 데몬이 찾을 수 없음 (컨테이너 내부 경로와 호스트 경로가 다름)
- **해결**:
  1. `docker-compose.yml`에 프로젝트 디렉토리를 Jenkins에 마운트 (`c:/ai-travel-guide:/app`)
  2. `tar` 파이프로 빌드 컨텍스트를 직접 Docker에 전달

```groovy
sh """
    cd /app && tar -czh --exclude='./.venv' --exclude='./frontend' . | \
    docker build -t ai-travel-backend:latest -
"""
```

---

### 14. docker compose 명령어 미지원 오류 (Jenkins)
- **문제**: Deploy 스테이지에서 `docker compose -f ...` 실행 시 `unknown shorthand flag: 'f' in -f` 오류
- **원인**: Jenkins 컨테이너에 설치된 `docker.io` 패키지에는 `compose` 플러그인이 미포함
- **해결**: Jenkins Dockerfile에 `docker-compose` 패키지 추가 설치 후 `docker-compose`(하이픈) 명령으로 변경

```dockerfile
RUN apt-get update && \
    apt-get install -y docker.io docker-compose && \
    rm -rf /var/lib/apt/lists/*
```

---

### 15. 컨테이너 이름 충돌 오류 (Jenkins Deploy)
- **문제**: `docker-compose up` 실행 시 `Conflict. The container name "/ai-travel-backend" is already in use` 오류
- **원인**: 이전에 실행 중이던 컨테이너가 삭제되지 않은 상태에서 재생성 시도
- **해결**: Deploy 전에 기존 컨테이너를 명시적으로 stop/rm 후 `--no-build` 옵션으로 실행

```groovy
sh """
    docker stop ai-travel-backend ai-travel-frontend || true
    docker rm ai-travel-backend ai-travel-frontend || true
    docker-compose -f /app/docker-compose.yml up -d --no-build backend frontend
"""
```

---

### 16. GitHub Pages 배포 실패 — frontend 서브모듈 문제

#### 16-1. frontend가 서브모듈로 인식되는 문제
- **문제**: GitHub Actions에서 `No url found for submodule path 'frontend' in .gitmodules` 오류로 Pages 배포 실패
- **원인**: `frontend/` 폴더 안에 `.git` 디렉토리가 존재했기 때문에 Git이 `frontend`를 독립 저장소(서브모듈)로 인식. Git 인덱스에 mode `160000`(gitlink)으로 등록되어 파일 내용 대신 커밋 해시만 가리킴
- **해결**: Git 인덱스에서 제거 후 일반 파일로 재등록

```bash
git rm --cached frontend -r   # 서브모듈로 등록된 항목 제거
git add frontend/             # 일반 파일로 다시 추가
git commit -m "fix: frontend 서브모듈 문제 해결"
git push
```

#### 16-2. gh-pages 패키지 캐시 오염 문제
- **문제**: 서브모듈 문제 해결 후에도 `gh-pages` 브랜치에 `.claude`, `.dockerignore`, `frontend/` 등 불필요한 파일이 계속 포함됨
- **원인**: `gh-pages` npm 패키지가 `node_modules/.cache/gh-pages/` 에 클론을 캐시하는데, 이전에 오염된 저장소 상태가 캐시에 남아 재사용됨
- **해결**: 캐시 삭제 + `gh-pages` 브랜치 삭제 후 직접 git orphan 브랜치로 배포

```bash
# gh-pages 패키지 캐시 삭제
rm -rf node_modules/.cache/gh-pages/

# remote gh-pages 브랜치 삭제
git push origin --delete gh-pages

# build/ 폴더에서 직접 orphan 브랜치 생성 후 푸시
cd frontend/build
git init temp_deploy
cd temp_deploy
git checkout --orphan gh-pages
cp -r ../* .
cp ../.nojekyll .
git add -A
git commit -m "Deploy to GitHub Pages"
git remote add origin https://github.com/<user>/<repo>.git
git push origin gh-pages
```

#### 16-3. Jekyll이 static 파일을 처리하지 못하는 문제
- **문제**: GitHub Pages가 Jekyll로 사이트를 빌드하면서 `_` 로 시작하는 경로나 dotfile을 무시할 수 있음
- **해결**: `public/` 폴더에 빈 `.nojekyll` 파일 추가 (CRA 빌드 시 자동으로 `build/`에 복사됨)

```bash
touch frontend/public/.nojekyll
```

---

## 10. 배포 URLs

| 서비스 | URL |
|--------|-----|
| 프론트엔드 (GitHub Pages) | https://jhwwon.github.io/ai-travel-guide |
| 백엔드 API (Render) | https://ai-travel-backend-75oy.onrender.com |
| 백엔드 API 문서 | https://ai-travel-backend-75oy.onrender.com/docs |

> ⚠️ Render 무료 티어는 15분 이상 미사용 시 슬립 모드로 전환됩니다. 첫 요청 시 30~60초 정도 대기가 발생할 수 있습니다.

---

## 11. 로컬 실행 방법

```bash
# 가상환경 활성화
.venv\Scripts\activate

# 초기 데이터 수집 (최초 1회만 실행)
python app/data_loader.py

# 백엔드 서버 실행
uvicorn app.main:app --reload

# 프론트엔드 실행 (별도 터미널)
cd frontend
npm start

# API 문서 확인
http://127.0.0.1:8000/docs

# 서비스 접속
http://localhost:3000
```
