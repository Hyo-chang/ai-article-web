package com.team.aiarticle.ai_article_backend.service.pipeline;

public interface PipelineService {
    int processNewArticles(int batchSize);
    int computeAndStoreTfidf();
}
