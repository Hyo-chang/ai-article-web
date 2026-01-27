package com.team.aiarticle.ai_article_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public class ReadHistoryResponse {
    private final Integer historyId;
    private final Integer userId;
    private final Integer articleId;
    private final String title;
    private final String articleUrl;
    private final String publisher;
    private final String imageUrl;
    private final String summary;
    private final LocalDateTime publishedAt;
    private final LocalDateTime readAt;

    public ReadHistoryResponse(Integer historyId,
                               Integer userId,
                               Integer articleId,
                               String title,
                               String articleUrl,
                               String publisher,
                               String imageUrl,
                               String summary,
                               LocalDateTime publishedAt,
                               LocalDateTime readAt) {
        this.historyId = historyId;
        this.userId = userId;
        this.articleId = articleId;
        this.title = title;
        this.articleUrl = articleUrl;
        this.publisher = publisher;
        this.imageUrl = imageUrl;
        this.summary = summary;
        this.publishedAt = publishedAt;
        this.readAt = readAt;
    }

    public Integer getHistoryId() {
        return historyId;
    }

    public Integer getUserId() {
        return userId;
    }

    public Integer getArticleId() {
        return articleId;
    }

    public String getTitle() {
        return title;
    }

    @JsonProperty("articleTitle")
    public String getArticleTitle() {
        return title;
    }

    public String getArticleUrl() {
        return articleUrl;
    }

    public String getPublisher() {
        return publisher;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    @JsonProperty("articleImageUrl")
    public String getArticleImageUrl() {
        return imageUrl;
    }

    public String getSummary() {
        return summary;
    }

    @JsonProperty("articleSummary")
    public String getArticleSummary() {
        return summary;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }
}
