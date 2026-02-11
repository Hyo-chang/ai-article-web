import os
import sys
import subprocess
import time
import atexit
import random
import re
import mariadb  # mariadb 임포트 추가
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

# 현재 파일의 디렉토리를 시스템 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from ArticleAnalyzer import AdvancedArticleAnalyzer, sanitize_text
from langchain_ollama.chat_models import ChatOllama
from langchain_huggingface import HuggingFaceEmbeddings
from news_keyword_extractor import NewsKeywordExtractor

# -------------------------------------------------

# .env 파일 로드 (상대 경로로 수정)
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# .env 파일에서 API 비밀 키 불러오기
API_SECRET_KEY = os.getenv("API_SECRET_KEY")
if not API_SECRET_KEY:
    print("[!!! 치명적 경고 !!!] .env 파일에 'API_SECRET_KEY'가 설정되지 않았습니다.")

# --- 1. Pydantic 모델 정의 ---
class KeywordScore(BaseModel):
    word: str
    score: float

class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    html_content: str
    article_title: str
    metadata: Dict[str, any] = {}
    available_categories: Optional[List[str]] = None


class AnalyzeResponse(BaseModel):
    summary: str
    keywords: List[KeywordScore]
    definitions: Dict[str, str]
    category: str

class ChatRequest(BaseModel):
    """AI 채팅 요청"""
    article_context: str  # 기사 본문 또는 요약
    question: str  # 사용자 질문
    snippet: Optional[str] = None  # 선택된 텍스트 (있는 경우)

class ChatResponse(BaseModel):
    """AI 채팅 응답"""
    answer: str

class AnalyzeUrlRequest(BaseModel):
    """URL 기반 기사 분석 요청"""
    article_url: str

class AnalyzeUrlResponse(BaseModel):
    """URL 기반 기사 분석 응답"""
    success: bool
    title: Optional[str] = None
    body: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[List[KeywordScore]] = None
    definitions: Optional[Dict[str, str]] = None
    image_url: Optional[str] = None
    published_at: Optional[str] = None
    publisher: Optional[str] = None
    error: Optional[str] = None

# --- 2. 전역 변수 및 생명주기 관리 ---

global_models: Dict[str, any] = {}

def cleanup_ollama_server():
    ollama_process = global_models.get("ollama_process")
    if ollama_process and ollama_process.poll() is None:
        print("[FastAPI] 비정상 종료 감지. Ollama 서버를 강제 종료합니다...")
        ollama_process.terminate()
        ollama_process.wait()
        print("[FastAPI] Ollama 서버 종료 완료.")

atexit.register(cleanup_ollama_server)

