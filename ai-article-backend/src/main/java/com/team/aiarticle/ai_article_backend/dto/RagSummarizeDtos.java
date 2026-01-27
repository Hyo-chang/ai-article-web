package com.team.aiarticle.ai_article_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public final class RagSummarizeDtos {

    private RagSummarizeDtos() {
    }

    public record SummarizeRequest(
            @JsonProperty("article_title") String articleTitle,
            @JsonProperty("article_text") String articleText,
            @JsonProperty("key_words") List<String> keyWords
    ) {
    }

    public record SummarizeResponse(
            String summary,
            Map<String, String> definitions
    ) {
    }
}
