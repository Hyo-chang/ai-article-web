package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.AnalyzeUrlResponse;
import com.team.aiarticle.ai_article_backend.dto.ArticleIngestRequest;
import com.team.aiarticle.ai_article_backend.dto.ArticleListResponse;
import com.team.aiarticle.ai_article_backend.dto.ArticleSummaryResponse;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import com.team.aiarticle.ai_article_backend.service.ArticleServiceV2;
import com.team.aiarticle.ai_article_backend.service.ArticleSummaryService;
import com.team.aiarticle.ai_article_backend.service.RagAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api") // Base path for API endpoints
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class ArticleSummaryController {

    private final ArticleSummaryService articleSummaryService;
    private final ArticleServiceV2 articleServiceV2;
    private final RagAiService ragAiService;
    private final ArticleV2Repository articleV2Repository;

    @GetMapping("/articles")
    public ResponseEntity<List<ArticleListResponse>> getArticles(@RequestParam(name = "limit", defaultValue = "200") int limit) {
        List<ArticleListResponse> articles = articleServiceV2.findAll(limit);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/articles/search")
    public ResponseEntity<List<ArticleListResponse>> searchArticles(
            @RequestParam(name = "q") String query,
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<ArticleListResponse> results = articleServiceV2.searchByKeyword(query.trim(), limit);
        log.info("[SEARCH] query='{}' found {} results", query, results.size());
        return ResponseEntity.ok(results);
    }

    @GetMapping("/article/{id}") // Moved /article to GetMapping
    public ResponseEntity<ArticleSummaryResponse> getArticle(@PathVariable Integer id) {
        return ResponseEntity.ok(articleSummaryService.getArticleWithSummary(id));
    }

    @PostMapping("/articles/v2") // New endpoint for article ingestion
    public ResponseEntity<?> ingestArticle(@RequestBody ArticleIngestRequest ingestRequest) {
        try {
            log.info("[INGEST] 기사 수집 시작: {}", ingestRequest.getTitle());
            ArticleV2 createdArticle = articleServiceV2.createArticle(ingestRequest);
            log.info("[INGEST] 기사 수집 완료: {}", ingestRequest.getTitle());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdArticle);
        } catch (Exception e) {
            log.error("[INGEST] 기사 수집 실패: {} - 오류: {}", ingestRequest.getTitle(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage(), "title", ingestRequest.getTitle()));
        }
    }

    @PostMapping("/articles/analyze")
    public ResponseEntity<?> analyzeArticle(@RequestBody Map<String, String> request) {
        String articleUrl = request.get("articleUrl");
        if (articleUrl == null || articleUrl.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "articleUrl is required"));
        }

        log.info("Analyzing article: {}", articleUrl);

        try {
            // RAG AI 서버로 URL 분석 요청
            AnalyzeUrlResponse ragResponse = ragAiService.requestAnalyzeUrl(articleUrl).block();

            if (ragResponse == null) {
                log.error("RAG AI 서버 응답이 null입니다.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "AI 서버 응답 없음"));
            }

            if (!ragResponse.isSuccess()) {
                log.error("RAG AI 분석 실패: {}", ragResponse.getError());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", ragResponse.getError() != null ? ragResponse.getError() : "분석 실패"));
            }

            // 키워드 목록 추출
            List<String> keywords = ragResponse.getKeywords() != null
                    ? ragResponse.getKeywords().stream().map(AnalyzeUrlResponse.KeywordScore::getWord).collect(Collectors.toList())
                    : List.of();

            // 정의 정렬
            Map<String, String> definitions = ragResponse.getDefinitions() != null
                    ? ArticleSummaryResponse.normalizeDefinitions(ragResponse.getDefinitions(), keywords)
                    : Map.of();

            // ArticleSummaryResponse record 생성
            ArticleSummaryResponse response = new ArticleSummaryResponse(
                    null, // article_id는 DB 저장 안 하므로 null
                    ragResponse.getTitle(),
                    ragResponse.getPublisher(),
                    ragResponse.getSummary(),
                    keywords,
                    definitions
            );

            log.info("Article analyzed successfully: {}", ragResponse.getTitle());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error analyzing article: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
