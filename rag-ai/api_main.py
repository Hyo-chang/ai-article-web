import os
import sys
import subprocess
import time
import atexit
import mariadb  # mariadb 임포트 추가
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict
from contextlib import asynccontextmanager
from typing import List, Dict, Any

# 현재 파일의 디렉토리를 시스템 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from ArticleAnalyzer import AdvancedArticleAnalyzer
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

class AnalyzeResponse(BaseModel):
    summary: str
    keywords: List[KeywordScore]
    definitions: Dict[str, str]

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

@app.post("/analyze", response_model=AnalyzeResponse, dependencies=[Depends(verify_api_key)])
async def analyze_article(request: AnalyzeRequest):
    """기사의 HTML 본문을 받아 키워드 추출, 요약, 단어 정의를 모두 수행합니다."""
    print(f"\n--- [FastAPI] '/analyze' 요청 수신 (Title: {request.article_title}) ---")
    try:
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
            definitions=definitions_result
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

# --- 4. Uvicorn 서버 실행 방법 ---
# 실행 명령어 : uvicorn api_main:app --host 127.0.0.1 --port 8020 --reload (--reload 옵션은 개발용)
# uvicorn api_main:app --host 0.0.0.0 --port 8020 --reload 브로드캐스트용