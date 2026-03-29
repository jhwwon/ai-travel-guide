import os
import re
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from app.vector_store import get_vectorstore

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

_vectorstore = None

def get_retriever():
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = get_vectorstore()
    return _vectorstore.as_retriever(search_kwargs={"k": 3})

def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=GROQ_API_KEY,
        temperature=0.3
    )

prompt = ChatPromptTemplate.from_messages([
    ("system", """You must always respond in Korean only. Never use any other language or script.

당신은 친절한 AI 여행 가이드입니다.
아래 여행지 정보를 참고하여 사용자의 질문에 답변해주세요.
맛집, 관광지, 여행 팁, 문화 등 여행에 관련된 모든 것을 도와드립니다.
정보가 부족하면 당신이 알고 있는 지식으로 보완해서 답변해주세요.
답변은 충분히 상세하게 작성하세요. 단순히 이름만 나열하지 말고 각 항목마다 간단한 설명, 특징, 팁을 함께 제공하세요.

반드시 지켜야 할 규칙:
1. 모든 답변은 오직 한국어와 숫자, 기본 문장부호(.,!?~)만 사용하세요.
   참고 정보에 한자·일본어·영어 등이 포함되어 있어도 반드시 한국어로 번역하거나 한국어 발음으로 표기하세요.
   - 나쁜 예: "제주黑豚", "güi", "плани", "上海", "SEAFOOD뚝배기"
   - 좋은 예: "제주 흑돼지", "조기구이", "상하이", "해산물 뚝배기"
2. 날씨 관련 질문(현재 날씨, 기온, 강수량 등)은 답변하지 마세요. "날씨 정보는 화면에 실시간으로 표시됩니다." 라고만 안내하세요.
3. 답변은 반드시 마크다운 형식으로 작성하여 가독성을 높이세요.
   - 항목이 여러 개일 때는 bullet list(- 항목)를 사용하세요. 리스트 항목 안에 *, •, ▶ 등 기호를 추가로 쓰지 마세요.
4. 사용자가 "일정표", "일정 짜줘", "여행 계획" 등을 요청하면 반드시 아래 형식으로만 답변하세요:
   1일차
   - 활동1
   - 활동2
   2일차
   - 활동1
   - 활동2
   (### 소제목, 다른 텍스트 없이 오직 위 형식만 사용)
   - 중요한 이름이나 키워드는 **굵게** 표시하세요.
   - 카테고리가 나뉠 때는 ### 소제목을 사용하세요.
   - 한 문단에 모든 내용을 넣지 말고 내용별로 단락을 나눠서 작성하세요.

참고 정보:
{context}"""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}")
])

chat_histories = {}
MAX_HISTORY_MESSAGES = 20  # 최대 10턴 (human + AI 각 1쌍)
MAX_SESSIONS = 100  # 최대 세션 수

def get_chat_history(session_id: str):
    if session_id not in chat_histories:
        # 세션 수가 초과되면 가장 오래된 세션 삭제
        if len(chat_histories) >= MAX_SESSIONS:
            oldest = next(iter(chat_histories))
            del chat_histories[oldest]
        chat_histories[session_id] = []
    history = chat_histories[session_id]
    # 최대 메시지 수 초과 시 앞에서부터 삭제 (오래된 대화 제거)
    if len(history) > MAX_HISTORY_MESSAGES:
        chat_histories[session_id] = history[-MAX_HISTORY_MESSAGES:]
    return chat_histories[session_id]

def filter_non_korean(text: str) -> str:
    """한국어·숫자·마크다운 기호 외 문자를 제거합니다."""
    # 허용: 한글, 숫자(0-9), 마크다운/문장부호(- * # . ! ? , : ( ) [ ] \n \r \t 공백), 이모지 제외
    filtered = re.sub(r'[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F0-9\s\-\*#\.!\?,:\(\)\[\]\n\r]', '', text)
    # 내용 없는 빈 bold 마크다운 제거 (예: ****, ** **)
    filtered = re.sub(r'\*\*\s*\*\*', '', filtered)
    return filtered

ITINERARY_KEYWORDS = ["일정표", "일정 짜", "일정짜", "여행 계획", "여행계획", "며칠 일정", "박 일정"]

ITINERARY_INSTRUCTION = """
반드시 아래 형식으로만 답변하세요. 다른 텍스트, 소제목, 설명 없이 오직 이 형식만 사용하세요.
모든 장소명과 활동은 반드시 한국어(한글)로만 표기하세요. 영어·한자·일본어 장소명 사용 절대 금지.
각 항목은 장소명만 쓰지 말고 구체적인 활동 내용을 함께 적어주세요. (예: "아라시야마 대나무 숲 산책 및 도게츠교 구경")
하루에 최소 4개 이상의 항목을 작성하세요.

1일차
- 한글로 쓴 구체적인 장소 및 활동 설명
- 한글로 쓴 구체적인 장소 및 활동 설명
- 한글로 쓴 구체적인 장소 및 활동 설명
- 한글로 쓴 구체적인 장소 및 활동 설명

2일차
- 한글로 쓴 구체적인 장소 및 활동 설명
- 한글로 쓴 구체적인 장소 및 활동 설명
- 한글로 쓴 구체적인 장소 및 활동 설명
- 한글로 쓴 구체적인 장소 및 활동 설명

(요청한 일수에 맞게 빠짐없이 모든 일차를 작성. 절대로 일차를 건너뛰지 마세요.)
"""

def is_itinerary_request(message: str) -> bool:
    return any(kw in message for kw in ITINERARY_KEYWORDS)

def get_travel_response(message: str, session_id: str) -> str:
    chat_history = get_chat_history(session_id)

    retriever = get_retriever()
    docs = retriever.invoke(message)
    context = "\n\n".join([doc.page_content for doc in docs])

    if not context:
        context = "관련 정보를 찾지 못했습니다. 일반 지식으로 답변합니다."

    question = message + (ITINERARY_INSTRUCTION if is_itinerary_request(message) else "")

    chain = prompt | get_llm() | StrOutputParser()
    response = chain.invoke({
        "context": context,
        "chat_history": chat_history,
        "question": question
    })

    response = filter_non_korean(response)
    chat_history.append(HumanMessage(content=message))
    chat_history.append(AIMessage(content=response))

    return response


def stream_travel_response(message: str, session_id: str):
    chat_history = get_chat_history(session_id)

    retriever = get_retriever()
    docs = retriever.invoke(message)
    context = "\n\n".join([doc.page_content for doc in docs])

    if not context:
        context = "관련 정보를 찾지 못했습니다. 일반 지식으로 답변합니다."

    question = message + (ITINERARY_INSTRUCTION if is_itinerary_request(message) else "")

    chain = prompt | get_llm() | StrOutputParser()
    full_response = ""

    for chunk in chain.stream({
        "context": context,
        "chat_history": chat_history,
        "question": question
    }):
        filtered_chunk = filter_non_korean(chunk)
        full_response += filtered_chunk
        yield filtered_chunk

    full_response = filter_non_korean(full_response)
    chat_history.append(HumanMessage(content=message))
    chat_history.append(AIMessage(content=full_response))
