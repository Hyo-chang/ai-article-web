package com.team.aiarticle.ai_article_backend.scheduler;

import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import com.team.aiarticle.ai_article_backend.repository.UserInterestRepository;
import com.team.aiarticle.ai_article_backend.repository.UserRepository;
import com.team.aiarticle.ai_article_backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailScheduler {

    private final UserRepository userRepository;
    private final UserInterestRepository userInterestRepository;
    private final ArticleV2Repository articleV2Repository;
    private final EmailService emailService;
    private final JdbcTemplate jdbc;

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Seoul") // 매 정시 실행
    public void sendScheduledEmails() {
        int currentHour = LocalTime.now(KST).getHour();
        List<User> subscribers = userRepository.findByEmailSubscribedTrueAndNotificationHour(currentHour);

        if (subscribers.isEmpty()) {
            log.info("[EMAIL-SCHEDULER] hour={}시 구독자 없음 - 스킵", currentHour);
            return;
        }

        log.info("[EMAIL-SCHEDULER] hour={}시 구독자={}명 발송 시작", currentHour, subscribers.size());
        int sent = 0, failed = 0;

        for (User user : subscribers) {
            try {
                List<String> categoryCodes = userInterestRepository.findCategoryCodesByUserId(user.getUserId());

                List<ArticleV2> articles;
                if (user.getEmailKeywords() != null && !user.getEmailKeywords().isBlank()) {
                    // keyword-based: match by title REGEXP
                    String pattern = java.util.Arrays.stream(user.getEmailKeywords().split(","))
                            .map(String::trim)
                            .filter(k -> !k.isBlank())
                            .collect(java.util.stream.Collectors.joining("|"));
                    articles = articleV2Repository.findTop3ByTitleRegexpAndSummarizeNotNull(pattern);
                    if (articles.isEmpty()) {
                        articles = articleV2Repository.findTop3ByOrderByArticleIdDesc();
                    }
                } else if (categoryCodes.isEmpty()) {
                    articles = articleV2Repository.findTop3ByOrderByArticleIdDesc();
                } else {
                    articles = articleV2Repository.findTop3ByCategoryCodesAndSummarizeNotNull(
                            categoryCodes, PageRequest.of(0, 3));
                    if (articles.isEmpty()) {
                        articles = articleV2Repository.findTop3ByOrderByArticleIdDesc();
                    }
                }

                emailService.sendNewsDigest(user, articles);
                sent++;
            } catch (Exception e) {
                log.error("[EMAIL-SCHEDULER] userId={} 처리 실패: {}", user.getUserId(), e.getMessage());
                failed++;
            }
        }

        String note = String.format("hour=%d sent=%d failed=%d", currentHour, sent, failed);
        log.info("[EMAIL-SCHEDULER] 완료: {}", note);
        jdbc.update("INSERT INTO admin_job_run(job_name, started_at, finished_at, status, note) VALUES(?,NOW(),NOW(),?,?)",
                "emailScheduler", "SUCCESS", note);
    }
}
