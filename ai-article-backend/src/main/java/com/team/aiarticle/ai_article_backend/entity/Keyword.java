package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "keyword", uniqueConstraints = @UniqueConstraint(columnNames = "keyword_name"))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Keyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "keyword_id")
    private Integer keywordId;

    @Column(name = "keyword_name", nullable = false, unique = true, length = 255)
    private String keywordName;
}
