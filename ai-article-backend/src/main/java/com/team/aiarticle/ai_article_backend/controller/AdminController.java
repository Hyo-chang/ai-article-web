package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.ManualCrawlResponse;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import com.team.aiarticle.ai_article_backend.repository.PostRepository;
import com.team.aiarticle.ai_article_backend.repository.UserRepository;
import com.team.aiarticle.ai_article_backend.service.CrawlingBridgeService;
import com.team.aiarticle.ai_article_backend.service.EmailService;
import com.team.aiarticle.ai_article_backend.service.admin.AdminService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final CrawlingBridgeService crawlingBridgeService;
    private final JdbcTemplate jdbc;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final ArticleV2Repository articleV2Repository;
    private final PostRepository postRepository;
    private static final String TOKEN = System.getenv().getOrDefault("ADMIN_TOKEN", "1234");

    public AdminController(AdminService adminService, CrawlingBridgeService crawlingBridgeService,
                           JdbcTemplate jdbc, EmailService emailService,
                           UserRepository userRepository, ArticleV2Repository articleV2Repository,
                           PostRepository postRepository) {
        this.adminService = adminService;
        this.crawlingBridgeService = crawlingBridgeService;
        this.jdbc = jdbc;
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.articleV2Repository = articleV2Repository;
        this.postRepository = postRepository;
    }

    private void requireToken(String token) {
        if (token == null || !token.equals(TOKEN)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin token");
        }
    }

    @Getter
    @Setter
    public static class CrawlRequest {
        private String articleUrl;
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats(@RequestHeader(value="X-Admin-Token", required=false) String token) {
        requireToken(token);
        long subscriberCount = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getEmailSubscribed())).count();
        return Map.of(
                "userCount", userRepository.count(),
                "articleCount", articleV2Repository.count(),
                "postCount", postRepository.count(),
                "subscriberCount", subscriberCount
        );
    }

    @GetMapping("/users")
    public List<Map<String, Object>> getUsers(@RequestHeader(value="X-Admin-Token", required=false) String token) {
        requireToken(token);
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(u -> u.getCreatedAt() == null ? LocalDateTime.MIN : u.getCreatedAt(),
                        Comparator.reverseOrder()))
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("userId", u.getUserId());
                    m.put("username", u.getUsername());
                    m.put("email", u.getEmail());
                    m.put("createdAt", u.getCreatedAt());
                    m.put("provider", u.getProvider());
                    m.put("emailSubscribed", u.isEmailSubscribed());
                    m.put("notificationHour", u.getNotificationHour());
                    return m;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @PostMapping("/crawl-article")
    public ManualCrawlResponse crawlArticle(@RequestBody CrawlRequest request) {
        if (request == null || request.getArticleUrl() == null || request.getArticleUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "articleUrl cannot be empty");
        }
        return crawlingBridgeService.crawlSingleArticle(request.getArticleUrl());
    }

    @PostMapping("/test-email")
    public Map<String,Object> testEmail(
            @RequestHeader(value="X-Admin-Token", required=false) String token,
            @RequestParam String email
    ) {
        requireToken(token);
        User user = userRepository.findByEmail(email);
        if (user == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + email);
        List<ArticleV2> articles = articleV2Repository.findTop3ByOrderByArticleIdDesc();
        try {
            emailService.sendNewsDigest(user, articles);
            return Map.of("status", "SENT", "to", email, "articles", articles.size());
        } catch (Exception e) {
            return Map.of("status", "FAILED", "error", e.getMessage());
        }
    }

    @PostMapping("/recategorize-by-title")
    public Map<String,Object> recategorizeByTitle(@RequestHeader(value="X-Admin-Token", required=false) String token) {
        requireToken(token);
        long runId = adminService.startRun("recategorizeByTitle", Map.of());
        adminService.recategorizeByTitle(runId);
        return Map.of("runId", runId, "status", "STARTED");
    }

    @PostMapping("/recategorize-by-url")
    public Map<String,Object> recategorizeByUrl(@RequestHeader(value="X-Admin-Token", required=false) String token) {
        requireToken(token);
        long runId = adminService.startRun("recategorizeByUrlSid", Map.of());
        adminService.recategorizeByUrlSid(runId);
        return Map.of("runId", runId, "status", "STARTED");
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
