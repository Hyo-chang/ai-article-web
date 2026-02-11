package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_analyzed_article")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnalyzedArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String body;

    @Column(columnDefinition = "LONGTEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String keywords; // JSON 형식으로 저장

    @Column(columnDefinition = "LONGTEXT")
    private String definitions; // JSON 형식으로 저장

    @Column(length = 1000)
    private String imageUrl;

    @Column(length = 1000)
    private String articleUrl;

    @Column(length = 200)
    private String publisher;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
