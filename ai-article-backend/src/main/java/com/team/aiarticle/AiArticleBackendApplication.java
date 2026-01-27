package com.team.aiarticle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@org.springframework.scheduling.annotation.EnableAsync
@EnableJpaAuditing
@SpringBootApplication(scanBasePackages = "com.team.aiarticle.ai_article_backend")
@EntityScan(basePackages = {
        "com.team.aiarticle.ai_article_backend.entity"
})
@EnableJpaRepositories(basePackages = {
        "com.team.aiarticle.ai_article_backend.repository"
})
@EnableScheduling
public class AiArticleBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiArticleBackendApplication.class, args);
    }
}
