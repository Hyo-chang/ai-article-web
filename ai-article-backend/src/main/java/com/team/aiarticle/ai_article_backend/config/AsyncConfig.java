package com.team.aiarticle.ai_article_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {
    // 필요 시 @Bean ThreadPoolTaskExecutor 등록 가능
}
