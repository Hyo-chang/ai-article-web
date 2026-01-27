package com.team.aiarticle.ai_article_backend.dto;

public record ManualCrawlResponse(
        boolean success,
        int exitCode,
        String log
) {
}
