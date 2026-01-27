package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.ArticleIngestRequest;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;

@Service
public class ArticleIngestService {

    private final ArticleV2Repository articleV2Repository;

    public ArticleIngestService(ArticleV2Repository articleV2Repository) {
        this.articleV2Repository = articleV2Repository;
    }

    public ArticleV2 saveOrUpdate(ArticleIngestRequest request) {
        if (request.getArticleUrl() == null || request.getArticleUrl().isBlank()) {
            throw new IllegalArgumentException("articleUrl is required");
        }

        ArticleV2 entity = articleV2Repository
                .findByArticleUrl(request.getArticleUrl())
                .orElseGet(ArticleV2::new);

        entity.setArticleUrl(request.getArticleUrl());
        entity.setTitle(request.getTitle());
        entity.setContent(request.getContent());
        entity.setPublisher(request.getPublisher());
        entity.setCategoryCode(request.getCategoryCode());
        entity.setPublishedAt(parseDateTime(request.getPublishedAt()));

        LocalDateTime contentCrawledAt = parseDateTime(
                firstNonEmpty(request.getContentCrawledAt(), request.getInitialCrawledAt()));
        entity.setContentCrawledAt(contentCrawledAt != null ? contentCrawledAt : LocalDateTime.now());

        LocalDateTime initialCrawledAt = parseDateTime(request.getInitialCrawledAt());
        if (initialCrawledAt == null) {
            initialCrawledAt = entity.getInitialCrawledAt() != null
                    ? entity.getInitialCrawledAt()
                    : LocalDateTime.now();
        }
        entity.setInitialCrawledAt(initialCrawledAt);

        entity.setIsFullContentCrawled(
                Optional.ofNullable(request.getIsFullContentCrawled()).orElse(Boolean.TRUE));
        entity.setDefinition(request.getDefinition());
        entity.setLink(request.getLink());
        entity.setWord(request.getWord());
        entity.setImage_url(request.getImage_url());

        return articleV2Repository.save(entity);
    }

    private static String firstNonEmpty(String... inputs) {
        if (inputs == null) return null;
        for (String input : inputs) {
            if (input != null && !input.isBlank()) return input;
        }
        return null;
    }

    private static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ignored) {
        }
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDateTime.parse(value, DateTimeFormatter.ISO_DATE_TIME);
        } catch (DateTimeParseException ignored) {
        }
        return null;
    }
}
