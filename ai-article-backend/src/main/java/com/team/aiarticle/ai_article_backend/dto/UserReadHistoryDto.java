package com.team.aiarticle.ai_article_backend.dto;

import java.time.LocalDateTime;

public class UserReadHistoryDto {
    private Integer userId;
    private Integer articleId;
    private LocalDateTime readAt;

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Integer getArticleId() { return articleId; }
    public void setArticleId(Integer articleId) { this.articleId = articleId; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
}

