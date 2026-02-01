
import os
from kiwipiepy import Kiwi
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import networkx as nx
import numpy as np
from bs4 import BeautifulSoup
from collections import defaultdict, Counter
import re

class NewsKeywordExtractor:
    """
    메타데이터(HTML 태그)와 임베딩을 활용하여 뉴스 기사에서 키워드를 추출하는 클래스.
    - PositionRank: 단어의 위치(제목, 캡션 등)에 가중치를 부여하여 구조적 중요도 계산.
    - Semantic Similarity: 문서 전체와 단어 간의 의미적 유사도 계산.
    - Hybrid Scoring: 두 점수를 조합하여 최종 키워드 랭킹 산정.
    """

    def __init__(self, embedding_model=None, model_path='BAAI/bge-m3', stopwords=None):
        """
        초기화 메서드. 모델과 형태소 분석기, 불용어를 로드합니다.
        미리 로드된 임베딩 모델을 받거나, model_path를 이용해 새로 로드할 수 있습니다.

        :param embedding_model: 미리 로드된 SentenceTransformer 모델 객체.
        :param model_path: 로드할 모델의 로컬 경로 또는 허깅페이스 모델명 (embedding_model이 없을 경우 사용).
        :param stopwords: 불용어 리스트.
        """
        # Step 0: 초기 설정
        print("Initializing NewsKeywordExtractor...")
        # Kiwi 형태소 분석기 로드
        self.kiwi = Kiwi()
        
        # Sentence Transformer 모델 로드 (효율성 개선)
        if embedding_model:
            self.model = embedding_model
            print("Pre-loaded embedding model is being used.")
        elif model_path:
            # 만약 로컬에 모델을 저장했다면, 'path/to/your/model'과 같이 경로를 지정해주세요.
            self.model = SentenceTransformer(model_path)
            print(f"Embedding model loaded from path: {model_path}")
        else:
            raise ValueError("Either 'embedding_model' or 'model_path' must be provided.")

        # 기본 불용어 설정
        if stopwords:
            self.stopwords = set(stopwords)
        else:
            self.stopwords = {
                '기자', '특파원', '사진', '뉴스', '연합뉴스', '뉴시스', '데일리',
                '오늘', '오후', '오전', '내일', '지난', '올해', '이번',
                '것', '수', '등', '이', '그', '저', '우리', '여기', '저기',
                '위해', '대한', '통해', '따라', '관련', '가운데', '면서',
                '부터', '까지', '정도', '당시', '현재', '한편', '바로'
            }
        print("Initialization complete.")

    def _extract_text_and_weights(self, html_text: str, metadata: dict = None):
        """
        Step 1: HTML에서 텍스트를 추출하고 위치 및 메타데이터에 따라 가중치를 부여합니다.

        :param html_text: 분석할 뉴스 기사의 원본 HTML 문자열.
        :param metadata: 'publisher_tags' 등을 포함할 수 있는 메타데이터 딕셔너리.
        :return: (전체 텍스트, 단어별 가중치 dict)
        """
        if metadata is None:
            metadata = {}
        soup = BeautifulSoup(html_text, 'html.parser')
        
        word_weights = defaultdict(lambda: 1.0)

        # 0. 언론사 제공 키워드 (Publisher's Tags) - 가중치 6.0 (가장 높음)
        publisher_tags = metadata.get('publisher_tags', [])
        if publisher_tags:
            print(f"언론사 제공 키워드 가중치 부여: {publisher_tags}")
            for tag in publisher_tags:
                for word in self._tokenize_text(tag):
                    word_weights[word] = max(word_weights[word], 6.0)
        
        # 1. 제목 (Title) - 가중치 5.0
        title_text = ''
        if soup.title:
            title_text = soup.title.get_text(strip=True)
            for word in self._tokenize_text(title_text):
                word_weights[word] = max(word_weights[word], 5.0)

        # 2. 이미지 캡션 (img_desc, figcaption) - 가중치 3.0
        caption_text = ''
        for tag in soup.find_all(['.img_desc', 'figcaption']):
            text = tag.get_text(strip=True)
            caption_text += text + ' '
            for word in self._tokenize_text(text):
                word_weights[word] = max(word_weights[word], 3.0)

        # 3. 강조 구문 (b, strong) - 가중치 2.0
        strong_text = ''
        for tag in soup.find_all(['b', 'strong']):
            text = tag.get_text(strip=True)
            strong_text += text + ' '
            for word in self._tokenize_text(text):
                 word_weights[word] = max(word_weights[word], 2.0)
        
        # 본문 추출 (script, style, ad 등 불필요한 태그 제거)
        for tag in soup(['script', 'style', 'header', 'footer', 'nav', 'aside', 'form']):
            tag.decompose()
        
        body_text = soup.get_text(separator='\n', strip=True)

        # 4. 첫 문단 (Lead Context) - 가중치 2.0
        first_paragraph = body_text.split('\n')[0] if body_text else ''
        for word in self._tokenize_text(first_paragraph):
            word_weights[word] = max(word_weights[word], 2.0)
            
        # 전체 텍스트 조합
        full_text = ' '.join(re.split(r'\s+', f"{title_text} {caption_text} {strong_text} {body_text}"))
        
        return full_text, dict(word_weights)
        
    def _tokenize_text(self, text: str):
        """ 보조 메서드: 텍스트를 형태소 분석하여 단어 리스트 반환 """
        return [token.form for token in self.kiwi.tokenize(text)]


    def _get_candidate_words(self, text: str):
        """
        Step 2: Kiwi 형태소 분석 및 후보군 추출 (명사, 어근).

        :param text: 분석할 전체 텍스트.
        :return: (토큰화된 문장 리스트, 후보 단어 set)
        """
        # 신조어 자동 등록
        self.kiwi.extract_add_words(text, min_cnt=2, max_word_len=10)

        sentences = text.split('.') # 간단한 문장 분리
        
        candidate_tokens = []
        tokenized_sentences = []

        for sentence in sentences:
            if not sentence.strip():
                continue
            
            tokens = self.kiwi.tokenize(sentence)
            sentence_words = []
            for token in tokens:
                # 명사(NNG, NNP), 어근(XR) 추출, 한 글자 단어 및 불용어 제외
                if token.tag in ['NNG', 'NNP', 'XR'] and len(token.form) > 1 and token.form not in self.stopwords:
                    candidate_tokens.append(token.form)
                    sentence_words.append(token.form)
            if sentence_words:
                tokenized_sentences.append(sentence_words)

        return tokenized_sentences, set(candidate_tokens)

    def _calculate_structural_score(self, tokenized_sentences: list, word_weights: dict, candidates: set, window: int = 5):
        """
        Step 3: Advanced PositionRank로 구조적 중요도 계산.

        :param tokenized_sentences: 토큰화된 문장 리스트.
        :param word_weights: 단어별 위치 가중치.
        :param candidates: 후보 단어 set.
        :param window: 동시 등장(co-occurrence)을 계산할 윈도우 크기.
        :return: 단어별 PageRank 점수 dict.
        """
        graph = nx.Graph()
        graph.add_nodes_from(candidates)
        
        for sentence in tokenized_sentences:
            for i in range(len(sentence)):
                for j in range(i + 1, min(i + window, len(sentence))):
                    w1, w2 = sentence[i], sentence[j]
                    if w1 in candidates and w2 in candidates:
                        graph.add_edge(w1, w2)
        
        # Position Weight를 PageRank의 personalization 파라미터로 사용
        personalization = {word: word_weights.get(word, 1.0) for word in candidates}
        
        # PageRank 계산
        try:
            pagerank_scores = nx.pagerank(graph, personalization=personalization)
            return pagerank_scores
        except nx.PowerIterationFailedConvergence:
            # 그래프가 너무 작거나 연결되지 않은 경우 기본 점수 반환
            return {word: 1.0 for word in candidates}


    def _calculate_semantic_score(self, text: str, candidates: list):
        """
        Step 4: Embedding으로 의미적 중요도(문서-단어 간 유사도) 계산.
        """
        if not candidates:
            return {}

        # HuggingFaceEmbeddings의 embed_query/embed_documents 메서드 사용
        doc_embedding = self.model.embed_query(text)
        candidate_embeddings = self.model.embed_documents(candidates)

        # 코사인 유사도 계산 (sklearn 사용)
        doc_embedding_reshaped = np.array(doc_embedding).reshape(1, -1)
        cosine_scores = cosine_similarity(doc_embedding_reshaped, candidate_embeddings)

        semantic_scores = {candidates[i]: cosine_scores[0][i] for i in range(len(candidates))}
        return semantic_scores

    @staticmethod
    def _normalize_scores(scores: dict):
        """점수를 0과 1 사이로 정규화합니다."""
        if not scores or max(scores.values()) == min(scores.values()):
            return {k: 0.5 for k in scores} # 모든 값이 같을 경우 중간값으로 처리
        
        max_val = max(scores.values())
        min_val = min(scores.values())
        
        return {k: (v - min_val) / (max_val - min_val) for k, v in scores.items()}

    def extract_keywords(self, html_text: str, n: int = 10, metadata: dict = None, struct_weight: float = 0.4, semantic_weight: float = 0.6):
        """
        HTML 텍스트에서 최종 키워드를 추출합니다.

        :param html_text: 뉴스 기사 HTML 문자열.
        :param n: 추출할 키워드 개수.
        :param metadata: 'publisher_tags' 등을 포함할 수 있는 메타데이터 딕셔너리.
        :param struct_weight: 구조적 점수 가중치.
        :param semantic_weight: 의미론적 점수 가중치.
        :return: 상위 n개의 키워드 리스트 ( (키워드, 최종 점수) 튜플 형태 ).
        """
        # Step 1: HTML 파싱 및 위치 가중치 계산
        full_text, word_weights = self._extract_text_and_weights(html_text, metadata)
        
        # Step 2: 형태소 분석 및 후보 키워드 추출
        tokenized_sentences, candidate_set = self._get_candidate_words(full_text)
        
        if not candidate_set:
            return []
            
        candidates = list(candidate_set)

        # Step 3: 구조적 중요도 계산 (PositionRank)
        structural_scores = self._calculate_structural_score(tokenized_sentences, word_weights, candidate_set)
        
        # Step 4: 의미적 중요도 계산 (Embedding Similarity)
        semantic_scores = self._calculate_semantic_score(full_text, candidates)
        
        # 정규화
        norm_structural_scores = self._normalize_scores(structural_scores)
        norm_semantic_scores = self._normalize_scores(semantic_scores)
        
        # Step 5: 최종 점수 산출
        final_scores = {}
        for word in candidates:
            struct_score = norm_structural_scores.get(word, 0)
            semantic_score = norm_semantic_scores.get(word, 0)
            final_scores[word] = (struct_score * struct_weight) + (semantic_score * semantic_weight)
            
        # 점수가 높은 순으로 정렬
        sorted_keywords = sorted(final_scores.items(), key=lambda item: item[1], reverse=True)

        # 중복/유사 키워드 필터링
        filtered_keywords = self._filter_similar_keywords(sorted_keywords)

        return filtered_keywords[:n]

    def _filter_similar_keywords(self, sorted_keywords: list) -> list:
        """
        부분 문자열 관계 또는 유사한 키워드를 필터링합니다.
        예: (공급, 공급망) → 공급망만 유지
            (하이닉스, SK하이닉스) → SK하이닉스만 유지
        """
        if not sorted_keywords:
            return []

        filtered = []
        used_words = set()

        for word, score in sorted_keywords:
            # 이미 더 긴 키워드에 포함된 경우 스킵
            is_substring = False
            for used_word in used_words:
                # 현재 단어가 이미 선택된 단어에 포함되어 있으면 스킵
                if word in used_word and word != used_word:
                    is_substring = True
                    break

            if is_substring:
                continue

            # 현재 단어가 더 긴 경우, 이미 선택된 짧은 단어 제거
            to_remove = []
            for used_word in used_words:
                if used_word in word and used_word != word:
                    to_remove.append(used_word)

            for remove_word in to_remove:
                used_words.discard(remove_word)
                filtered = [(w, s) for w, s in filtered if w != remove_word]

            filtered.append((word, score))
            used_words.add(word)

        return filtered

