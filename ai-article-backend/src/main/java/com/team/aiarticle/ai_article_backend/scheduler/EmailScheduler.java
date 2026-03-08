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

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Seoul") // 매 정시 실행
    public void sendScheduledEmails() {
        int currentHour = LocalTime.now(KST).getHour();
        List<User> subscribers = userRepository.findByEmailSubscribedTrueAndNotificationHour(currentHour);

        if (subscribers.isEmpty()) {
            return;
        }

        log.info("[EMAIL-SCHEDULER] hour={} 구독자={}명", currentHour, subscribers.size());

        for (User user : subscribers) {
            try {
                List<String> categoryCodes = userInterestRepository.findCategoryCodesByUserId(user.getUserId());

                List<ArticleV2> articles;
                if (categoryCodes.isEmpty()) {
                    // 관심 카테고리 없으면 최신 기사 3개
                    articles = articleV2Repository.findTop3ByOrderByArticleIdDesc();
                } else {
                    articles = articleV2Repository.findTop3ByCategoryCodesAndSummarizeNotNull(
                            categoryCodes, PageRequest.of(0, 3));
                    if (articles.isEmpty()) {
                        articles = articleV2Repository.findTop3ByOrderByArticleIdDesc();
                    }
                }

                emailService.sendNewsDigest(user, articles);
            } catch (Exception e) {
                log.error("[EMAIL-SCHEDULER] userId={} 처리 실패: {}", user.getUserId(), e.getMessage());
            }
        }

        log.info("[EMAIL-SCHEDULER] hour={} 완료", currentHour);
    }
}
