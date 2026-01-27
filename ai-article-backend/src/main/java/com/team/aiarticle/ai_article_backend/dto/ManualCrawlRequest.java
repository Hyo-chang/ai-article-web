package com.team.aiarticle.ai_article_backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ManualCrawlRequest(
        @NotBlank(message = "기사 URL을 입력해 주세요.")
        String articleUrl
) {
}