# ==============================================================================
# 사용 예시 (if __name__ == "__main__")
# ==============================================================================
if __name__ == '__main__':
    print("Executing keyword extraction example...")

    # 가상의 HTML 뉴스 데이터
    sample_html = """
    <html>
    <head>
        <title>차세대 AI '겜보(Gembo)', 인간처럼 대화하는 데 성공</title>
    </head>
    <body>
        <p><strong>인공지능(AI) 챗봇 '겜보'가 드디어 인간과 거의 흡사한 수준의 대화를 나누는 데 성공했다.</strong> 
        이는 기존의 AI 모델을 뛰어넘는 혁신적인 성과로 평가된다.</p>
        
        <p>겜보(Gembo)는 최신 '하이브리드 아키텍처'를 기반으로 개발되었으며, 
        문맥 이해 능력과 장기 기억 능력이 획기적으로 향상되었다. 
        특히, 복잡한 농담이나 비유적인 표현까지 이해하는 모습을 보여주었다. 
        이번 겜보의 성공은 단순 정보 검색을 넘어, 진정한 의미의 'AI 비서' 시대를 열 것으로 기대된다. 
        <b>새로운 AI 비서 시대가 온다.</b></p>
        
        <figure>
            <img src="gembo_ai.jpg" alt="AI 겜보가 대화하는 모습">
            <figcaption>사진 설명: 차세대 AI 겜보가 사용자와 자연스럽게 대화하고 있다. 
            이 인공지능 챗봇 기술은 우리 삶을 바꿀 것이다.</figcaption>
        </figure>
        
        <p>개발팀은 "겜보는 단순한 챗봇이 아닙니다. 이것은 새로운 시작입니다."라며, 
        "앞으로 겜보 기술을 다양한 산업 분야에 적용할 계획"이라고 밝혔다. 
        김연구 수석연구원은 "하이브리드 아키텍처의 가능성은 무한하다"고 덧붙였다.
        (자료=겜보 AI 연구소 제공)</p>
        
        <p>정리=홍길동 기자</p>
    </body>
    </html>
    """

    # --- 키워드 추출기 실행 ---
    # 실제 사용 시에는 BAAI/bge-m3 모델이 로컬에 다운로드 되어 있어야 빠릅니다.
    # 혹은 인터넷 연결이 필요합니다.
    # 로컬 경로 예시: extractor = NewsKeywordExtractor(model_path='./models/bge-m3')
    try:
        # 모델 경로를 지정하지 않으면 허깅페이스에서 다운로드합니다.
        # 로컬에 'BAAI/bge-m3' 모델이 캐시되어 있으면 빠르게 로드됩니다.
        extractor = NewsKeywordExtractor()
        
        print("\n--- Sample HTML ---")
        print(sample_html)
        
        print("\n--- Extracting Keywords ---")
        top_keywords = extractor.extract_keywords(sample_html, n=5)
        
        print("\n--- Top 5 Keywords ---")
        if top_keywords:
            for i, (keyword, score) in enumerate(top_keywords):
                print(f"{i+1}. {keyword} (Score: {score:.4f})")
        else:
            print("No keywords were extracted.")

    except Exception as e:
        print(f"\nAn error occurred during execution: {e}")
        print("Please ensure that 'sentence-transformers', 'kiwipiepy', 'networkx', 'numpy', and 'beautifulsoup4' are installed.")
        print("Also, check your internet connection for model download or provide a local model path.")

