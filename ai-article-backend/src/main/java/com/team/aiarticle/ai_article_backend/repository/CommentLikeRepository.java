package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Integer> {

    Optional<CommentLike> findByCommentCommentIdAndUserUserId(Integer commentId, Integer userId);

    boolean existsByCommentCommentIdAndUserUserId(Integer commentId, Integer userId);

    void deleteByCommentCommentIdAndUserUserId(Integer commentId, Integer userId);

    int countByCommentCommentId(Integer commentId);
}
