package com.team.aiarticle.ai_article_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ArticleIngestRequest {
    private String articleUrl;
    private String title;
    private String content;
    private String publisher;
    private String categoryCode;
    private String publishedAt;
    private String contentCrawledAt;
    private String initialCrawledAt;
    private Boolean isFullContentCrawled;
    private String definition;
    private String link;
    private String word;
    private String image_url;

    // 인기 기사 관련 필드
    private Boolean isPopular;
    private Integer popularRank;
}
