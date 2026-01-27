package com.team.aiarticle.ai_article_backend.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.aiarticle.ai_article_backend.dto.ArticleSummaryResponse;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ArticleSummaryService {

    private final ArticleV2Repository articleV2Repository;
    private final WebClient webClient;
    private final String apiKey;
    private final long apiTimeoutMs;
    private final ObjectMapper objectMapper;

    // 생성자 수정: rag.api.url을 기본 URL로 사용하도록 변경
    public ArticleSummaryService(ArticleV2Repository articleV2Repository,
                                 WebClient.Builder webClientBuilder,
                                 @Value("${rag.api.url}") String aiApiUrl,
                                 @Value("${rag.api.key}") String apiKey,
                                 @Value("${rag.api.timeout:60000}") long apiTimeoutMs,
                                 ObjectMapper objectMapper) {
        this.articleV2Repository = articleV2Repository;
        this.webClient = webClientBuilder.baseUrl(aiApiUrl).build();
        this.apiKey = apiKey;
        this.apiTimeoutMs = apiTimeoutMs;
        this.objectMapper = objectMapper;
    }

    public ArticleSummaryResponse getArticleWithSummary(Integer articleId) {
        ArticleV2 article = articleV2Repository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found: " + articleId));

        // 요약문이 비어있으면 실시간 재분석 실행
        if (!StringUtils.hasText(article.getSummarize())) {
            log.info("기사 ID {}에 대한 요약 정보가 없습니다. AI 실시간 재분석을 시작합니다.", articleId);

            if (!StringUtils.hasText(article.getContent())) {
                log.warn("기사 ID {}의 본문 내용이 없어 AI 분석을 건너뜁니다.", articleId);
            } else {
                try {
                    // AI 서버에 분석 요청
                    AnalyzeResponse response = requestAnalysisToAiServer(article);
                    
                    // 받은 결과로 article 엔티티 업데이트
                    article.setSummarize(response.getSummary());
                    persistKeywords(article, response.getKeywords());
                    persistDefinitions(article, response.getDefinitions());
                    
                    // 업데이트된 내용을 DB에 저장
                    articleV2Repository.save(article);
                    log.info("기사 ID {}에 대한 AI 분석 및 DB 업데이트 완료.", articleId);
                } catch (Exception ex) {
                    log.error("기사 ID {}에 대한 AI 요약 생성 실패: {}", articleId, ex.getMessage());
                    // 실패하더라도 에러를 던지지 않고, 현재까지의 정보로 응답을 구성
                }
            }
        }

        return ArticleSummaryResponse.fromEntity(article);
    }

    private AnalyzeResponse requestAnalysisToAiServer(ArticleV2 article) {
        log.info("AI 서버에 분석 요청 (Article ID: {})", article.getArticleId());

        // 메타데이터 구성
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("category", article.getCategoryCode());
        // 예: DB에 언론사 태그가 저장되는 컬럼이 있다면 추가
        // metadata.put("publisher_tags", article.getPublisherTags());

        AnalyzeRequest requestPayload = new AnalyzeRequest(article.getContent(), article.getTitle(), metadata);

        try {
            Mono<AnalyzeResponse> responseMono = webClient.post()
                    .uri("/analyze") // application.properties에서 설정한 경로
                    .header("x-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(AnalyzeResponse.class);

            AnalyzeResponse response = responseMono.block(Duration.ofMillis(apiTimeoutMs));

            if (response == null || !StringUtils.hasText(response.getSummary())) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 서버로부터 비어있는 요약문을 받았습니다.");
            }
            return response;
        } catch (Exception ex) {
            log.error("AI 서버({}) 호출 실패: {}", webClient, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 서버 호출에 실패했습니다: " + ex.getMessage(), ex);
        }
    }

    private void persistKeywords(ArticleV2 article, List<KeywordScore> keywords) {
        if (keywords != null && !keywords.isEmpty()) {
            try {
                // ArticleV2 엔티티의 'word' 필드는 String이므로, 키워드 목록을 JSON 문자열로 저장
                String keywordsJson = objectMapper.writeValueAsString(keywords);
                article.setWord(keywordsJson);
            } catch (JsonProcessingException e) {
                log.warn("키워드 직렬화 실패 (Article ID: {}): {}", article.getArticleId(), e.getMessage());
            }
        }
    }
    
    private void persistDefinitions(ArticleV2 article, Map<String, String> definitions) {
        if (definitions != null && !definitions.isEmpty()) {
            try {
                article.setDefinition(objectMapper.writeValueAsString(definitions));
            } catch (JsonProcessingException e) {
                log.warn("단어 정의 직렬화 실패 (Article ID: {}): {}", article.getArticleId(), e.getMessage());
            }
        }
    }

    // --- DTO for AI Server Communication ---

    @Getter @Setter
    private static class AnalyzeRequest {
        @JsonProperty("html_content")
        private String htmlContent;
        @JsonProperty("article_title")
        private String articleTitle;
        private Map<String, Object> metadata;

        public AnalyzeRequest(String htmlContent, String articleTitle, Map<String, Object> metadata) {
            this.htmlContent = htmlContent;
            this.articleTitle = articleTitle;
            this.metadata = metadata;
        }
    }

    @Getter @Setter
    @NoArgsConstructor
    public static class AnalyzeResponse {
        private String summary;
        private List<KeywordScore> keywords;
        private Map<String, String> definitions;
    }

    @Getter @Setter
    @NoArgsConstructor
    public static class KeywordScore {
        private String word;
        private double score;
    }
}

