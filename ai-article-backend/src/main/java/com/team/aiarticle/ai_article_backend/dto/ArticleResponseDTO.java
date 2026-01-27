package com.team.aiarticle.ai_article_backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ArticleResponseDTO {
    private Long articleId;
    private String articleUrl;
    private String title;
    private String publisher;
    private LocalDateTime publishedAt;
    private String rawHtmlContent;
    private String processedText;
}
