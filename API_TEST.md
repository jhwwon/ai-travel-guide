# AI Travel Guide API 테스트 가이드

API 문서 주소: `http://127.0.0.1:8000/docs`

---

## 1. POST /chat — 일반 채팅

### Swagger UI에서 테스트
1. `POST /chat` 클릭
2. 우측 상단 **Try it out** 버튼 클릭
3. Request body에 아래 내용 입력 후 **Execute** 클릭

```json
{
  "message": "도쿄 여행 추천해줘",
  "session_id": "test_user_001"
}
```

### 예상 응답
```json
{
  "response": "도쿄는 일본의 수도로..."
}
```

### curl로 테스트
```bash
curl -X POST "http://127.0.0.1:8000/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"도쿄 여행 추천해줘\", \"session_id\": \"test_001\"}"
```

---

## 2. POST /chat/stream — 스트리밍 채팅

> AI 답변이 실시간으로 스트리밍되는 엔드포인트입니다.
> Swagger UI에서는 스트리밍 확인이 어려우므로 curl 사용을 권장합니다.

### Swagger UI에서 테스트
1. `POST /chat/stream` 클릭
2. **Try it out** 클릭
3. Request body 입력 후 **Execute** 클릭

```json
{
  "message": "제주도 3박 4일 여행 일정 짜줘",
  "session_id": "test_user_001"
}
```

> ⚠️ **Swagger UI 응답 주의**
> Swagger에서는 한글이 `\uc81c`, `\ub3c4` 같은 유니코드 이스케이프로 표시됩니다.
> 이는 `json.dumps()`로 직렬화 시 한글이 ASCII 형태로 변환되기 때문이며 **정상 동작**입니다.
> 예: `\uc81c\ub3c4` → 제도, `\ub3c4\ucf54` → 도쿄
> 실제 프론트엔드에서는 `JSON.parse()`로 파싱되어 한글로 정상 출력됩니다.

### curl로 테스트 (한글 정상 출력 확인 권장)
```bash
curl -X POST "http://127.0.0.1:8000/chat/stream" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"제주도 여행 추천해줘\", \"session_id\": \"test_001\"}" \
  --no-buffer
```

### 예상 응답 형식 (SSE)
```
data: "제주도는"
data: " 아름다운"
data: " 섬으로..."
data: "[DONE]"
```

---

## 3. GET /weather/{city} — 실시간 날씨

### Swagger UI에서 테스트
1. `GET /weather/{city}` 클릭
2. **Try it out** 클릭
3. `city` 파라미터에 영문 도시명 입력 후 **Execute** 클릭

| 도시 | city 파라미터 입력값 |
|------|-------------------|
| 서울 | Seoul |
| 도쿄 | Tokyo |
| 파리 | Paris |
| 뉴욕 | New York |
| 방콕 | Bangkok |
| 싱가포르 | Singapore |
| 취리히 | Zurich |
| 시드니 | Sydney |

### 예상 응답
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

### curl로 테스트
```bash
curl "http://127.0.0.1:8000/weather/Tokyo"
```

### 오류 응답 (API 키 미설정 시)
```json
{
  "error": "날씨 API 키가 설정되지 않았습니다."
}
```

---

## 4. GET /health — 서버 상태 확인

### Swagger UI에서 테스트
1. `GET /health` 클릭
2. **Try it out** 클릭
3. **Execute** 클릭

### 예상 응답
```json
{
  "status": "ok"
}
```

### curl로 테스트
```bash
curl "http://127.0.0.1:8000/health"
```

---

## 5. 대화 맥락 유지 테스트

같은 `session_id`로 연속 질문 시 이전 대화를 기억하는지 확인합니다.

### curl 순서대로 실행
```bash
# 1번 질문
curl -X POST "http://127.0.0.1:8000/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"도쿄 여행 추천해줘\", \"session_id\": \"session_abc\"}"

# 2번 질문 (같은 session_id — "거기"가 도쿄를 가리켜야 함)
curl -X POST "http://127.0.0.1:8000/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"거기 맛집도 알려줘\", \"session_id\": \"session_abc\"}"
```

---

## 6. 테스트 체크리스트

| 항목 | 테스트 방법 | 확인 |
|------|------------|------|
| 서버 정상 동작 | `GET /health` → `{"status": "ok"}` 확인 | ⬜ |
| 일반 채팅 응답 | `POST /chat` → response 정상 수신 | ⬜ |
| 스트리밍 채팅 | `POST /chat/stream` → 청크 단위 응답 확인 | ⬜ |
| 날씨 정상 조회 | `GET /weather/Seoul` → 온도/날씨 확인 | ⬜ |
| 대화 맥락 유지 | 같은 session_id로 연속 질문 후 문맥 확인 | ⬜ |
| 한국어 전용 응답 | 답변에 한자/영어/러시아어 미포함 확인 | ⬜ |
