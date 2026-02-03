package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.UserBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBookmarkRepository extends JpaRepository<UserBookmark, Integer> {

    Optional<UserBookmark> findByUserUserIdAndArticleArticleId(Integer userId, Integer articleId);

    boolean existsByUserUserIdAndArticleArticleId(Integer userId, Integer articleId);

    void deleteByUserUserIdAndArticleArticleId(Integer userId, Integer articleId);

    @Query("SELECT b.article.articleId FROM UserBookmark b WHERE b.user.userId = :userId")
    List<Integer> findArticleIdsByUserId(@Param("userId") Integer userId);

    List<UserBookmark> findByUserUserIdOrderByCreatedAtDesc(Integer userId);
}
