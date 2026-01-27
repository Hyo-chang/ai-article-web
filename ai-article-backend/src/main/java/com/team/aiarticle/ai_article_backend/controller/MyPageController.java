package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.ReadHistoryResponse;
import com.team.aiarticle.ai_article_backend.security.services.UserDetailsImpl;
import com.team.aiarticle.ai_article_backend.service.UserReadHistoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Map;

@RestController
@RequestMapping("/api/mypage")
@Slf4j
public class MyPageController {

    private final UserReadHistoryService historyService;

    public MyPageController(UserReadHistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("ok");
    }

    // Records that the authenticated (or explicitly supplied) user viewed an article
    // Request JSON: { "articleId": number, "userId"?: number, "readAt"?: iso-string }
    @PostMapping("/history")
    public ResponseEntity<?> addHistory(@RequestBody Map<String, Object> payload) {
        Integer articleId = parseInteger(payload.get("articleId"));
        if (articleId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "articleId is required"));
        }

        Integer userId = parseInteger(payload.get("userId"));
        if (userId == null) {
            userId = extractUserIdFromSecurity();
        }
        if (userId == null) {
            log.warn("[READ-HISTORY] Unauthorized request for articleId={} (missing user context)", articleId);
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        LocalDateTime readAt;
        try {
            readAt = parseReadAt(payload.get("readAt"));
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "invalid readAt format"));
        }

        try {
            ReadHistoryResponse response = historyService.record(userId, articleId, readAt);
            log.info("[READ-HISTORY] recorded userId={} articleId={}", userId, articleId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[READ-HISTORY] failed userId={} articleId={} err={}", userId, articleId, e.getMessage(), e);
            throw e;
        }
    }

    private Integer extractUserIdFromSecurity() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        if (auth.getPrincipal() instanceof UserDetailsImpl details) {
            return details.getUserId();
        }
        return null;
    }

    private Integer parseInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) {
            return number.intValue();
        }
        String trimmed = value.toString().trim();
        if (trimmed.isEmpty()) return null;
        try {
            return Integer.parseInt(trimmed);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDateTime parseReadAt(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) {
            long epochMillis = number.longValue();
            return Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDateTime();
        }
        String text = value.toString().trim();
        if (text.isEmpty()) return null;

        DateTimeParseException lastError = null;
        try {
            return LocalDateTime.parse(text);
        } catch (DateTimeParseException e) {
            lastError = e;
        }
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (DateTimeParseException e) {
            lastError = e;
        }
        try {
            return Instant.parse(text).atZone(ZoneId.systemDefault()).toLocalDateTime();
        } catch (DateTimeParseException e) {
            lastError = e;
        }
        if (lastError != null) {
            throw lastError;
        }
        throw new DateTimeParseException("invalid readAt format", text, 0);
    }
}
