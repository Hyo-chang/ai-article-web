package com.team.aiarticle.ai_article_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.aiarticle.ai_article_backend.dto.AnalyzeUrlResponse;
import com.team.aiarticle.ai_article_backend.dto.UserAnalyzedArticleResponse;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.entity.UserAnalyzedArticle;
import com.team.aiarticle.ai_article_backend.repository.UserAnalyzedArticleRepository;
import com.team.aiarticle.ai_article_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAnalyzedArticleService {

    private final UserAnalyzedArticleRepository userAnalyzedArticleRepository;
    private final UserRepository userRepository;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Transactional
    public UserAnalyzedArticle saveAnalyzedArticle(Integer userId, String articleUrl, AnalyzeUrlResponse ragResponse) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 키워드 목록 JSON 변환
        String keywordsJson = null;
        if (ragResponse.getKeywords() != null) {
            try {
                List<String> keywords = ragResponse.getKeywords().stream()
                        .map(AnalyzeUrlResponse.KeywordScore::getWord)
                        .collect(Collectors.toList());
                keywordsJson = OBJECT_MAPPER.writeValueAsString(keywords);
            } catch (Exception e) {
                log.error("키워드 JSON 변환 실패", e);
            }
        }

        // 정의 JSON 변환
        String definitionsJson = null;
        if (ragResponse.getDefinitions() != null) {
            try {
                definitionsJson = OBJECT_MAPPER.writeValueAsString(ragResponse.getDefinitions());
            } catch (Exception e) {
                log.error("정의 JSON 변환 실패", e);
            }
        }

        UserAnalyzedArticle article = UserAnalyzedArticle.builder()
                .user(user)
                .title(ragResponse.getTitle())
                .body(ragResponse.getBody())
                .summary(ragResponse.getSummary())
                .keywords(keywordsJson)
                .definitions(definitionsJson)
                .imageUrl(ragResponse.getImageUrl())
                .articleUrl(articleUrl)
                .publisher(ragResponse.getPublisher())
                .build();

        return userAnalyzedArticleRepository.save(article);
    }

    @Transactional(readOnly = true)
    public List<UserAnalyzedArticleResponse> getMyAnalyzedArticles(Integer userId) {
        return userAnalyzedArticleRepository.findByUserUserIdOrderByCreatedAtDesc(userId).stream()
                .map(UserAnalyzedArticleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserAnalyzedArticleResponse getAnalyzedArticle(Integer articleId, Integer userId) {
        UserAnalyzedArticle article = userAnalyzedArticleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("분석 기록을 찾을 수 없습니다."));

        // 본인 기사인지 확인
        if (!article.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }

        return UserAnalyzedArticleResponse.fromEntity(article);
    }

    @Transactional
    public void deleteAnalyzedArticle(Integer articleId, Integer userId) {
        UserAnalyzedArticle article = userAnalyzedArticleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("분석 기록을 찾을 수 없습니다."));

        // 본인 기사인지 확인
        if (!article.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        userAnalyzedArticleRepository.delete(article);
    }
}
