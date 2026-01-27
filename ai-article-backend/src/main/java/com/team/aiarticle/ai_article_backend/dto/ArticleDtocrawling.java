// com.dto.SaveArticleRequest.java
package com.team.aiarticle.ai_article_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class ArticleDtocrawling {
    public String articleUrl;
    public String title;
    public String content;
    public String publisher;
    public String categoryCode;
    public LocalDateTime publishedAt;
    public LocalDateTime contentCrawledAt;
    public Boolean isFullContentCrawled;
    public String definition;
    public String link;
    public String word;

    @JsonProperty("image_url")   // ← 프론트에서 image_url로 보내도 매핑됨
    public String imageUrl;      // ← 엔티티는 camelCase (imageUrl)
}
