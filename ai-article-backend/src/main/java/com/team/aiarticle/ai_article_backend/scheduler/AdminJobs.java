package com.team.aiarticle.ai_article_backend.scheduler;

public final class AdminJobs {
    private AdminJobs() {}

    public static final String PROCESS_NEW = "process_new_articles";
    public static final String ANALYZE_KEYWORDS = "analyze_keywords";
    public static final String AGGREGATE_TREND_24H = "aggregate_trend_24h"; // 코드 내 24h라 이름은 24h로 둠
    public static final String PURGE_TREND_48H = "purge_trend_snapshot";
}
