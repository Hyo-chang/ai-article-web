package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.ArticleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/** articleV2 테이블을 다루는 리포지토리 */
@Repository
public interface ArticleRepository extends JpaRepository<ArticleEntity, Integer> {
    List<ArticleEntity> findTop3ByOrderByArticleIdDesc();

    @Query("""
            SELECT a FROM ArticleEntity a
            WHERE (:categoryCode IS NULL OR a.categoryCode = :categoryCode)
              AND (
                :query IS NULL
                OR LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY a.articleId DESC
            """)
    List<ArticleEntity> searchArticles(
            @Param("categoryCode") String categoryCode,
            @Param("query") String query
    );
}
