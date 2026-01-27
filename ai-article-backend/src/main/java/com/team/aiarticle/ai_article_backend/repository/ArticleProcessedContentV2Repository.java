package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.ArticleProcessedContentV2;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleProcessedContentV2Repository extends JpaRepository<ArticleProcessedContentV2, Integer> {
    boolean existsByArticleId(Integer articleId);
    ArticleProcessedContentV2 findByArticleId(Integer articleId);
}
