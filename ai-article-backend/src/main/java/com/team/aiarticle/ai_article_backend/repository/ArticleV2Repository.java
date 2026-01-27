package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArticleV2Repository extends JpaRepository<ArticleV2, Integer> {

    Optional<ArticleV2> findByArticleUrl(String url);

    // For latest articles listing
    List<ArticleV2> findTop3ByOrderByArticleIdDesc();

    // Paged descending by id (for feeds)
    List<ArticleV2> findAllByOrderByArticleIdDesc(Pageable pageable);

    @Query(value = """
        SELECT v.*
        FROM articlev2 v
        LEFT JOIN article_processed_content_v2 apc
               ON apc.article_id = v.article_id
        WHERE apc.article_id IS NULL
          AND v.content_crawled_at IS NOT NULL
        ORDER BY COALESCE(v.published_at, v.initial_crawled_at) DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<ArticleV2> pickForPreprocessV2(@Param("limit") int limit);
}
