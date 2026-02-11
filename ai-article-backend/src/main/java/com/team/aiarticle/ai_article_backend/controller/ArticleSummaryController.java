package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.AnalyzeUrlResponse;
import com.team.aiarticle.ai_article_backend.dto.ArticleIngestRequest;
import com.team.aiarticle.ai_article_backend.dto.ArticleListResponse;
import com.team.aiarticle.ai_article_backend.dto.ArticleSummaryResponse;
import com.team.aiarticle.ai_article_backend.dto.UserAnalyzedArticleResponse;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.entity.UserAnalyzedArticle;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import com.team.aiarticle.ai_article_backend.security.services.UserDetailsImpl;
import com.team.aiarticle.ai_article_backend.service.ArticleServiceV2;
import com.team.aiarticle.ai_article_backend.service.ArticleSummaryService;
import com.team.aiarticle.ai_article_backend.service.RagAiService;
import com.team.aiarticle.ai_article_backend.service.UserAnalyzedArticleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class ArticleSummaryController {

    private final ArticleSummaryService articleSummaryService;
    private final ArticleServiceV2 articleServiceV2;
    private final RagAiService ragAiService;
    private final ArticleV2Repository articleV2Repository;
    private final UserAnalyzedArticleService userAnalyzedArticleService;

    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        if (auth.getPrincipal() instanceof UserDetailsImpl details) {
            return details.getUserId();
        }
        return null;
    }

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

        Integer userId = getCurrentUserId();
        log.info("Analyzing article: {} (userId: {})", articleUrl, userId);

        try {
            // RAG AI 서버로 URL 분석 요청
            AnalyzeUrlResponse ragResponse = ragAiService.requestAnalyzeUrl(articleUrl).block();

            if (ragResponse == null) {
                log.error("RAG AI 서버 응답이 null입니다.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "AI 서버 응답 없음"));
            }

            if (!ragResponse.isSuccess()) {
                log.warn("RAG AI 분석 실패 (URL 분석 불가): {}", ragResponse.getError());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", ragResponse.getError() != null ? ragResponse.getError() : "해당 URL을 분석할 수 없습니다."));
            }

            // 로그인한 사용자인 경우 DB에 저장
            Integer savedArticleId = null;
            if (userId != null) {
                try {
                    UserAnalyzedArticle saved = userAnalyzedArticleService.saveAnalyzedArticle(userId, articleUrl, ragResponse);
                    savedArticleId = saved.getId();
                    log.info("분석 결과 저장 완료: id={}", savedArticleId);
                } catch (Exception e) {
                    log.error("분석 결과 저장 실패: {}", e.getMessage());
                }
            }

            // 키워드 목록 추출
            List<String> keywords = ragResponse.getKeywords() != null
                    ? ragResponse.getKeywords().stream().map(AnalyzeUrlResponse.KeywordScore::getWord).collect(Collectors.toList())
                    : List.of();

            // 정의 정렬
            Map<String, String> definitions = ragResponse.getDefinitions() != null
                    ? ArticleSummaryResponse.normalizeDefinitions(ragResponse.getDefinitions(), keywords)
                    : Map.of();

            // 응답에 savedArticleId 포함
            log.info("Article analyzed successfully: {}", ragResponse.getTitle());
            return ResponseEntity.ok(Map.of(
                    "article_id", savedArticleId != null ? savedArticleId : -1,
                    "title", ragResponse.getTitle() != null ? ragResponse.getTitle() : "",
                    "publisher", ragResponse.getPublisher() != null ? ragResponse.getPublisher() : "",
                    "summarize", ragResponse.getSummary() != null ? ragResponse.getSummary() : "",
                    "keywords", keywords,
                    "keywordDefinitions", definitions,
                    "imageUrl", ragResponse.getImageUrl() != null ? ragResponse.getImageUrl() : "",
                    "articleUrl", articleUrl
            ));

        } catch (Exception e) {
            log.error("Error analyzing article: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "알 수 없는 오류가 발생했습니다."));
        }
    }

    // === 내가 분석한 기사 API ===

    @GetMapping("/mypage/analyzed-articles")
    public ResponseEntity<?> getMyAnalyzedArticles() {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "로그인이 필요합니다."));
        }

        List<UserAnalyzedArticleResponse> articles = userAnalyzedArticleService.getMyAnalyzedArticles(userId);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/analyzed-article/{id}")
    public ResponseEntity<?> getAnalyzedArticle(@PathVariable Integer id) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "로그인이 필요합니다."));
        }

        try {
            UserAnalyzedArticleResponse article = userAnalyzedArticleService.getAnalyzedArticle(id, userId);
            return ResponseEntity.ok(article);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/analyzed-article/{id}")
    public ResponseEntity<?> deleteAnalyzedArticle(@PathVariable Integer id) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "로그인이 필요합니다."));
        }

        try {
            userAnalyzedArticleService.deleteAnalyzedArticle(id, userId);
            return ResponseEntity.ok(Map.of("success", true, "message", "삭제되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
