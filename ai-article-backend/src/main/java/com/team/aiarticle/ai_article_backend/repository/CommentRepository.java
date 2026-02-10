package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Integer> {

    List<Comment> findByPostPostIdAndIsDeletedFalseOrderByCreatedAtAsc(Integer postId);

    List<Comment> findByPostPostIdAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(
        Integer postId);

    List<Comment> findByParentCommentCommentIdAndIsDeletedFalseOrderByCreatedAtAsc(
        Integer parentCommentId);

    int countByPostPostIdAndIsDeletedFalse(Integer postId);
}
