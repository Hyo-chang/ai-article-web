package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.service.admin.AdminJobGate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/schedule")
public class AdminScheduleController {

    private final AdminJobGate gate;

    public AdminScheduleController(AdminJobGate gate) {
        this.gate = gate;
    }

    @Value("${admin.token:}")
    private String adminToken;

    private void checkToken(HttpServletRequest req) {
        if (adminToken == null || adminToken.isBlank()) return;
        String t = req.getHeader("X-Admin-Token");
        if (!adminToken.equals(t)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid admin token");
        }
    }

    @GetMapping("/jobs")
    public List<String> jobs(HttpServletRequest req) {
        checkToken(req);
        return List.of("process_new_articles", "analyze_keywords");
    }

    @GetMapping("/status/{jobKey}")
    public Map<String, Object> status(@PathVariable String jobKey, HttpServletRequest req) {
        checkToken(req);
        boolean paused = gate.isPaused(jobKey);
        return Map.of("job", jobKey, "paused", paused);
    }

    @PostMapping("/pause/{jobKey}")
    public ResponseEntity<?> pause(@PathVariable String jobKey, HttpServletRequest req) {
        checkToken(req);
        gate.pause(jobKey);
        return ResponseEntity.ok(Map.of("job", jobKey, "paused", true));
    }

    @PostMapping("/resume/{jobKey}")
    public ResponseEntity<?> resume(@PathVariable String jobKey, HttpServletRequest req) {
        checkToken(req);
        gate.resume(jobKey);
        return ResponseEntity.ok(Map.of("job", jobKey, "paused", false));
    }
}
