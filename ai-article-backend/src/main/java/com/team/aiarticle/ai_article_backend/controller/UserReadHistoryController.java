package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.ReadHistoryResponse;
import com.team.aiarticle.ai_article_backend.service.UserReadHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserReadHistoryController {

    private final UserReadHistoryService userReadHistoryService;

    public UserReadHistoryController(UserReadHistoryService userReadHistoryService) {
        this.userReadHistoryService = userReadHistoryService;
    }

    @GetMapping("/{userId}/read-history")
    public ResponseEntity<List<ReadHistoryResponse>> getReadHistory(@PathVariable Integer userId,
                                                                    @RequestParam(defaultValue = "20") int limit) {
        List<ReadHistoryResponse> history = userReadHistoryService.getReadHistory(userId, limit);
        return ResponseEntity.ok(history);
    }
}
