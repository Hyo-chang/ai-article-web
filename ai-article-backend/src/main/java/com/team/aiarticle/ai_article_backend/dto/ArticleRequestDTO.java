package com.team.aiarticle.ai_article_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ArticleRequestDTO {
    private String articleUrl;
    private String title;
    private String publisher;
}
