package com.team.aiarticle.ai_article_backend.service.pipeline;

import com.team.aiarticle.ai_article_backend.nlp.HtmlExtractor;
import com.team.aiarticle.ai_article_backend.nlp.RagAiApiCaller;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@Profile("v2")
@RequiredArgsConstructor
public class V2PipelineService implements PipelineService {

    private final JdbcTemplate jdbc;
    private final RagAiApiCaller ragAiApiCaller; // KoreanNlpService 대신 주입
    private final HtmlExtractor htmlExtractor;
    private final ArticleV2Repository v2Repo;

    @Value("${app.tfidf.topN:30}")
    private int topN;

    @Override
    public int computeAndStoreTfidf() {
        LocalDateTime from = LocalDateTime.now().minusYears(10);
        LocalDateTime to   = LocalDateTime.now().plusDays(1);
        return computeAndStoreTfidf(from, to);
    }
    
    // processNewArticles는 전처리 과정이므로 현재는 수정하지 않음.
    // 만약 rag-ai 서버가 전처리까지 담당한다면 이 부분도 수정 필요.
    @Override
    public int processNewArticles(int limit) {
        // ... (기존 코드 유지) ...
        return 0; // 이 부분은 실제 구현에 따라 변경 필요
    }

    public int computeAndStoreTfidf(LocalDateTime from, LocalDateTime to) {
        Objects.requireNonNull(from);
        Objects.requireNonNull(to);
        log.info("[V2Pipeline] computeAndStoreTfidf range: {} ~ {}", from, to);

        // APC_DOC 대신 필요한 정보를 직접 조회 (HTML 본문이 필요하므로)
        List<ArticleInfo> articles = jdbc.query("""
            SELECT a.article_id, a.title, a.content
            FROM articlev2 a
            WHERE a.published_at >= ? AND a.published_at < ?
              AND NOT EXISTS (
                SELECT 1 FROM extracted_keyword_v2 ek
                JOIN article_processed_content_v2 apc ON ek.processed_content_id = apc.processed_content_id
                WHERE apc.article_id = a.article_id
              )
        """, (ResultSet rs, int rowNum) -> new ArticleInfo(
                rs.getInt("article_id"),
                rs.getString("title"),
                rs.getString("content")
        ), from, to);

        return upsertKeywordsForArticles(articles);
    }

    private int upsertKeywordsForArticles(List<ArticleInfo> articles) {
        int savedTotal = 0;

        for (ArticleInfo article : articles) {
            String htmlContent = article.htmlContent();
            if (htmlContent == null || htmlContent.isBlank()) {
                htmlContent = getHtmlForArticleId(article.articleId()); // Fallback
            }

            if (htmlContent == null || htmlContent.isBlank()) {
                log.warn("[V2Pipeline] article_id={}에 대한 HTML 컨텐츠가 없어 스킵합니다.", article.articleId());
                continue;
            }

            try {
                // RagAiApiCaller를 사용하여 키워드 분석 요청
                RagAiApiCaller.AnalyzeResponse response = ragAiApiCaller.analyze(
                        htmlContent,
                        article.title(),
                        Collections.emptyMap() // 필요 시 메타데이터 추가
                );

                if (response == null || response.getKeywords() == null || response.getKeywords().isEmpty()) {
                    log.warn("[V2Pipeline] article_id={}에 대한 키워드 분석 결과가 없습니다.", article.articleId());
                    continue;
                }

                // article_processed_content_v2에 데이터가 없을 수 있으므로 ID를 가져오거나 생성
                Integer processedContentId = findOrCreateProcessedContentId(article.articleId());
                if(processedContentId == null) {
                    log.error("[V2Pipeline] article_id={}에 대한 processed_content_id를 생성하거나 찾을 수 없습니다.", article.articleId());
                    continue;
                }


                // 상위 키워드를 articlev2.word에 저장
                updateArticleTopWords(article.articleId(), response.getKeywords());

                // 각 키워드와 점수를 DB에 저장
                for (var keywordScore : response.getKeywords()) {
                    Integer keywordId = findOrCreateKeywordId(keywordScore.getWord());
                    BigDecimal score = BigDecimal.valueOf(keywordScore.getScore()).setScale(6, RoundingMode.HALF_UP);

                    int affected = jdbc.update("""
                        INSERT INTO extracted_keyword_v2 (processed_content_id, keyword_id, score, extracted_at)
                        VALUES (?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                          score = VALUES(score),
                          extracted_at = VALUES(extracted_at)
                    """, processedContentId, keywordId, score);
                    savedTotal += affected;
                }

            } catch (Exception e) {
                log.error("[V2Pipeline] article_id={} 분석 중 오류 발생: {}", article.articleId(), e.getMessage(), e);
            }
        }

        log.info("[V2Pipeline] upserted rows total: {}", savedTotal);
        return savedTotal;
    }

    private void updateArticleTopWords(int articleId, List<RagAiApiCaller.KeywordScore> keywords) {
        try {
            String topWords = keywords.stream()
                    .limit(10)
                    .map(RagAiApiCaller.KeywordScore::getWord)
                    .filter(w -> w != null && !w.isBlank())
                    .reduce((a, b) -> a + "," + b)
                    .orElse("");
            if (!topWords.isBlank()) {
                jdbc.update("UPDATE articlev2 SET word = ? WHERE article_id = ?", topWords, articleId);
            }
        } catch (Exception e) {
            log.debug("[V2Pipeline] update articlev2.word failed for article_id={}: {}", articleId, e.getMessage());
        }
    }
    
    private Integer findOrCreateProcessedContentId(int articleId) {
        try {
            // 먼저 ID가 있는지 확인
            return jdbc.queryForObject(
                "SELECT processed_content_id FROM article_processed_content_v2 WHERE article_id = ?",
                Integer.class, articleId);
        } catch (Exception ignore) {
            // 없으면 새로 삽입
            jdbc.update("INSERT IGNORE INTO article_processed_content_v2 (article_id, processed_text, processed_at) VALUES (?, '', NOW())", articleId);
            // 다시 ID 조회
            try {
                return jdbc.queryForObject(
                    "SELECT processed_content_id FROM article_processed_content_v2 WHERE article_id = ?",
                    Integer.class, articleId);
            } catch (Exception e) {
                return null;
            }
        }
    }


    private Integer findOrCreateKeywordId(String keywordName) {
        Integer id;
        try {
            id = jdbc.queryForObject(
                    "SELECT keyword_id FROM keyword WHERE keyword_name = ?",
                    Integer.class, keywordName);
        } catch (Exception ignore) {
            id = null;
        }
        if (id != null) return id;

        jdbc.update("INSERT INTO keyword(keyword_name) VALUES (?)", keywordName);
        return jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
    }

    private String getHtmlForArticleId(Integer articleId) {
        try {
            return jdbc.queryForObject("""
                SELECT r.raw_html_content
                FROM article_raw_content r
                WHERE r.article_id = ?
                LIMIT 1
            """, String.class, articleId);
        } catch (Exception e) {
            log.debug("[V2Pipeline] getHtmlForArticleId({}) failed: {}", articleId, e.getMessage());
            return null;
        }
    }

    private record ArticleInfo(int articleId, String title, String htmlContent) {}
}
