package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "extracted_keyword_v2")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtractedKeywordV2 {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "extracted_keyword_id")
    private Integer extractedKeywordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_content_id", nullable = false)
    private ArticleProcessedContentV2 processedContent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "keyword_id", nullable = false)
    private Keyword keyword;

    // DB가 DECIMAL(10,6)이므로 BigDecimal로 맞춥니다.
    @Column(name = "score", precision = 10, scale = 6)
    private BigDecimal score;

    @Column(name = "extracted_at")
    private LocalDateTime extractedAt;
}
