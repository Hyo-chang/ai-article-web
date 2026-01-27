package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.entity.CategoryKeywordTrendSnapshot;
import com.team.aiarticle.ai_article_backend.repository.CategoryKeywordTrendSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@EnableScheduling
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/trends")
public class TrendController {

    private final CategoryKeywordTrendSnapshotRepository repo;

    // 최신 윈도우(최근 24h) 기준 TOP N (간단 버전: window를 클라에서 넘겨줌)
    @GetMapping("/{category}/top")
    public List<CategoryKeywordTrendSnapshot> topByCategory(
            @PathVariable String category,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime windowStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime windowEnd) {

        return repo.findTop50ByCategoryCodeAndWindowStartAndWindowEndOrderByScoreSumDesc(
                category, windowStart, windowEnd);
    }
}
