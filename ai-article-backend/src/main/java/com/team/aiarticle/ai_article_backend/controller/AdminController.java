package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.service.admin.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final JdbcTemplate jdbc;
    private static final String TOKEN = System.getenv().getOrDefault("ADMIN_TOKEN", "1234");

    private void requireToken(String token) {
        if (token == null || !token.equals(TOKEN)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin token");
        }
    }

    @PostMapping("/backfill/category-code")
    public Map<String,Object> backfill(@RequestHeader(value="X-Admin-Token", required=false) String token) {
        requireToken(token);
        long runId = adminService.startRun("backfillCategoryCodeV2", Map.of());
        adminService.backfillCategoryCodeV2(runId);
        return Map.of("runId", runId, "status", "STARTED");
    }

    @PostMapping("/pipeline/keywords-rerun")
    public ResponseEntity<?> rerunKeywords(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(name = "force", defaultValue = "false") boolean force
    ) {
        // ...
        long runId = adminService.startRun("keywordsRerunV2", Map.of("from", from, "to", to, "force", force));
        adminService.rerunPreprocessAndAnalyzeKeywords(runId, from, to, force);
        return ResponseEntity.ok(Map.of("status", "rerun scheduled", "run_id", runId));
    }

    @PostMapping("/trend/snapshot/build")
    public Map<String,Object> buildSnapshot(
            @RequestHeader(value="X-Admin-Token", required=false) String token,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "true") boolean wipeExisting
    ) {
        requireToken(token);
        long runId = adminService.startRun("buildTrendSnapshotDaily", Map.of("from", from, "to", to, "wipeExisting", wipeExisting));
        adminService.buildTrendSnapshotDaily(runId, from, to, wipeExisting);
        return Map.of("runId", runId, "status", "STARTED");
    }

    @DeleteMapping("/cleanup/older-than")
    public Map<String,Object> cleanup(
            @RequestHeader(value="X-Admin-Token", required=false) String token,
            @RequestParam(defaultValue = "48") int hours,
            @RequestParam(defaultValue = "true") boolean snapshotsOnly
    ) {
        requireToken(token);
        long runId = adminService.startRun("cleanupOlderThanHours", Map.of("hours", hours, "snapshotsOnly", snapshotsOnly));
        adminService.cleanupOlderThanHours(runId, hours, snapshotsOnly);
        return Map.of("runId", runId, "status", "STARTED");
    }

    @GetMapping("/runs/latest")
    public List<Map<String,Object>> latestRuns(
            @RequestHeader(value="X-Admin-Token", required=false) String token,
            @RequestParam(defaultValue = "50") int limit
    ) {
        requireToken(token);
        return jdbc.queryForList("""
            SELECT run_id, job_name, params_json, started_at, finished_at, status, note
            FROM admin_job_run
            ORDER BY run_id DESC
            LIMIT ?
        """, limit);
    }
}
