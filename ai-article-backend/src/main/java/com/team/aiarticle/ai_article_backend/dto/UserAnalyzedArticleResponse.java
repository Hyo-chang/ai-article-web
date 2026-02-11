package com.team.aiarticle.ai_article_backend.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.aiarticle.ai_article_backend.entity.UserAnalyzedArticle;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnalyzedArticleResponse {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private Integer id;
    private String title;
    private String body;
    private String summary;
    private List<String> keywords;
    private Map<String, String> keywordDefinitions;
    private String imageUrl;
    private String articleUrl;
    private String publisher;
    private LocalDateTime createdAt;

    public static UserAnalyzedArticleResponse fromEntity(UserAnalyzedArticle entity) {
        return UserAnalyzedArticleResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .body(entity.getBody())
                .summary(entity.getSummary())
                .keywords(parseKeywords(entity.getKeywords()))
                .keywordDefinitions(parseDefinitions(entity.getDefinitions()))
                .imageUrl(entity.getImageUrl())
                .articleUrl(entity.getArticleUrl())
                .publisher(entity.getPublisher())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private static List<String> parseKeywords(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(raw, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private static Map<String, String> parseDefinitions(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return OBJECT_MAPPER.readValue(raw, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
