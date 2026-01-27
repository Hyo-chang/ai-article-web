package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "user_interest")
public class UserInterest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_interest_id")
    private Integer userInterestId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "keyword_id")
    private Keyword keyword;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // 선택: v2 스키마에는 category_code가 있을 수 있음. 필요 시 아래 필드를 해제하세요.
    // @Column(name = "category_code")
    // private String categoryCode;
}
