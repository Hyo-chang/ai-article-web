package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.ReadHistoryResponse;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.security.services.UserDetailsImpl;
import com.team.aiarticle.ai_article_backend.service.UserReadHistoryService;
import com.team.aiarticle.ai_article_backend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mypage")
@Slf4j
public class MyPageController {

    private final UserReadHistoryService historyService;
    private final UserService userService;

    public MyPageController(UserReadHistoryService historyService, UserService userService) {
        this.historyService = historyService;
        this.userService = userService;
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("ok");
    }

    // 프로필 조회
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        Integer userId = extractUserIdFromSecurity();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return userService.findById(userId)
                .map(user -> ResponseEntity.ok(Map.of(
                        "userId", user.getUserId(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "profileImageUrl", user.getProfileImageUrl() != null ? user.getProfileImageUrl() : ""
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    // 프로필 업데이트 (닉네임, 프로필 이미지)
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> payload) {
        Integer userId = extractUserIdFromSecurity();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        String username = payload.get("username") != null ? payload.get("username").toString().trim() : null;
        String profileImageUrl = payload.get("profileImageUrl") != null ? payload.get("profileImageUrl").toString() : null;

        try {
            User updated = userService.updateProfile(userId, username, profileImageUrl);
            log.info("[PROFILE] updated userId={} username={}", userId, updated.getUsername());
            return ResponseEntity.ok(Map.of(
                    "userId", updated.getUserId(),
                    "username", updated.getUsername(),
                    "email", updated.getEmail(),
                    "profileImageUrl", updated.getProfileImageUrl() != null ? updated.getProfileImageUrl() : ""
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 관심 카테고리 조회
    @GetMapping("/interests")
    public ResponseEntity<?> getInterests() {
        Integer userId = extractUserIdFromSecurity();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        List<String> categories = userService.getUserInterestCategories(userId);
        return ResponseEntity.ok(Map.of("categories", categories));
    }

    // 관심 카테고리 저장
    @PutMapping("/interests")
    public ResponseEntity<?> saveInterests(@RequestBody Map<String, Object> payload) {
        Integer userId = extractUserIdFromSecurity();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        Object categoriesObj = payload.get("categories");
        if (!(categoriesObj instanceof List<?>)) {
            return ResponseEntity.badRequest().body(Map.of("message", "categories must be an array"));
        }

        @SuppressWarnings("unchecked")
        List<String> categories = ((List<?>) categoriesObj).stream()
                .filter(item -> item instanceof String)
                .map(item -> ((String) item).trim())
                .filter(s -> !s.isEmpty())
                .toList();

        try {
            userService.saveUserInterestCategories(userId, categories);
            log.info("[INTERESTS] saved userId={} categories={}", userId, categories);
            return ResponseEntity.ok(Map.of("message", "저장되었습니다.", "categories", categories));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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
