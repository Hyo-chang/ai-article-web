package com.team.aiarticle.ai_article_backend.web;

import com.team.aiarticle.ai_article_backend.service.TrendAggregationService;
import com.team.aiarticle.ai_article_backend.service.pipeline.PipelineService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Admin 전용 API 엔드포인트.
 * 변경점: /api/admin 하위로 모든 관리자 호출을 통일.
 *        X-Admin-Token 헤더 검증(옵션).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminApiController {

    private static final Logger log = LoggerFactory.getLogger(AdminApiController.class);

    private final PipelineService pipeline;
    private final TrendAggregationService trendAggregationService;

    // 실행 인자/프로퍼티로 주입(--admin.token=1234), 비워두면 검사 생략
    @Value("${admin.token:}")
    private String adminToken;

    public AdminApiController(PipelineService pipeline, TrendAggregationService trendAggregationService) {
        this.pipeline = pipeline;
        this.trendAggregationService = trendAggregationService;
    }

    /** 간단 토큰 검사 */
    private void checkToken(HttpServletRequest req) {
        if (adminToken == null || adminToken.isBlank()) return; // 개발 편의
        String token = req.getHeader("X-Admin-Token");
        if (!adminToken.equals(token)) {
            throw new RuntimeException("Forbidden: invalid admin token");
        }
    }

    // ====== 잡 상태/제어 ======

    @GetMapping("/jobs/{job}/status")
    public ResponseEntity<?> jobStatus(@PathVariable String job, HttpServletRequest req) {
        checkToken(req);
        // TODO: 실제 스케줄러 상태를 조회하도록 교체
        // 예시로 process_new_articles / tfidf 두 가지만 가정
        String status = switch (job) {
            case "process_new_articles" -> "running"; // 샘플 값
            case "tfidf" -> "idle";                   // 샘플 값
            default -> "unknown";
        };
        return ResponseEntity.ok(Map.of("job", job, "status", status));
    }

    @PostMapping("/jobs/{job}/pause")
    public ResponseEntity<?> pause(@PathVariable String job, HttpServletRequest req) {
        checkToken(req);
        // TODO: 실제 스케줄러 일시정지 구현부 연결
        log.info("[ADMIN] pause job={}", job);
        return ResponseEntity.ok(Map.of("job", job, "result", "paused"));
    }

    @PostMapping("/jobs/{job}/resume")
    public ResponseEntity<?> resume(@PathVariable String job, HttpServletRequest req) {
        checkToken(req);
        // TODO: 실제 스케줄러 재개 구현부 연결
        log.info("[ADMIN] resume job={}", job);
        return ResponseEntity.ok(Map.of("job", job, "result", "resumed"));
    }

    // ====== 카테고리 코드 백필 ======
    @PostMapping("/backup/categories")
    public ResponseEntity<?> backfillCategories(HttpServletRequest req) {
        checkToken(req);
        log.info("[ADMIN] backfill categories requested");
        // TODO: 실제 백필 서비스 호출로 교체
        return ResponseEntity.ok(Map.of("result", "accepted"));
    }

    // ====== 전처리 + TF-IDF 재실행 ======
    @PostMapping("/reprocess")
    public ResponseEntity<?> reprocess(HttpServletRequest req,
                                       @RequestParam(required = false)
                                       @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam(required = false)
                                       @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                       @RequestParam(defaultValue = "false") boolean force) {
        checkToken(req);
        log.info("[ADMIN] reprocess requested: from={}, to={}, force={}", from, to, force);

        // TODO: 기간에 해당하는 기사 재전처리/TF-IDF 실행 로직 연결
        // 예시로 pipeline에 연결 가능한 메서드를 호출하세요.
        // pipeline.reprocessRange(from, to, force);

        return ResponseEntity.accepted().body(Map.of(
                "result", "accepted",
                "from", from,
                "to", to,
                "force", force
        ));
    }

    // 구성: 프로퍼티로 기본 윈도우 시간을 제어
    @Value("${app.trend.windowHours:48}")
    private int defaultTrendHours;

    // 수동 트렌드 집계 트리거: 기본은 프로퍼티(app.trend.windowHours)
    @PostMapping("/trends/rebuild")
    public ResponseEntity<?> rebuildTrends(HttpServletRequest req,
                                           @RequestParam(required = false) Integer hours) {
        checkToken(req);
        int useHours = (hours == null || hours <= 0) ? defaultTrendHours : hours;
        LocalDateTime windowEnd = LocalDateTime.now();
        LocalDateTime windowStart = windowEnd.minusHours(Math.max(1, useHours));
        log.info("[ADMIN] rebuild trends requested: hours={}, window={}~{}", useHours, windowStart, windowEnd);
        trendAggregationService.aggregateForWindow(windowStart, windowEnd);
        return ResponseEntity.accepted().body(Map.of(
                "result", "accepted",
                "windowStart", windowStart.toString(),
                "windowEnd", windowEnd.toString(),
                "hours", useHours
        ));
    }

    // 수동 스냅샷 정리(기본은 프로퍼티 app.trend.windowHours 사용)
    @PostMapping("/trends/purge")
    public ResponseEntity<?> purgeTrends(HttpServletRequest req,
                                         @RequestParam(required = false) Integer keepHours) {
        checkToken(req);
        int useKeep = (keepHours == null || keepHours <= 0) ? defaultTrendHours : keepHours;
        log.info("[ADMIN] purge snapshots requested: keepHours={}", useKeep);
        long deleted = trendAggregationService.purgeOldSnapshots(useKeep);
        return ResponseEntity.ok(Map.of("deleted", deleted, "keepHours", useKeep));
    }

    // 수동 파이프라인 트리거: 신규 기사 전처리
    @PostMapping("/pipeline/process")
    public ResponseEntity<?> manualProcess(HttpServletRequest req,
                                           @RequestParam(defaultValue = "200") int limit) {
        checkToken(req);
        int inserted = pipeline.processNewArticles(limit);
        return ResponseEntity.accepted().body(Map.of("inserted_apc_v2", inserted));
    }

    // 수동 파이프라인 트리거: TF-IDF 계산/업서트
    @PostMapping("/pipeline/tfidf")
    public ResponseEntity<?> manualTfidf(HttpServletRequest req) {
        checkToken(req);
        int upserts = pipeline.computeAndStoreTfidf();
        return ResponseEntity.accepted().body(Map.of("upserted_keywords", upserts));
    }
}
