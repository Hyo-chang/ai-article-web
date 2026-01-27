package com.team.aiarticle.ai_article_backend.scheduler;

import com.team.aiarticle.ai_article_backend.service.TrendAggregationService;
import com.team.aiarticle.ai_article_backend.service.admin.AdminJobGate;
import com.team.aiarticle.ai_article_backend.service.admin.AdminRunLogger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class TrendScheduler {

    private final TrendAggregationService trendService;
    private final AdminJobGate gate;
    private final AdminRunLogger runLogger;

    // ❶ 3시간마다 “최근 24시간” 스냅샷 재계산
    @Scheduled(cron = "0 0 */3 * * *", zone = "Asia/Seoul")
    public void build24hTrends() {
        if (gate.isPaused(AdminJobs.AGGREGATE_TREND_24H)) {
            log.info("[Trend] '{}' paused - skip", AdminJobs.AGGREGATE_TREND_24H);
            return;
        }
        log.info("[Trend] Aggregate last 24h trends");
        long runId = runLogger.start(AdminJobs.AGGREGATE_TREND_24H, null);
        try {
            trendService.aggregateLast24hForAllCategories();
            runLogger.success(runId, "OK");
        } catch (Exception e) {
            runLogger.fail(runId, e.getMessage());
            throw e;
        }
    }

    // ❷ 6시간마다 48시간 이전 스냅샷 정리
    @Scheduled(cron = "0 0 */6 * * *", zone = "Asia/Seoul")
    public void purgeOld() {
        if (gate.isPaused(AdminJobs.PURGE_TREND_48H)) {
            log.info("[Trend] '{}' paused - skip", AdminJobs.PURGE_TREND_48H);
            return;
        }
        long runId = runLogger.start(AdminJobs.PURGE_TREND_48H, null);
        try {
            long deleted = trendService.purgeOldSnapshots();
            log.info("[Trend] Purged snapshots older than 48h: {}", deleted);
            runLogger.success(runId, "deleted=" + deleted);
        } catch (Exception e) {
            runLogger.fail(runId, e.getMessage());
            throw e;
        }
    }
}
