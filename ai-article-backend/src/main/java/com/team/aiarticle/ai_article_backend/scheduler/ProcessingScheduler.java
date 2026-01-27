package com.team.aiarticle.ai_article_backend.scheduler;

import com.team.aiarticle.ai_article_backend.service.admin.AdminRunLogger;
import com.team.aiarticle.ai_article_backend.service.pipeline.PipelineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessingScheduler {

    private final PipelineService pipeline;
    private final AdminRunLogger runLogger;

    @Scheduled(cron = "${app.scheduler.cron.preprocess:0 0/5 * * * *}") // 5분마다
    public void preprocess() {
        long runId = runLogger.start(AdminJobs.PROCESS_NEW, null);
        try {
            int saved = pipeline.processNewArticles(100);
            runLogger.success(runId, "Saved: " + saved);
        } catch (Exception e) {
            runLogger.fail(runId, e.getMessage());
        }
    }

    @Scheduled(cron = "${app.scheduler.cron.keywords:0 0/15 * * * *}") // 15분마다
    public void analyzeKeywords() {
        long runId = runLogger.start("analyze_keywords", null);
        try {
            int saved = pipeline.computeAndStoreTfidf();
            runLogger.success(runId, "Saved: " + saved);
        } catch (Exception e) {
            runLogger.fail(runId, e.getMessage());
        }
    }
}
