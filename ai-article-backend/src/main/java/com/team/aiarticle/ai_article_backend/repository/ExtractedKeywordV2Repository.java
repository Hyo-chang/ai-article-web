package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.ExtractedKeywordV2;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExtractedKeywordV2Repository extends JpaRepository<ExtractedKeywordV2, Integer> {

    /**
     * 카테고리별로 가장 많이 등장하는 키워드를 조회합니다.
     * ArticleV2 → ArticleProcessedContentV2 → ExtractedKeywordV2 → Keyword 조인
     */
    @Query(value = """
        SELECT k.keyword_name
        FROM extracted_keyword_v2 ek
        JOIN keyword k ON k.keyword_id = ek.keyword_id
        JOIN article_processed_content_v2 pc ON pc.processed_content_id = ek.processed_content_id
        JOIN articlev2 a ON a.article_id = pc.article_id
        WHERE a.category_code = :categoryCode
        GROUP BY k.keyword_id, k.keyword_name
        ORDER BY COUNT(ek.extracted_keyword_id) DESC, MAX(ek.score) DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<String> findTopKeywordsByCategory(@Param("categoryCode") String categoryCode, @Param("limit") int limit);
}
