package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "category_keyword_trend_snapshot",
    uniqueConstraints = @UniqueConstraint(name = "uq_cat_kw_window",
        columnNames = {"category_code", "keyword_id", "window_start", "window_end"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryKeywordTrendSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "snapshot_id")
    private Long snapshotId;

    @Column(name = "category_code", length = 32, nullable = false)
    private String categoryCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "keyword_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_trend_kw"))
    private Keyword keyword;

    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;

    @Column(name = "window_end", nullable = false)
    private LocalDateTime windowEnd;

    @Column(name = "doc_count", nullable = false)
    private Integer docCount;

    @Column(name = "score_sum", nullable = false)
    private Double scoreSum;

    @Column(name = "score_avg", nullable = false)
    private Double scoreAvg;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;
}