async def verify_api_key(x_api_key: str = Header(None)):
    if not API_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API_SECRET_KEY가 서버에 설정되지 않았습니다."
        )
    if x_api_key != API_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="올바른 API 키가 아닙니다."
        )
    return True

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- 서버 시작 시 실행 ---
    print("--- [FastAPI] 서버 시작 절차 개시 ---")

    # DB 커넥션 풀 생성
    try:
        print("[FastAPI] DB 커넥션 풀을 생성합니다...")
        db_pool = mariadb.ConnectionPool(
            pool_name="article_analyzer_pool",
            pool_size=5,
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 3306)),
            database=os.getenv("DB_NAME")
        )
        global_models["db_pool"] = db_pool
        print("[FastAPI] DB 커넥션 풀 생성 완료.")
    except mariadb.Error as e:
        print(f"[!!! FastAPI 치명적 오류 !!!] DB 커넥션 풀 생성 실패: {e}")
        global_models["db_pool"] = None

    print("[FastAPI] Ollama 서버를 백그라운드에서 시작합니다...")
    user_profile = os.environ.get("USERPROFILE")
    if not user_profile:
        raise RuntimeError("오류: 사용자 프로필 디렉토리를 찾을 수 없습니다.")
    ollama_executable_path = os.path.join(user_profile, "AppData", "Local", "Programs", "Ollama", "ollama.exe")
    
    if not os.path.exists(ollama_executable_path):
        print(f"[경고] 기본 경로({ollama_executable_path})에서 Ollama를 찾을 수 없습니다. 시스템 PATH에서 'ollama'를 실행합니다.")
        ollama_executable_path = "ollama"

    # Ollama 서버 시작을 위해 OLLAMA_HOST 환경 변수 설정
    ollama_env = os.environ.copy()
    ollama_env["OLLAMA_HOST"] = "127.0.0.1:11434"
    
    ollama_process = subprocess.Popen(
        [ollama_executable_path, "serve"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=ollama_env  # 수정된 환경 변수 사용
    )
    global_models["ollama_process"] = ollama_process
    # PID를 명시적으로 가져오도록 수정
    print(f"[FastAPI] Ollama 서버 시작됨 (PID: {ollama_process.pid}, Port: 11434). 5초 후 모델 로드를 시작합니다.")
    
    time.sleep(5)

    print("[FastAPI] LLM 및 임베딩 모델 로드를 시작합니다...")
    llm = ChatOllama(model="exaone3.5", options={"num_ctx": 8192}, ollama_base_url="http://localhost:11434")
    global_models["llm"] = llm

    embeddings = HuggingFaceEmbeddings(
        model_name="snunlp/KR-SBERT-V40K-klueNLI-augSTS",
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    global_models["embeddings"] = embeddings

    print("--- [FastAPI] 모든 모델 로드 완료. 서버가 준비되었습니다. ---")
    yield
    # --- 서버 종료 시 실행 ---
    print("--- [FastAPI] 서버 종료 절차 시작 ---")
    
    # DB 커넥션 풀 종료
    db_pool_to_close = global_models.get("db_pool")
    if db_pool_to_close:
        print("[FastAPI] DB 커넥션 풀을 닫습니다...")
        db_pool_to_close.close()
        print("[FastAPI] DB 커넥션 풀 닫기 완료.")

    print("[FastAPI] Ollama 서버를 종료합니다...")
    ollama_to_terminate = global_models.get("ollama_process")
    if ollama_to_terminate and ollama_to_terminate.poll() is None:
        ollama_to_terminate.terminate()
        ollama_to_terminate.wait()
        print("[FastAPI] Ollama 서버 종료 완료.")

    global_models.clear()
    print("--- [FastAPI] 모든 리소스 정리 완료. 서버를 종료합니다. ---")

# FastAPI 앱 생성
app = FastAPI(lifespan=lifespan)

# --- 3. API 엔드포인트 정의 ---

def _classify_category_placeholder(categories: Optional[List[str]]) -> str:
    """ AI 분류를 흉내 내는 임시 함수. 카테고리 목록 중 하나를 무작위로 선택 """
    if categories and len(categories) > 0:
        chosen_category = random.choice(categories)
        print(f"[FastAPI] 임시 카테고리 분류: '{chosen_category}' 선택됨")
        return chosen_category
    print("[FastAPI] 임시 카테고리 분류: 선택할 카테고리가 없어 '일반'으로 기본 설정")
    return "일반" # Default category

@app.post("/analyze", response_model=AnalyzeResponse, dependencies=[Depends(verify_api_key)])
async def analyze_article(request: AnalyzeRequest):
    """기사의 HTML 본문을 받아 키워드 추출, 요약, 단어 정의를 모두 수행합니다."""
    print(f"\n--- [FastAPI] '/analyze' 요청 수신 (Title: {sanitize_text(request.article_title)}) ---")

    try:
        # --- 0. 카테고리 분류 (임시) ---
        assigned_category = _classify_category_placeholder(request.available_categories)

        # --- 1. 키워드 추출 ---
        print("[FastAPI] 키워드 추출 시작...")
        llm = global_models["llm"]
        embeddings = global_models["embeddings"]

        keyword_extractor = NewsKeywordExtractor(embedding_model=embeddings)

        extracted_keywords_with_scores = keyword_extractor.extract_keywords(
            html_text=request.html_content,
            n=5,
            metadata=request.metadata
        )
        keywords_for_response = [KeywordScore(word=word, score=score) for word, score in extracted_keywords_with_scores]
        keyword_list = [item.word for item in keywords_for_response]
        print(f"[FastAPI] 키워드 추출 완료: {keyword_list}")

        # --- 2. 기사 분석 (요약 및 단어 정의) ---
        print("[FastAPI] 기사 분석 및 요약 시작...")
        analyzer = AdvancedArticleAnalyzer(
            article_text=request.html_content,
            article_title=request.article_title,
            key_words=keyword_list,
            llm=llm,
            embeddings=embeddings,
            db_pool=global_models.get("db_pool"),  # 전역 DB 풀 전달
            metadata=request.metadata
        )

        # 요약 실행 (내부적으로 단어 정의 동시 수행)
        summary_result, definitions_result = analyzer.summarize_and_define()

        print("[FastAPI] 분석 완료. 응답 전송.")
        return AnalyzeResponse(
            summary=summary_result,
            keywords=keywords_for_response,
            definitions=definitions_result,
            category=assigned_category
        )
    except Exception as e:
        print(f"[!!! FastAPI 치명적 오류 !!!] {e}")
        # 개발 환경에서는 상세한 오류를 확인하기 위해 스택 트레이스 출력
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"분석 중 오류 발생: {e}"
        )

@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(verify_api_key)])
async def chat_with_article(request: ChatRequest):
    """기사 맥락을 기반으로 사용자 질문에 답변합니다."""
    print(f"\n--- [FastAPI] '/chat' 요청 수신 ---")
    print(f"[FastAPI] 질문: {sanitize_text(request.question[:100])}...")

    try:
        llm = global_models["llm"]

        # 시스템 프롬프트 구성
        if request.snippet:
            system_prompt = """너는 뉴스 기사 내용을 해석하고 설명하는 AI 어시스턴트야.
사용자가 기사의 특정 부분을 선택했으니 그 부분에 집중해서 답변해줘.
답변은 친근하고 이해하기 쉽게 작성해줘."""
            user_prompt = f"""기사 전체 맥락:
{request.article_context[:2000]}

사용자가 선택한 부분:
"{request.snippet}"

질문: {request.question if request.question else "이 부분에 대해 설명해줘."}"""
        else:
            system_prompt = """너는 뉴스 기사 분석을 도와주는 AI 어시스턴트야.
기사 내용을 바탕으로 사용자의 질문에 정확하고 친근하게 답변해줘.
기사에 없는 내용은 추측하지 말고, 기사 내용을 기반으로만 답변해."""
            user_prompt = f"""기사 내용:
{request.article_context[:3000]}

질문: {request.question}"""

        # LLM 호출
        from langchain_core.messages import SystemMessage, HumanMessage
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]

        response = llm.invoke(messages)
        answer = sanitize_text(response.content.strip())

        print(f"[FastAPI] 응답 생성 완료 (길이: {len(answer)})")
        return ChatResponse(answer=answer)

    except Exception as e:
        print(f"[!!! FastAPI 오류 !!!] 채팅 중 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"AI 응답 생성 중 오류 발생: {e}"
        )

