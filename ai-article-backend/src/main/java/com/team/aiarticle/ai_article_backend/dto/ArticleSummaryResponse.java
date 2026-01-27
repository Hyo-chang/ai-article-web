package com.team.aiarticle.ai_article_backend.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record ArticleSummaryResponse(
        Integer article_id,
        String title,
        String publisher,
        String summarize,
        List<String> keywords,
        Map<String, String> keywordDefinitions
) {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public static ArticleSummaryResponse fromEntity(ArticleV2 entity) {
        List<String> keywords = parseKeywords(entity.getWord());
        return new ArticleSummaryResponse(
                entity.getArticleId(),
                entity.getTitle(),
                entity.getPublisher(),
                entity.getSummarize(),
                keywords,
                parseDefinitions(entity.getDefinition(), keywords)
        );
    }

    public static List<String> parseKeywords(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Collections.emptyList();
        }
        try {
            List<String> parsed = OBJECT_MAPPER.readValue(raw, new TypeReference<List<String>>() {});
            return normalizeKeywords(parsed);
        } catch (Exception ignored) {
        }
        return normalizeKeywords(Arrays.asList(raw.split("[,\n]")));
    }

    private static List<String> normalizeKeywords(List<String> source) {
        if (source == null) return Collections.emptyList();
        return source.stream()
                .map(value -> value == null ? "" : value.trim())
                .filter(value -> !value.isEmpty())
                .distinct()
                .limit(5)
                .collect(Collectors.toList());
    }

    private static Map<String, String> parseDefinitions(String raw, List<String> keywords) {
        if (!StringUtils.hasText(raw)) {
            return Collections.emptyMap();
        }
        try {
            Map<String, String> parsed = OBJECT_MAPPER.readValue(raw, new TypeReference<Map<String, String>>() {});
            return normalizeDefinitions(parsed, keywords);
        } catch (Exception ignored) {
        }
        return Collections.emptyMap();
    }

    public static Map<String, String> normalizeDefinitions(Map<String, String> source, List<String> keywords) {
        if (source == null || source.isEmpty()) {
            return Collections.emptyMap();
        }
        LinkedHashMap<String, String> ordered = new LinkedHashMap<>();
        if (keywords != null && !keywords.isEmpty()) {
            for (String keyword : keywords) {
                String normalizedKeyword = keyword == null ? "" : keyword.trim();
                if (!StringUtils.hasText(normalizedKeyword)) {
                    continue;
                }
                String meaning = source.get(normalizedKeyword);
                if (StringUtils.hasText(meaning)) {
                    ordered.put(normalizedKeyword, meaning.trim());
                }
            }
        }
        if (ordered.isEmpty()) {
            source.entrySet().stream()
                    .filter(entry -> StringUtils.hasText(entry.getKey()) && StringUtils.hasText(entry.getValue()))
                    .forEach(entry -> ordered.put(entry.getKey().trim(), entry.getValue().trim()));
        }
        return ordered;
    }
}
