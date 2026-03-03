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

    // 검색: 제목 또는 본문에서 키워드 검색
    @Query("""
        SELECT a FROM ArticleV2 a
        WHERE LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(a.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY a.articleId DESC
    """)
    List<ArticleV2> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

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

    // 카테고리별 기사 조회 (키워드 추출용)
    List<ArticleV2> findByCategoryCode(String categoryCode);

    // 인기 기사 조회 (최근 24시간 이내, 랭킹순)
    @Query("""
        SELECT a FROM ArticleV2 a
        WHERE a.isPopular = true
          AND a.popularFetchedAt >= :since
        ORDER BY a.popularRank ASC
    """)
    List<ArticleV2> findPopularArticles(@Param("since") java.time.LocalDateTime since, Pageable pageable);

    // 인기 기사 조회 (랭킹순, 최신 업데이트 기준)
    List<ArticleV2> findByIsPopularTrueOrderByPopularRankAsc(Pageable pageable);

    // sitemap용: title, summarize가 있는 기사만 조회
    @Query("""
        SELECT a FROM ArticleV2 a
        WHERE a.title IS NOT NULL
          AND a.summarize IS NOT NULL
        ORDER BY a.articleId DESC
    """)
    List<ArticleV2> findSitemapArticles();
}
