package com.team.aiarticle.ai_article_backend.dto;

import com.team.aiarticle.ai_article_backend.entity.PostCategory;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostCategoryResponse {
    private Integer categoryId;
    private String categoryCode;
    private String categoryName;
    private String description;

    public static PostCategoryResponse from(PostCategory category) {
        return PostCategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryCode(category.getCategoryCode())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .build();
    }
}
