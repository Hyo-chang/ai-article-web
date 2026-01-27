package com.team.aiarticle.ai_article_backend.dto;

import java.util.List;

public record CategoryWithKeywords(
        String categoryId,
        String categoryName,
        List<String> keywords
) {}
