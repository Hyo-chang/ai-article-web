package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.CategoryWithKeywords;
import com.team.aiarticle.ai_article_backend.entity.CategoryDictV2;
import com.team.aiarticle.ai_article_backend.repository.CategoryKeywordTrendRepository;
import com.team.aiarticle.ai_article_backend.repository.CategoryRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final int KEYWORD_LIMIT = 10;

    private final CategoryRepository categoryRepository;
    private final CategoryKeywordTrendRepository trendRepository;

    public List<CategoryWithKeywords> getCategoriesWithTrendingKeywords() {
        List<CategoryDictV2> categories = categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "categoryName"));
        return categories.stream()
                .map(category -> new CategoryWithKeywords(
                        category.getCategoryCode(),
                        category.getCategoryName(),
                        trendRepository.findTopKeywordsByCategory(
                                category.getCategoryCode(),
                                PageRequest.of(0, KEYWORD_LIMIT)
                        )
                ))
                .collect(Collectors.toList());
    }

    public List<CategoryDictV2> findAll() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "categoryName"));
    }
}
