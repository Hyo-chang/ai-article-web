package com.team.aiarticle.ai_article_backend.nlp;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RagAiApiCaller {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${rag.api.url}")
    private String apiUrl;

    @Value("${rag.api.key}")
    private String apiKey;

    public AnalyzeResponse analyze(String htmlContent, String articleTitle, Map<String, Object> metadata) {
        String fullUrl = apiUrl + "/analyze";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-KEY", apiKey);

        AnalyzeRequest requestPayload = new AnalyzeRequest(htmlContent, articleTitle, metadata);

        HttpEntity<AnalyzeRequest> requestEntity = new HttpEntity<>(requestPayload, headers);

        return restTemplate.postForObject(fullUrl, requestEntity, AnalyzeResponse.class);
    }

    // --- DTO Classes ---

    public static class AnalyzeRequest implements Serializable {
        @JsonProperty("html_content")
        private String htmlContent;
        @JsonProperty("article_title")
        private String articleTitle;
        @JsonProperty("metadata")
        private Map<String, Object> metadata;

        public AnalyzeRequest(String htmlContent, String articleTitle, Map<String, Object> metadata) {
            this.htmlContent = htmlContent;
            this.articleTitle = articleTitle;
            this.metadata = metadata;
        }

        // Getters for serialization
        public String getHtmlContent() { return htmlContent; }
        public String getArticleTitle() { return articleTitle; }
        public Map<String, Object> getMetadata() { return metadata; }
    }

    public static class AnalyzeResponse implements Serializable {
        private String summary;
        private List<KeywordScore> keywords;
        private Map<String, String> definitions;

        // Getters and Setters
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public List<KeywordScore> getKeywords() { return keywords; }
        public void setKeywords(List<KeywordScore> keywords) { this.keywords = keywords; }
        public Map<String, String> getDefinitions() { return definitions; }
        public void setDefinitions(Map<String, String> definitions) { this.definitions = definitions; }
    }

    public static class KeywordScore implements Serializable {
        private String word;
        private double score;

        // Getters and Setters
        public String getWord() { return word; }
        public void setWord(String word) { this.word = word; }
        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
    }
}
