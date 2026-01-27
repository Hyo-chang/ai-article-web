package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.CategoryWithKeywords;
import com.team.aiarticle.ai_article_backend.service.CategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/with-trending-keywords")
    public List<CategoryWithKeywords> getCategoriesWithTrendingKeywords() {
        return categoryService.getCategoriesWithTrendingKeywords();
    }
}
