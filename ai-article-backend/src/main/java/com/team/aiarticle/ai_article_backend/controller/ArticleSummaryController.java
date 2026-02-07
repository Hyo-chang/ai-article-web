package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.ArticleIngestRequest;
import com.team.aiarticle.ai_article_backend.dto.ArticleListResponse;
import com.team.aiarticle.ai_article_backend.dto.ArticleSummaryResponse;
import com.team.aiarticle.ai_article_backend.dto.ManualCrawlResponse;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import com.team.aiarticle.ai_article_backend.service.ArticleServiceV2;
import com.team.aiarticle.ai_article_backend.service.ArticleSummaryService;
import com.team.aiarticle.ai_article_backend.service.CrawlingBridgeService;
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

@RestController
@RequestMapping("/api") // Base path for API endpoints
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class ArticleSummaryController {

    private final ArticleSummaryService articleSummaryService;
    private final ArticleServiceV2 articleServiceV2;
    private final CrawlingBridgeService crawlingBridgeService;
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
    public ResponseEntity<ArticleV2> ingestArticle(@RequestBody ArticleIngestRequest ingestRequest) {
        ArticleV2 createdArticle = articleServiceV2.createArticle(ingestRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdArticle);
    }

    @PostMapping("/articles/analyze")
    public ResponseEntity<?> analyzeArticle(@RequestBody Map<String, String> request) {
        String articleUrl = request.get("articleUrl");
        if (articleUrl == null || articleUrl.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "articleUrl is required"));
        }

        log.info("Analyzing article: {}", articleUrl);

        try {
            // Call crawling service to crawl + analyze the article
            ManualCrawlResponse crawlResult = crawlingBridgeService.crawlSingleArticle(articleUrl);

            if (!crawlResult.success()) {
                log.error("Crawling failed with exit code {}: {}", crawlResult.exitCode(), crawlResult.log());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Article analysis failed", "log", crawlResult.log()));
            }

            // Find the article by URL after crawling
            var articleOpt = articleV2Repository.findByArticleUrl(articleUrl);
            if (articleOpt.isPresent()) {
                return ResponseEntity.ok(ArticleSummaryResponse.fromEntity(articleOpt.get()));
            } else {
                log.warn("Article not found after crawling: {}", articleUrl);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Article not found after crawling"));
            }

        } catch (Exception e) {
            log.error("Error analyzing article: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
