package com.team.aiarticle.ai_article_backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class ArticleServiceV2 {

    private final ArticleV2Repository articleV2Repository;
    private final AiApiService aiApiService;
    private final ObjectMapper objectMapper; // For converting map to JSON string

    public ArticleServiceV2(ArticleV2Repository articleV2Repository, AiApiService aiApiService, ObjectMapper objectMapper) {
        this.articleV2Repository = articleV2Repository;
        this.aiApiService = aiApiService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ArticleV2 getArticleAndAnalyzeIfNeeded(Integer id) {
        ArticleV2 article = articleV2Repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("ID가 " + id + "인 기사를 찾을 수 없습니다."));

        // 요약문이 비어있는 경우에만 AI 분석을 요청
        if (!StringUtils.hasText(article.getSummarize())) {
            System.out.println("요약 정보가 없습니다. ID: " + id + " 기사에 대한 AI 분석을 시작합니다.");

            // 메타데이터 구성
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("category", article.getCategoryCode());
            // publisher_tags 같은 필드가 DB에 있다면 여기에 추가
            // 예: metadata.put("publisher_tags", article.getPublisherTags());

            // AI 서버에 분석 요청 (WebClient는 비동기이므로 block()으로 결과를 기다림)
            AiApiService.AnalyzeResponse analyzeResponse = aiApiService.analyzeArticle(
                    article.getContent(), // HTML 본문
                    article.getTitle(),
                    metadata
            ).block(); // 비동기 작업이 완료될 때까지 대기

            if (analyzeResponse != null) {
                System.out.println("AI 분석 완료. DB를 업데이트합니다.");
                article.setSummarize(analyzeResponse.getSummary());

                // 키워드를 JSON 문자열로 변환하여 저장 (DB 스키마에 따라 변경 필요)
                try {
                    String keywordsJson = objectMapper.writeValueAsString(analyzeResponse.getKeywords());
                    // ArticleV2 엔티티에 keywords 필드가 있다면 아래와 같이 설정
                    // article.setKeywords(keywordsJson); 
                } catch (JsonProcessingException e) {
                    System.err.println("키워드 JSON 변환 실패: " + e.getMessage());
                }

                // 업데이트된 기사를 DB에 저장
                return articleV2Repository.save(article);
            }
        }
        
        return article;
    }
}
