package com.team.aiarticle.ai_article_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.aiarticle.ai_article_backend.dto.CategoryWithKeywords;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.entity.CategoryDictV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import com.team.aiarticle.ai_article_backend.repository.CategoryRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final int KEYWORD_LIMIT = 10;

    private final CategoryRepository categoryRepository;
    private final ArticleV2Repository articleV2Repository;
    private final ObjectMapper objectMapper;

    public List<CategoryWithKeywords> getCategoriesWithTrendingKeywords() {
        List<CategoryDictV2> categories = categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "categoryName"));
        return categories.stream()
                .map(category -> new CategoryWithKeywords(
                        category.getCategoryCode(),
                        category.getCategoryName(),
                        getKeywordsByCategory(category.getCategoryCode())
                ))
                .collect(Collectors.toList());
    }

    /**
     * 카테고리별 기사에서 키워드를 추출하여 빈도순으로 상위 N개 반환
     */
    private List<String> getKeywordsByCategory(String categoryCode) {
        List<ArticleV2> articles = articleV2Repository.findByCategoryCode(categoryCode);

        // 키워드 빈도수 계산
        Map<String, Integer> keywordCount = new LinkedHashMap<>();

        for (ArticleV2 article : articles) {
            String wordJson = article.getWord();
            if (wordJson == null || wordJson.isBlank()) continue;

            try {
                List<String> keywords = objectMapper.readValue(wordJson, new TypeReference<List<String>>() {});
                for (String keyword : keywords) {
                    if (keyword != null && !keyword.isBlank()) {
                        keywordCount.merge(keyword.trim(), 1, Integer::sum);
                    }
                }
            } catch (Exception e) {
                // JSON 파싱 실패 시 무시
            }
        }

        // 빈도순 정렬 후 상위 N개 반환
        return keywordCount.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(KEYWORD_LIMIT)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    public List<CategoryDictV2> findAll() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "categoryName"));
    }
}
