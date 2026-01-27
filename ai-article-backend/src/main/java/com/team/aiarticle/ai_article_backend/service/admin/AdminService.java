package com.team.aiarticle.ai_article_backend.service.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.aiarticle.ai_article_backend.service.pipeline.V2PipelineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper om;
    private final V2PipelineService pipeline; // ✅ 주입

    /* ================= 유틸: 로그/락 ================= */

    @Transactional
    public long startRun(String jobName, Map<String, Object> params) {
        String json = "";
        try { json = om.writeValueAsString(params); } catch (Exception ignore) {}
        jdbc.update("INSERT INTO admin_job_run(job_name, params_json) VALUES (?,?)", jobName, json);
        Long runId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return runId != null ? runId : -1L;
    }

    @Transactional
    public void finishRun(long runId, boolean success, String note) {
        jdbc.update("UPDATE admin_job_run SET finished_at=NOW(), status=?, note=? WHERE run_id=?",
                success ? "SUCCESS" : "FAILED", note, runId);
    }

    @Transactional
    public boolean tryLock(String jobName) {
        try {
            jdbc.update("INSERT INTO admin_job_lock(job_name) VALUES (?)", jobName);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public void releaseLock(String jobName) {
        jdbc.update("DELETE FROM admin_job_lock WHERE job_name=?", jobName);
    }

    /* =============== 1) 카테고리 코드 백필 =============== */
    @Async
    public void backfillCategoryCodeV2(long runId) {
        final String JOB = "backfillCategoryCodeV2";
        try {
            int updated = jdbc.update("""
                UPDATE articlev2 v
                JOIN article a ON a.article_url = v.article_url
                SET v.category_code = a.category_code
                WHERE (v.category_code IS NULL OR v.category_code = '')
                  AND a.category_code IS NOT NULL
            """);
            finishRun(runId, true, "updated=" + updated);
        } catch (Exception e) {
            log.error("{} failed", JOB, e);
            finishRun(runId, false, e.getMessage());
        }
    }

    /* =============== 2) 전처리/TF-IDF 재실행(범위) =============== */
    @Async
    public void rerunPreprocessAndAnalyzeKeywords(long runId, LocalDateTime from, LocalDateTime to, boolean force) {
        final String JOB = "keywordsRerunV2";
        try {
            if (force) {
                int delEk = jdbc.update("""
                    DELETE ek FROM extracted_keyword_v2 ek
                    JOIN article_processed_content_v2 apc
                      ON apc.processed_content_id = ek.processed_content_id
                    WHERE apc.processed_at >= ? AND apc.processed_at < ?
                """, from, to);
                int delApc = jdbc.update("""
                    DELETE FROM article_processed_content_v2
                    WHERE processed_at >= ? AND processed_at < ?
                """, from, to);
                log.info("[{}] force cleanup: ek={}, apc={}", JOB, delEk, delApc);
            }

            int saved = pipeline.computeAndStoreTfidf(from, to); // ✅ 실제 호출
            finishRun(runId, true, "savedKeywords=" + saved);
        } catch (Exception e) {
            log.error("{} failed", JOB, e);
            finishRun(runId, false, e.getMessage());
        }
    }

    /* =============== 3) 트렌드 스냅샷 생성(일 단위) =============== */
    @Async
    public void buildTrendSnapshotDaily(long runId, LocalDateTime from, LocalDateTime to, boolean wipeExisting) {
        final String JOB = "buildTrendSnapshotDaily";
        try {
            if (wipeExisting) {
                jdbc.update("""
                  DELETE FROM category_keyword_trend_snapshot
                  WHERE window_start >= DATE(?) AND window_end <= DATE(?)
                """, from, to);
            }
            int ins = jdbc.update("""
              INSERT INTO category_keyword_trend_snapshot
                (category_code, keyword_id, window_start, window_end, doc_count, tfidf_sum, tfidf_avg)
              SELECT
                v.category_code,
                k.keyword_id,
                DATE(apc.processed_at) AS window_start,
                DATE(apc.processed_at) + INTERVAL 1 DAY AS window_end,
                COUNT(DISTINCT apc.article_id),
                SUM(ek.tfidf_score),
                AVG(ek.tfidf_score)
              FROM extracted_keyword_v2 ek
              JOIN article_processed_content_v2 apc
                ON apc.processed_content_id = ek.processed_content_id
              JOIN articlev2 v
                ON v.article_id = apc.article_id
              JOIN keyword k
                ON k.keyword_id = ek.keyword_id
              WHERE apc.processed_at >= ? AND apc.processed_at < ?
                AND v.category_code IS NOT NULL
              GROUP BY v.category_code, k.keyword_id, DATE(apc.processed_at)
            """, from, to);
            finishRun(runId, true, "insertedSnapshots=" + ins);
        } catch (Exception e) {
            log.error("{} failed", JOB, e);
            finishRun(runId, false, e.getMessage());
        }
    }

    /* =============== 4) 48시간 이전 정리 =============== */
    @Async
    public void cleanupOlderThanHours(long runId, int hours, boolean snapshotsOnly) {
        final String JOB = "cleanupOlderThanHours";
        try {
            int sDel = jdbc.update("""
               DELETE FROM category_keyword_trend_snapshot
               WHERE generated_at < (NOW() - INTERVAL ? HOUR)
            """, hours);

            int ekDel = 0;
            if (!snapshotsOnly) {
                ekDel = jdbc.update("""
                  DELETE ek FROM extracted_keyword_v2 ek
                  JOIN article_processed_content_v2 apc
                    ON apc.processed_content_id = ek.processed_content_id
                  WHERE apc.processed_at < (NOW() - INTERVAL ? HOUR)
                """, hours);
            }
            finishRun(runId, true, "snapshotDel=" + sDel + ", ekDel=" + ekDel);
        } catch (Exception e) {
            log.error("{} failed", JOB, e);
            finishRun(runId, false, e.getMessage());
        }
    }
}
