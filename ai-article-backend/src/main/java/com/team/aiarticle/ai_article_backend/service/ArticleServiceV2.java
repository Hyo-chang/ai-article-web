package com.team.aiarticle.ai_article_backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.aiarticle.ai_article_backend.dto.ArticleIngestRequest;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.entity.CategoryDictV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class ArticleServiceV2 {

    private final ArticleV2Repository articleV2Repository;
    private final AiApiService aiApiService;
    private final CategoryService categoryService; // Inject CategoryService
    private final ObjectMapper objectMapper; // For converting map to JSON string

    public ArticleServiceV2(ArticleV2Repository articleV2Repository, AiApiService aiApiService, ObjectMapper objectMapper, CategoryService categoryService) {
        this.articleV2Repository = articleV2Repository;
        this.aiApiService = aiApiService;
        this.objectMapper = objectMapper;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    public List<ArticleV2> findAll(int limit) {
        return articleV2Repository.findAllByOrderByArticleIdDesc(PageRequest.of(0, limit));
    }

    @Transactional
    public ArticleV2 createArticle(ArticleIngestRequest request) {
        System.out.println("--- 기사 생성 및 AI 분석 시작 ---");
        String articleUrl = request.getArticleUrl();
        if (articleUrl == null || articleUrl.isBlank()) {
            throw new IllegalArgumentException("Article URL cannot be null or empty for ArticleIngestRequest");
        }

        // 1. Fetch available categories for classification
        List<CategoryDictV2> availableCategories = categoryService.findAll();
        List<String> categoryNames = availableCategories.stream()
                                                        .map(CategoryDictV2::getCategoryName)
                                                        .collect(Collectors.toList());

        // 2. Call AI service for summary, keywords, and category
        System.out.println("AI 서버에 분석을 요청합니다...");
        AiApiService.AnalyzeResponse analyzeResponse = aiApiService.analyzeArticle(
                request.getContent(),
                request.getTitle(),
                new HashMap<>(), // metadata
                categoryNames
        ).block(); // Block to wait for AI response

        if (analyzeResponse == null) {
            throw new IllegalStateException("AI 분석 응답이 없습니다.");
        }
        System.out.println("AI 분석 완료. 기사 데이터를 구성합니다.");

        ArticleV2 article = new ArticleV2();
        article.setArticleUrl(articleUrl);
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setPublisher(request.getPublisher());

        // 3. Set category from AI response
        String aiCategoryName = analyzeResponse.getCategory();
        String finalCategoryCode = availableCategories.stream()
            .filter(cat -> cat.getCategoryName().equalsIgnoreCase(aiCategoryName))
            .findFirst()
            .map(CategoryDictV2::getCategoryCode)
            .orElse("UNCATEGORIZED"); // If AI category is not found, default to UNCATEGORIZED
        article.setCategoryCode(finalCategoryCode);
        System.out.println("적용된 카테고리 코드: " + finalCategoryCode);

        // 4. Set summary from AI response
        article.setSummarize(analyzeResponse.getSummary());

        // Convert String dates to LocalDateTime
        if (request.getPublishedAt() != null) {
            article.setPublishedAt(LocalDateTime.parse(request.getPublishedAt(), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        }
        if (request.getContentCrawledAt() != null) {
            article.setContentCrawledAt(LocalDateTime.parse(request.getContentCrawledAt(), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        }
        article.setIsFullContentCrawled(request.getIsFullContentCrawled());
        
        // Unused fields are intentionally not set

        System.out.println("--- 기사 DB 저장 시도 ---");
        return articleV2Repository.save(article);
    }

    @Transactional(readOnly = true)
    public ArticleV2 getArticle(Integer id) {
        return articleV2Repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("ID가 " + id + "인 기사를 찾을 수 없습니다."));
    }
}
