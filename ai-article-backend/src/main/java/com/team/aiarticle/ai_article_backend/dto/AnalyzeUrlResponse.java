package com.team.aiarticle.ai_article_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeUrlResponse {
    private boolean success;
    private String title;
    private String body;
    private String summary;
    private List<KeywordScore> keywords;
    private Map<String, String> definitions;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("published_at")
    private String publishedAt;

    private String publisher;
    private String error;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KeywordScore {
        private String word;
        private double score;
    }
}
