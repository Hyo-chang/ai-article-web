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

    /* =============== 0) 제목 키워드 기반 카테고리 재분류 =============== */
    @Async
    public void recategorizeByTitle(long runId) {
        final String JOB = "recategorizeByTitle";
        try {
            int updated = jdbc.update("""
                UPDATE articlev2
                SET category_code = CASE
                    -- 세계(104): 국제 뉴스 고유 키워드 최우선
                    WHEN LOWER(title) REGEXP '이란|이스라엘|하마스|헤즈볼라|가자|팔레스타인|나토|nato|우크라이나|러시아|시진핑|푸틴|젤렌스키|이라크|아프가니스탄|탈레반|쿠웨이트|이집트|중동|미-이스라엘|미-이란|공습|드론 격추'
                        THEN '104'
                    -- 연예(106): 연예인/문화 키워드
                    WHEN LOWER(title) REGEXP 'bts|방탄소년단|아이유|블랙핑크|트와이스|뉴진스|아이브|르세라핌|세븐틴|엑소|빅뱅|투애니원|워너원|연예인|배우 |가수 |아이돌|드라마 |뮤지컬|콘서트|시상식|넷플릭스|디즈니플러스|오스카|칸영화제|연기대상|음악방송|음반|데뷔|박봄|지드래곤|태양 |승리 |탑 |대성 |빅뱅'
                        THEN '106'
                    -- 경제(101): 금융/기업/시장 키워드
                    WHEN LOWER(title) REGEXP '코스피|코스닥|주가 |주식 |증시|원달러|금리|부동산|삼성전자|sk하이닉스|현대차|lg전자|한국은행|기준금리|환율|물가|증권|배당|공모주|ipo|etf|채권'
                        THEN '101'
                    -- 정치(100): 국내 정치 키워드
                    WHEN LOWER(title) REGEXP '국회|대통령실|민주당|국민의힘|의원 |탄핵|총선|대선|국무총리|헌법재판소|특검|공천|당대표|원내대표|여당|야당|정부여당|국정감사'
                        THEN '100'
                    -- IT/과학(105): 기술/과학 키워드
                    WHEN LOWER(title) REGEXP '인공지능|반도체|챗gpt|chatgpt|생성ai|애플|구글|메타 |테슬라|스타트업|나사|nasa|우주왕복선|양자컴퓨터|클라우드|빅데이터'
                        THEN '105'
                    -- 사회(102): 사건/사고/법조 키워드
                    WHEN LOWER(title) REGEXP '경찰 |검찰|법원 |구속|체포|판결|선고|사망|추락|화재|범죄|살인|마약|성범죄|음주운전|실종|수색|시위|집회'
                        THEN '102'
                    -- 생활/문화(103): 그 외 생활 키워드
                    WHEN LOWER(title) REGEXP '날씨|맛집|여행|건강|육아|레시피|패션|뷰티|인테리어|반려동물|캠핑|등산|축제'
                        THEN '103'
                    ELSE category_code
                END
                WHERE summarize IS NOT NULL
            """);
            log.info("[{}] 제목 키워드 기반 카테고리 재분류 완료: {}건 업데이트", JOB, updated);
            finishRun(runId, true, "updated=" + updated);
        } catch (Exception e) {
            log.error("{} failed", JOB, e);
            finishRun(runId, false, e.getMessage());
        }
    }

    /* =============== 0-1) URL sid 기반 카테고리 재분류 =============== */
    @Async
    public void recategorizeByUrlSid(long runId) {
        final String JOB = "recategorizeByUrlSid";
        try {
            int updated = jdbc.update("""
                UPDATE articlev2
                SET category_code = SUBSTRING_INDEX(SUBSTRING_INDEX(article_url, 'sid=', -1), '&', 1)
                WHERE article_url LIKE '%sid=%'
                  AND SUBSTRING_INDEX(SUBSTRING_INDEX(article_url, 'sid=', -1), '&', 1)
                      IN ('100', '101', '102', '103', '104', '105', '106')
            """);
            log.info("[{}] URL sid 기반 카테고리 재분류 완료: {}건 업데이트", JOB, updated);
            finishRun(runId, true, "updated=" + updated);
        } catch (Exception e) {
            log.error("{} failed", JOB, e);
            finishRun(runId, false, e.getMessage());
        }
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
