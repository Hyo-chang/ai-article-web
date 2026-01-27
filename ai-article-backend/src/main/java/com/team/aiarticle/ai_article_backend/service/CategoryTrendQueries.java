package com.team.aiarticle.ai_article_backend.service;

import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;

public class CategoryTrendQueries {

    @SuppressWarnings("unchecked")
    public static List<Object[]> aggregateByCategoryV2(EntityManager em,
                                                       String categoryCode,
                                                       LocalDateTime windowStart,
                                                       LocalDateTime windowEnd) {
        String sql = """
            SELECT ek.keyword_id,
                   COUNT(DISTINCT apc.processed_content_id) AS doc_count,
                   SUM(ek.score) AS score_sum,
                   AVG(ek.score) AS score_avg
            FROM extracted_keyword_v2 ek
            JOIN article_processed_content_v2 apc
              ON ek.processed_content_id = apc.processed_content_id
            JOIN articlev2 v
              ON apc.article_id = v.article_id
            WHERE v.category_code = :category
              AND COALESCE(v.published_at, v.content_crawled_at) BETWEEN :ws AND :we
            GROUP BY ek.keyword_id
            HAVING doc_count > 0
            """;
        return em.createNativeQuery(sql)
                .setParameter("category", categoryCode)
                .setParameter("ws", windowStart)
                .setParameter("we", windowEnd)
                .getResultList();
    }
}
