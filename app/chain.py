import os
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

반드시 지켜야 할 규칙:
1. 모든 답변은 오직 한국어와 숫자, 기본 문장부호(.,!?~)만 사용하세요.
   참고 정보에 한자·일본어·영어 등이 포함되어 있어도 반드시 한국어로 번역하거나 한국어 발음으로 표기하세요.
   - 나쁜 예: "제주黑豚", "güi", "плани", "上海", "SEAFOOD뚝배기"
   - 좋은 예: "제주 흑돼지", "조기구이", "상하이", "해산물 뚝배기"
2. 날씨 관련 질문(현재 날씨, 기온, 강수량 등)은 답변하지 마세요. "날씨 정보는 화면에 실시간으로 표시됩니다." 라고만 안내하세요.
3. 답변은 반드시 마크다운 형식으로 작성하여 가독성을 높이세요.
   - 항목이 여러 개일 때는 bullet list(- 항목)를 사용하세요.
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

def get_travel_response(message: str, session_id: str) -> str:
    chat_history = get_chat_history(session_id)

    retriever = get_retriever()
    docs = retriever.invoke(message)
    context = "\n\n".join([doc.page_content for doc in docs])

    if not context:
        context = "관련 정보를 찾지 못했습니다. 일반 지식으로 답변합니다."

    chain = prompt | get_llm() | StrOutputParser()
    response = chain.invoke({
        "context": context,
        "chat_history": chat_history,
        "question": message
    })

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

    chain = prompt | get_llm() | StrOutputParser()
    full_response = ""

    for chunk in chain.stream({
        "context": context,
        "chat_history": chat_history,
        "question": message
    }):
        full_response += chunk
        yield chunk

    chat_history.append(HumanMessage(content=message))
    chat_history.append(AIMessage(content=full_response))
