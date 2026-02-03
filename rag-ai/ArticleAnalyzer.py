# --- 모듈 임포트 ---
import os
import re
import json
import urllib.request
import urllib.parse
import concurrent.futures
import numpy as np
from bs4 import BeautifulSoup

from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_ollama.chat_models import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_classic.chains.summarize import load_summarize_chain

import mariadb

# --- API 키 설정 (로컬 런타임 .env) ---
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)
# .env 파일 로드 확인
if os.getenv("GEMINI_API_KEY") is None:
    print("[경고] .env 파일에 'GEMINI_API_KEY'가 설정되지 않았습니다.")

if not os.getenv("NAVER_CLIENT_ID") or not os.getenv("NAVER_CLIENT_PASSWD"):
    print("[경고] .env 파일에서 NAVER_CLIENT_ID 또는 NAVER_CLIENT_PASSWD 를 찾을 수 없습니다.")
    print("로컬 런타임이 시작된 PC 폴더에 .env 파일이 있는지 확인하세요.")


# ===============================================================================================

def sanitize_text(text: str) -> str:
    """특수문자를 일반 문자로 변환 (cp949 인코딩 오류 방지)"""
    if not text:
        return text
    replacements = {
        '\u2013': '-',   # en-dash → hyphen
        '\u2014': '-',   # em-dash → hyphen
        '\u2022': '-',   # bullet → hyphen
        '\u2018': "'",   # left single quote
        '\u2019': "'",   # right single quote
        '\u201c': '"',   # left double quote
        '\u201d': '"',   # right double quote
        '\u2026': '...', # ellipsis
        '\u22ef': '...', # midline horizontal ellipsis (⋯)
        '\u00b7': '-',   # middle dot
        '\u2010': '-',   # hyphen
        '\u2011': '-',   # non-breaking hyphen
        '\u2012': '-',   # figure dash
        '\u2015': '-',   # horizontal bar
        '\u200b': '',    # zero-width space (삭제)
        '\u200c': '',    # zero-width non-joiner (삭제)
        '\u200d': '',    # zero-width joiner (삭제)
        '\ufeff': '',    # BOM (삭제)
        '\xa0': ' ',     # non-breaking space → space
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

class AdvancedArticleAnalyzer:
    SIMILARITY_THRESHOLD = 0.75  # 유사도 점수 임계값(코사인 유사도는 1.0에 가까울 수록 유사하다)
    SIMILARITY_HIGH_THRESHOLD = 0.60  # 유사도 상위 임계값
    SIMILARITY_LOW_THRESHOLD = 0.45  # 유사도 하위 임계값

    # 생성자 / 백서버에 요청할 데이터 (기사제목, 기사원문, 핵심 단어 리스트, 기사 카테고리 번호)
    def __init__(self, article_text, article_title, key_words, llm, embeddings, db_pool, metadata=None):
        # 클래스가 생성될 때 기사 텍스트와 영구 단어 DB 경로를 받아 모든 RAG 파이프라인을 준비
        print("고오급 기사 분석기를 초기화합니다...")
        self.llm = llm
        self.embeddings = embeddings
        self.article_title = article_title  # 기사 제목 / text
        self.key_words = key_words  # 백엔드 제공 핵심 키워드 / list 형태
        self.metadata = metadata if metadata is not None else {} # 메타데이터 저장
        self.db_pool = db_pool # 외부에서 DB 커넥션 풀 주입받기

        # 기사 텍스트 처리 (가상DB용)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        self.docs = text_splitter.create_documents([article_text])

        # 기사 가상 벡터 DB생성 (메모리에서만 사용)
        self.article_db = Chroma.from_documents(documents=self.docs, embedding=self.embeddings,
                                                collection_metadata={"hnsw:space": "cosine"})
        self.retriever = self.article_db.as_retriever(search_kwargs={"k": 5})
        print("기사 분석준비 완료")


    # =====================================================================================================
    # [API 데이터 전처리] =================================================================================
    def clean_api_text(self, definition):
        # HTML 태그 제거
        soup = BeautifulSoup(definition, 'html.parser')
        cleaned_text = soup.get_text()

        # 한자 제거 (공백 한 칸으로 치환)
        cleaned_text = re.sub(r'[\u4e00-\u9fff]+', ' ', cleaned_text)

        # 빈 괄호 제거
        cleaned_text = re.sub(r'\(\s*\)', '', cleaned_text)

        # 문장 부호 앞의 불필요한 공백 제거
        cleaned_text = re.sub(r'\s+([.,?!])', r'\1', cleaned_text)

        # 연속된 공백/줄바꿈을 공백 한 칸으로 변경 및 양쪽 끝 공백 제거
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

        return cleaned_text

    # =====================================================================================================
    # [네이버 API 호출] ===================================================================================
    def _search_naver_api(self, word):
        client_id = os.getenv("NAVER_CLIENT_ID")
        client_secret = os.getenv("NAVER_CLIENT_PASSWD")
        if not client_id or not client_secret:
            print("네이버 API ID/PASSWD가 설정되지 않아 2차 검색을 실행할 수 없습니다.")
            return []

        try:
            encText = urllib.parse.quote(word)
            url = "https://openapi.naver.com/v1/search/encyc.json?query=" + encText
            request = urllib.request.Request(url)
            request.add_header("X-Naver-Client-Id", client_id)
            request.add_header("X-Naver-Client-Secret", client_secret)
            response = urllib.request.urlopen(request, timeout=30)
            rescode = response.getcode()

            definitions_list = []
            if rescode == 200:
                response_body = response.read()
                search_result = json.loads(response_body.decode('utf-8'))

                if search_result['items']:
                    for item in search_result['items']:
                        definition = self.clean_api_text(item['description'])
                        definition = sanitize_text(definition)  # 특수문자 제거
                        definitions_list.append(definition)
            else:
                print(f"네이버 API 에러 코드: {rescode}")
            return definitions_list

        except Exception as e:
            print(f"네이버 API 호출 중 오류 발생: {e}")
            return []

    # =====================================================================================================
    # [문맥에 맞는 단어인지 확인] =========================================================================
    def _calculate_similarity_score(self, word, definition):
        # (헬퍼) 주어진 정의와 기사 문맥 간의 유사도 점수를 계산
        try:
            retriever_query = f"'{word}' ({definition})"
            context_docs = self.retriever.invoke(retriever_query)
            if not context_docs:
                return 0.0

            context_text = "\n".join([doc.page_content for doc in context_docs])
            context_embedding = self.embeddings.embed_query(context_text)
            definition_embedding = self.embeddings.embed_query(definition)

            similarity = np.dot(context_embedding, definition_embedding) / (
                    np.linalg.norm(context_embedding) * np.linalg.norm(definition_embedding))
            return similarity
        except Exception as e:
            print(f"[오류] 유사도 점수 계산 중 오류 발생: {e}")
            return 0.0

    def _validate_with_llm(self, word, definition):
        # (헬퍼) LLM을 사용하여 주어진 정의가 기사 문맥에 맞는지 직접 검증
        print(f"[{word} - LLM 문맥 검증 시작] 정의: {definition[:30]}...")
        try:
            retriever_query = f"'{word}' ({definition})"
            context_docs = self.retriever.invoke(retriever_query)
            context_text_for_llm = "\n".join([doc.page_content for doc in context_docs]) if context_docs else ""

            if not context_text_for_llm:
                print("관련 문맥을 찾을 수 없어 검증을 건너뜁니다.")
                return False

            # 메타데이터를 활용하여 프롬프트 강화
            category = self.metadata.get('category')
            metadata_prompt_part = f"참고로 이 기사의 카테고리는 '{category}'입니다.\n" if category else ""

            template = ("{metadata_context}"
                        "Context: {context}\n"
                        "Definition: {definition}\n"
                        "Word: {word}\n\n"
                        "Context에 언급된 Word가 Definition에 설명된 그 대상(의미)을 지칭하는 것이 맞습니까? "
                        "예를 들어, Context의 '사과'가 '과일 사과'를 의미하는지, '사과(apology)'를 의미하는지 판단하는 것입니다. "
                        "오직 'Yes' 또는 'NO'로만 대답해주세요.")
            
            prompt = PromptTemplate.from_template(template)
            chain = prompt | self.llm | StrOutputParser()
            result = chain.invoke({
                "metadata_context": metadata_prompt_part,
                "context": context_text_for_llm, 
                "definition": definition, 
                "word": word
            })

            print(f"LLM 검증 결과: {result}")
            return "yes" in result.lower()
        except Exception as e:
            print(f"[오류] LLM 검증 중 오류 발생: {e}")
            return False

    def _refine_definition_with_llm(self, word, messy_definition):
        # (헬퍼) LLM을 사용하여 지저분한 정의를 깔끔한 한 문장으로 정제
        print(f"[{word} - 정의 정제 시작] 원본: {messy_definition[:30]}...")
        try:
            template = """당신은 사전 편집자입니다. 다음은 '{word}'라는 단어에 대한 정리되지 않은 설명입니다.
이 설명을 명확하고 간결한 한 문장의 사전적 정의로 다시 작성해주세요.

**중요한 출력 규칙:**
- 반드시 "{word}은(는) ~입니다." 또는 "{word}은(는) ~을(를) 말한다." 형식으로 시작하세요.
- **굵은 글씨**, 따옴표, "정제된 정의:" 같은 접두사를 절대 사용하지 마세요.
- 오직 정의 문장 하나만 출력하세요.

--- 예시 ---
단어: 하사
정리되지 않은 설명: 부사관 계급의 하나 중사의 아래 병장의 위로 부사관 계급에서 가장 낮은 계급이다 대한 제국 때에 특무정교 정교 부교 참교에 해당하던 무관
출력: 하사는 부사관 계급 중 중사 아래에 위치하며 군대 내에서 초급 부사관 역할을 담당하는 계급이다.

단어: 공급망
정리되지 않은 설명: 제품이나 서비스가 공급자로부터 소비자에게 전달되는 전 과정에 걸친 시스템 원자재 조달 생산 유통 판매 등 모든 단계를 포함
출력: 공급망은 원자재 조달부터 생산, 유통, 판매까지 제품이 소비자에게 전달되는 전체 과정을 아우르는 시스템이다.
---

단어: {word}
정리되지 않은 설명: {messy_definition}
출력:"""
            prompt = PromptTemplate.from_template(template)
            chain = prompt | self.llm | StrOutputParser()
            refined_definition = chain.invoke({"word": word, "messy_definition": messy_definition})

            # 후처리: LLM이 불필요한 앞뒤 텍스트를 붙이는 경우 제거
            refined_definition = refined_definition.strip()

            # 불필요한 접두사 제거 패턴들
            prefixes_to_remove = [
                "정제된 한 문장 정의:",
                "정제된 정의:",
                "출력:",
                "답변:",
                "정의:",
            ]
            for prefix in prefixes_to_remove:
                if refined_definition.startswith(prefix):
                    refined_definition = refined_definition[len(prefix):].strip()

            # 마크다운 볼드(**) 제거
            refined_definition = re.sub(r'\*\*([^*]+)\*\*', r'\1', refined_definition)

            # 앞뒤 따옴표 제거
            refined_definition = refined_definition.strip('"\'')

            # 특수문자 정리 (cp949 인코딩 오류 방지)
            refined_definition = sanitize_text(refined_definition)

            print(f"정의 정제 완료: {refined_definition[:50]}...")
            return refined_definition
        except Exception as e:
            print(f"[오류] LLM 정의 정제 중 오류 발생: {e}")
            return messy_definition # 실패 시 원본 반환

    # =====================================================================================================
    # [문맥에 맞는 의미 생성 RAG] ============================================================================
    def _define_word_via_rag(self, word):
        # (내부 헬퍼) 기사 DB에 대해 RAG를 실행하여 단어의 문맥적 의미를 생성

        template = """Context: {context}
                      Question: {question}
                      위 Context 내용을 바탕으로 Question에 대한 답변을 한국어로 명확하고 간결하게 의미(정의:definition)만 출력해줘.
                      만약 이 단어가 Context 내에서 여러 가지 의미로 사용되었다면, 각 의미를 번호(예: 1., 2., ...)로 구분하여 모두 나열해줘.

                      =========[응답 예시]=====================
                      선박이나 선유, 기름 등을 싣고 이동하는 수단
                      ===================================
                      """

        prompt = PromptTemplate.from_template(template)
        rag_chain = (
                {"context": self.retriever, "question": RunnablePassthrough()}
                | prompt
                | self.llm
                | StrOutputParser()
        )
        question = f"이 글에서 '{word}'는(은) 어떤 의미로 사용 되었어?"
        raw_answer = rag_chain.invoke(question)

        definitions_list = []

        # LLM이 생성한 번호 매기기(1., 2.)를 기준으로 분리
        potential_meanings = re.split(r'\n?\d+\.\s*', raw_answer)

        for meaning in potential_meanings:
            cleaned_meaning = sanitize_text(meaning.strip().rstrip('.'))
            if cleaned_meaning:  # 빈 문자열이 아니면 추가
                definitions_list.append(cleaned_meaning)

        # 번호 매기기 없이 단일 답변이 온 경우
        if not definitions_list and raw_answer.strip():
            definitions_list = [raw_answer.strip()]

        return definitions_list

    # =====================================================================================================
    # [RDBMS (MariaDB)] ===================================================================================
    def _search_mariadb(self, word):
        if not self.db_pool:
            print("[오류] DB 커넥션 풀이 없어 검색을 실행할 수 없습니다.")
            return []

        conn = None
        try:
            # 풀에서 유휴 상태의 연결을 가져옴
            conn = self.db_pool.get_connection()
            cur = conn.cursor()
            query = "SELECT definition FROM word_definition WHERE word = ?"
            cur.execute(query, (word,))
            results = [row[0] for row in cur.fetchall()]
            print(f"MariaDB에서 '{word}' 검색 완료. {len(results)}개 결과.")
            return results
        except mariadb.Error as e:
            print(f"[오류] MariaDB 검색 실패: {e}")
            return [] # 실패 시 빈 리스트 반환하여 다음 단계로 넘어갈 수 있도록 함
        finally:
            # 연결을 종료하는 대신 풀에 반납
            if conn:
                conn.close()

    # =====================================================================================================
    # [(헬퍼) 2/3단계 단어 의미 자가학습] =====================================================================
    def _add_definition_to_mariadb(self, word, definition):
        if not self.db_pool:
            print("[오류] DB 커넥션 풀이 없어 저장을 실행할 수 없습니다.")
            return

        print(f"[DB 업데이트] MariaDB에 '{word}'의 의미 추가 중...")
        conn = None
        try:
            conn = self.db_pool.get_connection()
            cur = conn.cursor()
            # 중복 방지를 위해 INSERT IGNORE 사용 또는 SELECT 후 INSERT
            query = "INSERT INTO word_definition (word, definition) VALUES (?, ?)"
            cur.execute(query, (word, definition))
            conn.commit()
            print("[DB 업데이트] MariaDB 저장 완료.")
        except mariadb.IntegrityError:
            print(f"[DB 정보] '{word}':'{definition[:20]}...'는 이미 DB에 존재합니다.")
        except mariadb.Error as e:
            print(f"[오류] MariaDB 저장(INSERT) 실패: {e}")
        except Exception as e:
            print(f"[오류] DB 작업 중 예외 발생: {e}")
        finally:
            if conn:
                conn.close()

    # =====================================================================================================
    # [(핵심) 3단계 단어 의미 검색 & 자가학습] ============================================================
    def define_word(self, word):
        print(f"--- '{word}'의 의미 분석 시작 ---")
        
        # [1차 검색] 영구 단어 의미 DB (MariaDB)
        try:
            potential_definitions = self._search_mariadb(word)
            if potential_definitions:
                scored_definitions = sorted(
                    [{"definition": d, "score": self._calculate_similarity_score(word, d)} for d in potential_definitions],
                    key=lambda x: x['score'],
                    reverse=True
                )
                print(f"1차 DB 검색: {len(scored_definitions)}개의 후보 점수 계산 완료.")
                
                for item in scored_definitions:
                    if self._validate_with_llm(word, item['definition']):
                        print(f"LLM 검증 통과. 최종 의미로 선택: {item['definition'][:30]}...")
                        return self._refine_definition_with_llm(word, item['definition'])
                
                print("1차 검색의 모든 후보가 LLM 검증에 실패했습니다.")
            else:
                print("1차 검색(MariaDB) 결과, 해당되는 정의가 없습니다.")
        except Exception as e:
            print(f"[오류] 1차 DB 검색(MariaDB) 중 오류 발생: {e}")

        # [2차 검색] 네이버 백과사전 API
        print("\n[2차 검색] 네이버 백과사전 API에서 검색 중...")
        naver_definitions = self._search_naver_api(word)
        if naver_definitions:
            print(f"2차 검색 결과: 총 {len(naver_definitions)}개의 후보 찾음.")
            for definition in naver_definitions:
                if self._validate_with_llm(word, definition):
                    print("네이버 API 검색 결과가 문맥에 적합함.")
                    refined_def = self._refine_definition_with_llm(word, definition)
                    print("[DB 자가학습] 새로운 의미를 DB에 추가합니다.")
                    self._add_definition_to_mariadb(word, refined_def)
                    return refined_def
            print("2차 검색의 모든 후보가 LLM 검증에 실패했습니다.")
        else:
            print("네이버 API 검색 결과가 없거나 현재 문맥과 일치하지 않음.")

        # [3차 검색] 기사 내 RAG로 의미 분석
        print("\n[3차 검색] 기사 내 RAG 분석 시작")
        rag_definitions = self._define_word_via_rag(word)
        if rag_definitions:
            print(f"3차 검색 결과: 총 {len(rag_definitions)}개의 의미 발견")
            # RAG 결과는 이미 문맥에 맞는 것으로 간주하고, 첫 번째 결과를 사용
            # 여러 개일 경우, 가장 적절한 것을 고르기 위한 추가 로직을 넣을 수 있음
            final_definition = rag_definitions[0]
            
            # RAG 결과도 정제가 필요할 수 있음
            refined_def = self._refine_definition_with_llm(word, final_definition)
            
            print("[DB 자가학습] 새로운 의미를 DB에 추가합니다.")
            self._add_definition_to_mariadb(word, refined_def)
            return refined_def

        print("3차 검색(RAG) 실패: 기사 내에서 의미를 찾을 수 없습니다.")
        return f"'{word}'의 의미를 찾을 수 없습니다."

    # =====================================================================================================
    # [(핵심)기사 요약 및 단어 정의] ======================================================================
    def summarize_and_define(self):
        print("RAG 강화 요약 체인 실행 (제목 + 전문용어 정의)")

        definitions_dict = {}
        definitions_preamble = ""

        if self.key_words:
            print(f"전문 용어 DB에서 키워드 {self.key_words}의 의미를 순차적으로 검색합니다.")
            
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future_to_keyword = {executor.submit(self.define_word, keyword): keyword for keyword in self.key_words}
                
                for future in concurrent.futures.as_completed(future_to_keyword):
                    keyword = future_to_keyword[future]
                    try:
                        definition = future.result()
                        definitions_dict[keyword] = definition
                    except Exception as exc:
                        error_msg = sanitize_text(str(exc))
                        print(f"'{keyword}'의 정의 생성 중 오류 발생: {error_msg}")
                        definitions_dict[keyword] = f"오류 발생: {error_msg}"
            
            # 요약 프롬프트에 사용할 정의 문자열 생성
            valid_definitions = [f"{kw}: {df}" for kw, df in definitions_dict.items() if df and "찾을 수 없습니다" not in df and "오류 발생" not in df]
            if valid_definitions:
                definitions_preamble = "[핵심 용어 정의]\n" + "\n".join(sorted(valid_definitions))
                print(f"요약 프롬프트에 다음 정의를 추가합니다:\n{definitions_preamble}\n")
        else:
            print("키워드가 제공되지 않아, 기본 요약을 실행합니다.")

        prompt_template = """
        [기사 제목]: {title}

        {definitions}

        [기사 원문 전체]:
        {text}

        [지시]:
        당신은 전문 뉴스 편집자입니다.
        위 [기사 제목]을 기준으로, 필요시 [핵심 용어 정의]를 참고하여,
        [기사 원문 전체]의 핵심 내용을 아래 형식으로 요약해 주십시오.

        **출력 형식 (반드시 준수):**
        **핵심 내용 요약:**
        1. **[핵심 키워드]**: 해당 내용에 대한 간결한 설명 (1-2문장)
        2. **[핵심 키워드]**: 해당 내용에 대한 간결한 설명 (1-2문장)
        3. **[핵심 키워드]**: 해당 내용에 대한 간결한 설명 (1-2문장)

        핵심 내용 요약:
        """
        prompt = PromptTemplate.from_template(prompt_template)

        summary_chain = load_summarize_chain(self.llm, chain_type="stuff", prompt=prompt)

        summary_result = summary_chain.invoke({
            "input_documents": self.docs,
            "title": self.article_title,
            "definitions": definitions_preamble
        })
        
        summary_text = summary_result.get('output_text', '요약 생성에 실패했습니다.')

        # 모든 정의에 특수문자 정리 적용
        sanitized_definitions = {k: sanitize_text(v) for k, v in definitions_dict.items()}

        return summary_text, sanitized_definitions

# --- 메인 실행 블록 ---
if __name__ == "__main__":
    # ... (실행 블록은 수정하지 않음)
    pass
