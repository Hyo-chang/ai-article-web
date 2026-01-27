package com.team.aiarticle.ai_article_backend.service.processing;

public interface ArticleProcessingPort {
    /** 새(raw) 문서 찾아서 처리 -> processed & tf-idf 저장, 처리 개수 반환 */
    int processNewArticles();
}
