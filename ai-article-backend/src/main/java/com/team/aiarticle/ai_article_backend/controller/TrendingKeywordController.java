package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/keywords")
public class TrendingKeywordController {

    @Autowired
    private ArticleV2Repository articleRepository;

    /**
     * 인기 기사들의 키워드를 집계하여 급상승 키워드 반환
     */
    @GetMapping("/trending")
    public ResponseEntity<?> getTrendingKeywords(
            @RequestParam(defaultValue = "10") int limit
    ) {
        try {
            // 최근 24시간 이내의 인기 기사 조회
            LocalDateTime since = LocalDateTime.now().minusHours(24);
            List<ArticleV2> popularArticles = articleRepository.findPopularArticles(since, PageRequest.of(0, 50));

            // 인기 기사가 없으면 전체 인기 기사에서 조회
            if (popularArticles.isEmpty()) {
                popularArticles = articleRepository.findByIsPopularTrueOrderByPopularRankAsc(PageRequest.of(0, 50));
            }

            // 키워드 빈도 집계
            Map<String, Integer> keywordCount = new HashMap<>();

            for (ArticleV2 article : popularArticles) {
                String words = article.getWord();
                if (words == null || words.isBlank()) {
                    continue;
                }

                // 콤마로 구분된 키워드 파싱
                String[] keywords = words.split(",");
                for (String keyword : keywords) {
                    String trimmed = keyword.trim();
                    if (trimmed.isEmpty() || trimmed.length() < 2) {
                        continue;
                    }
                    // 불용어 필터링
                    if (isStopword(trimmed)) {
                        continue;
                    }
                    keywordCount.merge(trimmed, 1, Integer::sum);
                }
            }

            // 빈도순 정렬 후 상위 N개 반환
            List<Map<String, Object>> result = keywordCount.entrySet().stream()
                    .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                    .limit(limit)
                    .map(entry -> {
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("keyword", entry.getKey());
                        item.put("count", entry.getValue());
                        return item;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("[TrendingKeyword] Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "키워드 조회 실패"));
        }
    }

    /**
     * 불용어 체크
     */
    private boolean isStopword(String word) {
        Set<String> stopwords = Set.of(
            "기자", "뉴스", "연합뉴스", "특파원", "사진",
            "오늘", "내일", "어제", "올해", "지난", "이번",
            "것", "수", "등", "위해", "대한", "통해",
            "경우", "문제", "상황", "관련", "가능", "필요",
            "정도", "현재", "당시", "한편", "바로", "또한"
        );
        return stopwords.contains(word);
    }
}
