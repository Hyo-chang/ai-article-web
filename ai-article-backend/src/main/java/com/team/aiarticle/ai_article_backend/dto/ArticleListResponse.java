package com.team.aiarticle.ai_article_backend.dto;

import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ArticleListResponse {
    private Integer articleId;
    private String articleUrl;
    private String title;
    private String content;
    private String publisher;
    private LocalDateTime publishedAt;
    private LocalDateTime contentCrawledAt;
    private Boolean isFullContentCrawled;
    private String imageUrl;
    private String summarize;
    private String categoryCode;
    private String categoryName;  // 카테고리 이름 추가
    private String word;          // 키워드 JSON

    public static ArticleListResponse from(ArticleV2 article, String categoryName) {
        return ArticleListResponse.builder()
                .articleId(article.getArticleId())
                .articleUrl(article.getArticleUrl())
                .title(article.getTitle())
                .content(article.getContent())
                .publisher(article.getPublisher())
                .publishedAt(article.getPublishedAt())
                .contentCrawledAt(article.getContentCrawledAt())
                .isFullContentCrawled(article.getIsFullContentCrawled())
                .imageUrl(article.getImage_url())
                .summarize(article.getSummarize())
                .categoryCode(article.getCategoryCode())
                .categoryName(categoryName)
                .word(article.getWord())
                .build();
    }
}
