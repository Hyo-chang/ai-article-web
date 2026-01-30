package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.ArticleIngestRequest;
import com.team.aiarticle.ai_article_backend.dto.ArticleSummaryResponse;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.service.ArticleServiceV2;
import com.team.aiarticle.ai_article_backend.service.ArticleSummaryService;
import lombok.RequiredArgsConstructor;
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

@RestController
@RequestMapping("/api") // Base path for API endpoints
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ArticleSummaryController {

    private final ArticleSummaryService articleSummaryService;
    private final ArticleServiceV2 articleServiceV2; // Inject new service

    @GetMapping("/articles")
    public ResponseEntity<List<ArticleV2>> getArticles(@RequestParam(name = "limit", defaultValue = "200") int limit) {
        List<ArticleV2> articles = articleServiceV2.findAll(limit);
        return ResponseEntity.ok(articles);
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
}
