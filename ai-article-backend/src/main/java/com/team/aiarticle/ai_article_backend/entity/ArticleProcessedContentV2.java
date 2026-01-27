package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@Table(name = "article_processed_content_v2")
public class ArticleProcessedContentV2 {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "processed_content_id")
    private Integer processedContentId;

    @Column(name = "article_id", nullable = false, unique = true)
    private Integer articleId; // articlev2.article_id

    @Column(name = "processed_text", columnDefinition = "TEXT", nullable = false)
    private String processedText;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
