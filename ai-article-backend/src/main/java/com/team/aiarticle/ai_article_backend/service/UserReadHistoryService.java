package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.ReadHistoryResponse;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.entity.UserReadHistory;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import com.team.aiarticle.ai_article_backend.repository.UserReadHistoryRepository;
import com.team.aiarticle.ai_article_backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserReadHistoryService {

    private static final int MAX_LIMIT = 100;

    private final UserRepository userRepository;
    private final ArticleV2Repository articleRepository;
    private final UserReadHistoryRepository historyRepository;

    public UserReadHistoryService(UserRepository userRepository,
                                  ArticleV2Repository articleRepository,
                                  UserReadHistoryRepository historyRepository) {
        this.userRepository = userRepository;
        this.articleRepository = articleRepository;
        this.historyRepository = historyRepository;
    }

    public List<ReadHistoryResponse> getReadHistory(Integer userId, int limit) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User " + userId + " not found");
        }
        int sanitizedLimit = Math.max(1, Math.min(limit, MAX_LIMIT));
        Sort sort = Sort.by(Sort.Order.desc("readAt"), Sort.Order.desc("historyId"));
        Pageable pageable = PageRequest.of(0, sanitizedLimit, sort);
        List<UserReadHistory> histories = historyRepository.findByUserUserId(userId, pageable);
        return histories.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ReadHistoryResponse record(Integer userId, Integer articleId, LocalDateTime readAt) {
        if (userId == null || articleId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId and articleId are required");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
        ArticleV2 article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found: " + articleId));

        Optional<UserReadHistory> existingHistory =
                historyRepository.findByUserUserIdAndArticleArticleId(userId, articleId);

        if (existingHistory.isPresent()) {
            UserReadHistory history = existingHistory.get();
            history.setReadAt(readAt != null ? readAt : LocalDateTime.now());
            UserReadHistory updated = historyRepository.save(history);
            return toResponse(updated);
        }

        UserReadHistory history = new UserReadHistory();
        history.setUser(user);
        history.setArticle(article);
        history.setReadAt(readAt != null ? readAt : LocalDateTime.now());

        UserReadHistory saved = historyRepository.save(history);
        return toResponse(saved);
    }

    private ReadHistoryResponse toResponse(UserReadHistory history) {
        ArticleV2 article = history.getArticle();
        String summary = buildSummary(article);
        return new ReadHistoryResponse(
                history.getHistoryId(),
                history.getUser() != null ? history.getUser().getUserId() : null,
                article != null ? article.getArticleId() : null,
                article != null ? article.getTitle() : null,
                article != null ? article.getArticleUrl() : null,
                article != null ? article.getPublisher() : null,
                article != null ? article.getImage_url() : null,
                summary,
                article != null ? article.getPublishedAt() : null,
                history.getReadAt()
        );
    }

    private String buildSummary(ArticleV2 article) {
        if (article == null || article.getContent() == null) return null;
        String content = article.getContent().trim();
        if (content.isEmpty()) return null;
        int maxLength = 220;
        if (content.length() <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength).trim() + "...";
    }
}
