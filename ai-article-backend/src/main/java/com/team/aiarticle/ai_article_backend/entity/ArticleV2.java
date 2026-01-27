package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@Table(name = "articlev2") // 실제 소문자 테이블명
public class ArticleV2 {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "article_id")
    private Integer articleId;
    
    @Column(name = "category_code", length = 255)
    private String categoryCode;

    @Column(name = "article_url", length = 255, nullable = false)
    private String articleUrl;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "publisher", length = 255)
    private String publisher;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "initial_crawled_at")
    private LocalDateTime initialCrawledAt;

    @Column(name = "content_crawled_at")
    private LocalDateTime contentCrawledAt;

    @Column(name = "is_full_content_crawled")
    private Boolean isFullContentCrawled;

    // v2에만 있는 필드(현재 파이프라인에서는 사용 X)
    @Column(name = "definition")
    private String definition;
    @Column(name = "link")
    private String link;
    @Column(name = "word")
    private String word;

    @Column(name = "image_url")
    private String image_url;
    
    @Column(name = "summarize", columnDefinition = "LONGTEXT")
    private String summarize;
}