# --- 4. URL 크롤링 헬퍼 함수 ---

def crawl_article_from_url(url: str) -> Dict[str, Any]:
    """URL에서 기사를 크롤링합니다."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        response.encoding = response.apparent_encoding or 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')

        # 제목 추출
        title = None
        title_selectors = ["h2.media_end_head_headline", "h1.media_end_head_headline", "meta[property='og:title']"]
        for sel in title_selectors:
            el = soup.select_one(sel)
            if el:
                title = el.get("content") if el.name == "meta" else el.get_text(strip=True)
                break

        # 본문 추출
        body = None
        body_selectors = ["div#newsct_article", "article#dic_area", "div.article_body", "div.news_end"]
        for sel in body_selectors:
            el = soup.select_one(sel)
            if el:
                # 캡션 등 불필요한 요소 제거
                for caption in el.select(".end_photo_caption, figcaption, .img_desc"):
                    caption.decompose()
                body = el.get_text(separator="\n", strip=True)
                break

        # 이미지 URL 추출
        image_url = None
        og_image = soup.select_one("meta[property='og:image']")
        if og_image:
            image_url = og_image.get("content")

        # 발행일 추출
        published_at = None
        time_selectors = ["meta[property='article:published_time']", "span.media_end_head_info_datestamp_time"]
        for sel in time_selectors:
            el = soup.select_one(sel)
            if el:
                published_at = el.get("content") or el.get("data-date-time") or el.get_text(strip=True)
                break

        # 언론사 추출
        publisher = None
        pub_el = soup.select_one("meta[property='og:site_name']")
        if pub_el:
            publisher = pub_el.get("content")

        # 저작권 문구 제거
        if body:
            patterns = [
                r'<저작권자[^>]*>.*?(?:금지|>)',
                r'ⓒ\s*\S+.*?(?:무단.*?금지|저작권)',
                r'\S+@\S+\.\S+',
                r'무단\s*전재.*?금지',
            ]
            for pattern in patterns:
                body = re.sub(pattern, '', body, flags=re.IGNORECASE)
            body = re.sub(r'\n{3,}', '\n\n', body).strip()

        return {
            "success": True,
            "title": title,
            "body": body,
            "image_url": image_url,
            "published_at": published_at,
            "publisher": publisher,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/analyze-url", response_model=AnalyzeUrlResponse, dependencies=[Depends(verify_api_key)])
async def analyze_article_by_url(request: AnalyzeUrlRequest):
    """URL을 받아 크롤링 + AI 분석을 수행합니다."""
    print(f"\n--- [FastAPI] '/analyze-url' 요청 수신 (URL: {request.article_url}) ---")

    # 1. URL에서 기사 크롤링
    crawl_result = crawl_article_from_url(request.article_url)

    if not crawl_result["success"]:
        return AnalyzeUrlResponse(
            success=False,
            error=f"크롤링 실패: {crawl_result.get('error', 'Unknown error')}"
        )

    title = crawl_result.get("title")
    body = crawl_result.get("body")

    if not title or not body:
        return AnalyzeUrlResponse(
            success=False,
            error="기사 제목 또는 본문을 추출할 수 없습니다."
        )

    print(f"[FastAPI] 크롤링 성공: {sanitize_text(title)}")

    # 2. AI 분석 수행
    try:
        llm = global_models["llm"]
        embeddings = global_models["embeddings"]

        # 키워드 추출
        keyword_extractor = NewsKeywordExtractor(embedding_model=embeddings)
        extracted_keywords = keyword_extractor.extract_keywords(html_text=body, n=5, metadata={})
        keywords_for_response = [KeywordScore(word=word, score=score) for word, score in extracted_keywords]
        keyword_list = [item.word for item in keywords_for_response]

        print(f"[FastAPI] 키워드 추출 완료: {keyword_list}")

        # 요약 및 단어 정의
        analyzer = AdvancedArticleAnalyzer(
            article_text=body,
            article_title=title,
            key_words=keyword_list,
            llm=llm,
            embeddings=embeddings,
            db_pool=global_models.get("db_pool"),
            metadata={}
        )

        summary_result, definitions_result = analyzer.summarize_and_define()

        print("[FastAPI] 분석 완료.")

        return AnalyzeUrlResponse(
            success=True,
            title=title,
            body=body,
            summary=summary_result,
            keywords=keywords_for_response,
            definitions=definitions_result,
            image_url=crawl_result.get("image_url"),
            published_at=crawl_result.get("published_at"),
            publisher=crawl_result.get("publisher"),
        )

    except Exception as e:
        print(f"[!!! FastAPI 오류 !!!] 분석 중 오류: {e}")
        import traceback
        traceback.print_exc()
        return AnalyzeUrlResponse(
            success=False,
            title=title,
            body=body,
            error=f"AI 분석 실패: {str(e)}"
        )

# --- 5. Uvicorn 서버 실행 방법 ---
# 실행 명령어 : uvicorn api_main:app --host 127.0.0.1 --port 8020 --reload (--reload 옵션은 개발용)
# uvicorn api_main:app --host 0.0.0.0 --port 8020 --reload 브로드캐스트용