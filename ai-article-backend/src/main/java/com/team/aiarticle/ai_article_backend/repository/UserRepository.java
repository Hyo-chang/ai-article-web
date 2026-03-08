package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    User findByUsername(String username);

    // VK integration convenience methods
    User findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // OAuth integration
    User findByProviderAndProviderId(String provider, String providerId);

    // 이메일 구독자 조회 (특정 시간에 발송할 구독자)
    List<User> findByEmailSubscribedTrueAndNotificationHour(int hour);
}
