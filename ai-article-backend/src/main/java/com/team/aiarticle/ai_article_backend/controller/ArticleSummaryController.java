package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.ArticleSummaryResponse;
import com.team.aiarticle.ai_article_backend.service.ArticleSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/article")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ArticleSummaryController {

    private final ArticleSummaryService articleSummaryService;

    @GetMapping("/{id}")
    public ResponseEntity<ArticleSummaryResponse> getArticle(@PathVariable Integer id) {
        return ResponseEntity.ok(articleSummaryService.getArticleWithSummary(id));
    }
}
