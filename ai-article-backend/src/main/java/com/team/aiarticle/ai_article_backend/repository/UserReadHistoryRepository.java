package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.UserReadHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserReadHistoryRepository extends JpaRepository<UserReadHistory, Integer> {

    Optional<UserReadHistory> findByUserUserIdAndArticleArticleId(Integer userId, Integer articleId);

    List<UserReadHistory> findByUserUserId(Integer userId, Pageable pageable);
}
