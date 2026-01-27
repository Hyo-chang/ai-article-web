package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.ArticleDtocrawling;
import com.team.aiarticle.ai_article_backend.entity.ArticleEntity;
import com.team.aiarticle.ai_article_backend.repository.ArticleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import java.util.List;

/** 기사 저장 로직을 수행하는 서비스 */
@Service
public class ArticleService {

    /** articleV2 테이블을 다루는 JPA 리포지토리 */
    private final ArticleRepository articleRepository;

    public ArticleService(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    /**
     * 기사 정보를 articleV2 테이블에 저장한다.
     * @param articleUrl 기사 원본 URL
     * @param title 기사 제목
     * @param content 기사 본문
     * @param publisher 발행 매체명
     * @param categoryCode 네이버 카테고리 코드
     * @param publishedAt 발행 시각
     * @param contentCrawledAt 본문 크롤링 시각
     * @param isFullContentCrawled 전체 본문 크롤링 여부
     * @param definition 추가 정의 정보
     * @param link 관련 링크
     * @param word 관련 단어
     * @param image_url 관련 단어
     * @return 저장된 기사 엔티티
     */
    @Transactional
    public ArticleEntity saveArticle(ArticleDtocrawling articleDto) {
        ArticleEntity article = new ArticleEntity();
        article.setArticleUrl(articleDto.articleUrl);
        article.setTitle(articleDto.title);
        article.setContent(articleDto.content);
        article.setPublisher(articleDto.publisher);
        article.setCategoryCode(articleDto.categoryCode);
        article.setPublishedAt(articleDto.publishedAt);
        article.setInitialCrawledAt(LocalDateTime.now());
        article.setContentCrawledAt(articleDto.contentCrawledAt);
        article.setFullContentCrawled(articleDto.isFullContentCrawled);
        article.setDefinition(articleDto.definition);
        article.setLink(articleDto.link);
        article.setWord(articleDto.word);
        article.setImage_url(articleDto.imageUrl); // DTO의 imageUrl 필드 사용
        return articleRepository.save(article);
    }

    @Transactional(readOnly = true)
    public List<ArticleEntity> getAllArticles() {
        return getAllArticles(null, null);
    }

    @Transactional(readOnly = true)
    public List<ArticleEntity> getAllArticles(String categoryCode) {
        return getAllArticles(categoryCode, null);
    }

    @Transactional(readOnly = true)
    public List<ArticleEntity> getAllArticles(String categoryCode, String query) {
        String normalizedCategory = (categoryCode != null && !categoryCode.isBlank()) ? categoryCode : null;
        String normalizedQuery = (query != null && !query.isBlank()) ? query : null;

        return articleRepository.searchArticles(normalizedCategory, normalizedQuery);
    }

    @Transactional(readOnly = true)
    public List<ArticleEntity> getLatestArticles() {
        return articleRepository.findTop3ByOrderByArticleIdDesc();
    }

    @Transactional(readOnly = true)
    public ArticleEntity getArticleById(Integer id) {
        return articleRepository.findById(id).orElseThrow(() -> new RuntimeException("기사없음" + id));
    }
}
