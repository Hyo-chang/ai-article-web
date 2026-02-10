package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.entity.*;
import com.team.aiarticle.ai_article_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class LikeService {

    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    // 게시글 좋아요 토글
    public boolean togglePostLike(Integer postId, Integer userId) {
        Post post = postRepository.findByPostIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new NoSuchElementException("게시글을 찾을 수 없습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다."));

        Optional<PostLike> existingLike = postLikeRepository.findByPostPostIdAndUserUserId(postId, userId);

        if (existingLike.isPresent()) {
            // 좋아요 취소
            postLikeRepository.delete(existingLike.get());
            post.decrementLikeCount();
            postRepository.save(post);
            log.info("게시글 좋아요 취소: postId={}, userId={}", postId, userId);
            return false;
        } else {
            // 좋아요 추가
            PostLike like = PostLike.builder()
                    .post(post)
                    .user(user)
                    .build();
            postLikeRepository.save(like);
            post.incrementLikeCount();
            postRepository.save(post);
            log.info("게시글 좋아요 추가: postId={}, userId={}", postId, userId);
            return true;
        }
    }

    // 댓글 좋아요 토글
    public boolean toggleCommentLike(Integer commentId, Integer userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NoSuchElementException("댓글을 찾을 수 없습니다."));

        if (comment.getIsDeleted()) {
            throw new NoSuchElementException("삭제된 댓글입니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다."));

        Optional<CommentLike> existingLike = commentLikeRepository.findByCommentCommentIdAndUserUserId(commentId, userId);

        if (existingLike.isPresent()) {
            // 좋아요 취소
            commentLikeRepository.delete(existingLike.get());
            comment.decrementLikeCount();
            commentRepository.save(comment);
            log.info("댓글 좋아요 취소: commentId={}, userId={}", commentId, userId);
            return false;
        } else {
            // 좋아요 추가
            CommentLike like = CommentLike.builder()
                    .comment(comment)
                    .user(user)
                    .build();
            commentLikeRepository.save(like);
            comment.incrementLikeCount();
            commentRepository.save(comment);
            log.info("댓글 좋아요 추가: commentId={}, userId={}", commentId, userId);
            return true;
        }
    }
}
