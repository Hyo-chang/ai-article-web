package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/** 기사(articleV2) 테이블과 매핑되는 JPA 엔티티 */
@Entity
@Table(name = "articleV2")
public class ArticleEntity {

    /** 기사 기본 키(자동 증가) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "article_id")
    private Integer articleId;

    /** 기사 원본 URL (유일) */
    @Column(name = "article_url", nullable = false, unique = true)
    private String articleUrl;

    /** 기사 제목 */
    @Column(name = "title", nullable = false)
    private String title;

    /** 기사 본문 전체 */
    @Lob
    @Column(name = "content", nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    /** 발행 매체명 */
    @Column(name = "publisher")
    private String publisher;

    /** 네이버 카테고리 코드 (예: sid1-sid2) */
    @Column(name = "category_code")
    private String categoryCode;

    /** 발행 시각 */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    /** 최초 크롤링 시각 */
    @Column(name = "initial_crawled_at")
    private LocalDateTime initialCrawledAt;

    /** 본문이 다시 크롤링된 시각 */
    @Column(name = "content_crawled_at")
    private LocalDateTime contentCrawledAt;

    /** 전체 본문 크롤링 여부 (0/1) */
    @Column(name = "is_full_content_crawled")
    private Boolean isFullContentCrawled;

    /** 추가 정의 정보 */
    @Column(name = "definition")
    private String definition;

    /** 관련 링크 */
    @Column(name = "link")
    private String link;

    /** 관련 단어 */
    @Column(name = "word")
    private String word;

    @Column(name = "image_url")
    private String image_url;

    public Integer getArticleId() {
        return articleId;
    }

    public void setArticleId(Integer articleId) {
        this.articleId = articleId;
    }

    public String getArticleUrl() {
        return articleUrl;
    }

    public void setArticleUrl(String articleUrl) {
        this.articleUrl = articleUrl;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getPublisher() {
        return publisher;
    }

    public void setPublisher(String publisher) {
        this.publisher = publisher;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public void setCategoryCode(String categoryCode) {
        this.categoryCode = categoryCode;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public LocalDateTime getInitialCrawledAt() {
        return initialCrawledAt;
    }

    public void setInitialCrawledAt(LocalDateTime initialCrawledAt) {
        this.initialCrawledAt = initialCrawledAt;
    }

    public LocalDateTime getContentCrawledAt() {
        return contentCrawledAt;
    }

    public void setContentCrawledAt(LocalDateTime contentCrawledAt) {
        this.contentCrawledAt = contentCrawledAt;
    }

    public Boolean getFullContentCrawled() {
        return isFullContentCrawled;
    }

    public void setFullContentCrawled(Boolean fullContentCrawled) {
        isFullContentCrawled = fullContentCrawled;
    }

    public String getDefinition() {
        return definition;
    }

    public void setDefinition(String definition) {
        this.definition = definition;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getImage_url() {
        return image_url;
    }

    public void setImage_url(String image_url) {
        this.image_url = image_url;
    }
}
