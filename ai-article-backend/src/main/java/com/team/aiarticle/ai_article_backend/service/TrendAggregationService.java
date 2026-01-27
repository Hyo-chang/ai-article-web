package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.entity.CategoryKeywordTrendSnapshot;
import com.team.aiarticle.ai_article_backend.entity.Keyword;
import com.team.aiarticle.ai_article_backend.repository.CategoryKeywordTrendSnapshotRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrendAggregationService {

    private final CategoryKeywordTrendSnapshotRepository snapshotRepo;

    @PersistenceContext
    private EntityManager em;

    @Value("${app.pipeline.mode:legacy}")
    private String pipelineMode;

    @Value("${app.trend.windowHours:48}")
    private long windowHours;

    // 카테고리 집계(최근 windowHours 시간)
    @Transactional
    public void aggregateLast24hForAllCategories() {
        LocalDateTime windowEnd = LocalDateTime.now();
        LocalDateTime windowStart = windowEnd.minusHours(windowHours);

        List<String> categories = fetchCategoriesForWindow(windowStart, windowEnd);
        for (String cat : categories) {
            List<Object[]> rows = "v2".equalsIgnoreCase(pipelineMode)
                    ? CategoryTrendQueries.aggregateByCategoryV2(em, cat, windowStart, windowEnd)
                    : aggregateByCategory(cat, windowStart, windowEnd);

            for (Object[] r : rows) {
                Integer keywordId = ((Number) r[0]).intValue();
                Long docCount     = ((Number) r[1]).longValue();
                Double scoreSum   = ((Number) r[2]).doubleValue();
                Double scoreAvg   = ((Number) r[3]).doubleValue();

                CategoryKeywordTrendSnapshot snap = CategoryKeywordTrendSnapshot.builder()
                        .categoryCode(cat)
                        .keyword(em.getReference(Keyword.class, keywordId))
                        .windowStart(windowStart)
                        .windowEnd(windowEnd)
                        .docCount(docCount.intValue())
                        .scoreSum(scoreSum)
                        .scoreAvg(scoreAvg)
                        .generatedAt(LocalDateTime.now())
                        .build();
                snapshotRepo.save(snap);
            }
        }
    }

    // 수동 트리거용: 임의의 윈도우로 집계
    @Transactional
    public void aggregateForWindow(LocalDateTime windowStart, LocalDateTime windowEnd) {
        List<String> categories = fetchCategoriesForWindow(windowStart, windowEnd);
        for (String cat : categories) {
            List<Object[]> rows = "v2".equalsIgnoreCase(pipelineMode)
                    ? CategoryTrendQueries.aggregateByCategoryV2(em, cat, windowStart, windowEnd)
                    : aggregateByCategory(cat, windowStart, windowEnd);

            for (Object[] r : rows) {
                Integer keywordId = ((Number) r[0]).intValue();
                Long docCount     = ((Number) r[1]).longValue();
                Double scoreSum   = ((Number) r[2]).doubleValue();
                Double scoreAvg   = ((Number) r[3]).doubleValue();

                CategoryKeywordTrendSnapshot snap = CategoryKeywordTrendSnapshot.builder()
                        .categoryCode(cat)
                        .keyword(em.getReference(Keyword.class, keywordId))
                        .windowStart(windowStart)
                        .windowEnd(windowEnd)
                        .docCount(docCount.intValue())
                        .scoreSum(scoreSum)
                        .scoreAvg(scoreAvg)
                        .generatedAt(LocalDateTime.now())
                        .build();
                snapshotRepo.save(snap);
            }
        }
    }

    // 스냅샷 정리(기본 windowHours 이전 데이터 삭제)
    @Transactional
    public long purgeOldSnapshots() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(windowHours);
        return snapshotRepo.deleteByGeneratedAtBefore(threshold);
    }

    // keepHours 기준으로 수동 삭제
    @Transactional
    public long purgeOldSnapshots(long keepHours) {
        long hours = (keepHours <= 0) ? windowHours : keepHours;
        LocalDateTime threshold = LocalDateTime.now().minusHours(hours);
        return snapshotRepo.deleteByGeneratedAtBefore(threshold);
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> aggregateByCategory(String categoryCode,
                                               LocalDateTime windowStart,
                                               LocalDateTime windowEnd) {
        String sql = """
            SELECT ek.keyword_id,
                   COUNT(DISTINCT apc.processed_content_id) AS doc_count,
                   SUM(ek.score) AS score_sum,
                   AVG(ek.score) AS score_avg
            FROM extracted_keyword ek
            JOIN article_processed_content apc
              ON ek.processed_content_id = apc.processed_content_id
            JOIN article a
              ON apc.article_id = a.article_id
            WHERE a.category_code = :category
              AND COALESCE(a.published_at, a.content_crawled_at) BETWEEN :ws AND :we
            GROUP BY ek.keyword_id
            HAVING doc_count > 0
            """;
        return em.createNativeQuery(sql)
                .setParameter("category", categoryCode)
                .setParameter("ws", windowStart)
                .setParameter("we", windowEnd)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    private List<String> fetchCategoriesForWindow(LocalDateTime windowStart, LocalDateTime windowEnd) {
        String v2Sql = """
            SELECT DISTINCT TRIM(v.category_code) AS category_code
            FROM articlev2 v
            JOIN article_processed_content_v2 apc ON apc.article_id = v.article_id
            JOIN extracted_keyword_v2 ek ON ek.processed_content_id = apc.processed_content_id
            WHERE v.category_code IS NOT NULL AND TRIM(v.category_code) <> ''
              AND COALESCE(v.published_at, v.content_crawled_at) BETWEEN :ws AND :we
        """;
        String legacySql = """
            SELECT DISTINCT TRIM(a.category_code) AS category_code
            FROM article a
            JOIN article_processed_content apc ON apc.article_id = a.article_id
            JOIN extracted_keyword ek ON ek.processed_content_id = apc.processed_content_id
            WHERE a.category_code IS NOT NULL AND TRIM(a.category_code) <> ''
              AND COALESCE(a.published_at, a.content_crawled_at) BETWEEN :ws AND :we
        """;
        String sql = "v2".equalsIgnoreCase(pipelineMode) ? v2Sql : legacySql;
        return (List<String>) em.createNativeQuery(sql)
                .setParameter("ws", windowStart)
                .setParameter("we", windowEnd)
                .getResultList();
    }
}
