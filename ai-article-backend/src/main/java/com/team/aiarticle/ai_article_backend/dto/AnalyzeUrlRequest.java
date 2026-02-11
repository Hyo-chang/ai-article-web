package com.team.aiarticle.ai_article_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeUrlRequest {
    @JsonProperty("article_url")
    private String articleUrl;
}
