package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Integer> {

    Optional<PostLike> findByPostPostIdAndUserUserId(Integer postId, Integer userId);

    boolean existsByPostPostIdAndUserUserId(Integer postId, Integer userId);

    void deleteByPostPostIdAndUserUserId(Integer postId, Integer userId);

    int countByPostPostId(Integer postId);
}
