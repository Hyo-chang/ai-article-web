package com.team.aiarticle.ai_article_backend.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
public class AiApiService {

    private final WebClient webClient;

    @Value("${rag.api.key}")
    private String apiKey;

    public AiApiService(WebClient.Builder webClientBuilder, @Value("${rag.api.url}") String aiApiUrl) {
        this.webClient = webClientBuilder.baseUrl(aiApiUrl).build();
    }

    public Mono<AnalyzeResponse> analyzeArticle(String htmlContent, String title, Map<String, Object> metadata) {
        AnalyzeRequest requestPayload = new AnalyzeRequest(htmlContent, title, metadata);

        return this.webClient.post()
                .uri("/analyze")
                .header("x-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestPayload)
                .retrieve()
                .bodyToMono(AnalyzeResponse.class);
    }

    // DTO for request
    @Getter
    @Setter
    private static class AnalyzeRequest {
        @JsonProperty("html_content")
        private String htmlContent;
        @JsonProperty("article_title")
        private String articleTitle;
        private Map<String, Object> metadata;

        public AnalyzeRequest(String htmlContent, String articleTitle, Map<String, Object> metadata) {
            this.htmlContent = htmlContent;
            this.articleTitle = articleTitle;
            this.metadata = metadata;
        }
    }

    // DTO for response
    @Getter @Setter
    @NoArgsConstructor
    public static class AnalyzeResponse {
        private String summary;
        private List<KeywordScore> keywords;
        private Map<String, String> definitions;
    }

    @Getter @Setter
    @NoArgsConstructor
    public static class KeywordScore {
        private String word;
        private double score;
    }
}
