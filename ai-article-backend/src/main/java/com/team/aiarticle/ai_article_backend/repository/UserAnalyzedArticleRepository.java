package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.UserAnalyzedArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAnalyzedArticleRepository extends JpaRepository<UserAnalyzedArticle, Integer> {

    List<UserAnalyzedArticle> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    boolean existsByUserUserIdAndArticleUrl(Integer userId, String articleUrl);
}
