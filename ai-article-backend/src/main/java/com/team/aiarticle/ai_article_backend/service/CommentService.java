package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.CommentCreateRequest;
import com.team.aiarticle.ai_article_backend.dto.CommentResponse;
import com.team.aiarticle.ai_article_backend.entity.Comment;
import com.team.aiarticle.ai_article_backend.entity.Post;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.repository.CommentLikeRepository;
import com.team.aiarticle.ai_article_backend.repository.CommentRepository;
import com.team.aiarticle.ai_article_backend.repository.PostRepository;
import com.team.aiarticle.ai_article_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    // 댓글 작성
    public Comment createComment(Integer userId, Integer postId, CommentCreateRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다."));

        Post post = postRepository.findByPostIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new NoSuchElementException("게시글을 찾을 수 없습니다."));

        Comment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new NoSuchElementException("부모 댓글을 찾을 수 없습니다."));
        }

        Comment comment = Comment.builder()
                .post(post)
                .author(author)
                .parentComment(parentComment)
                .content(request.getContent())
                .build();

        Comment savedComment = commentRepository.save(comment);

        // 게시글의 댓글 수 증가
        post.incrementCommentCount();
        postRepository.save(post);

        return savedComment;
    }

    // 댓글 수정
    public Comment updateComment(Integer commentId, Integer userId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NoSuchElementException("댓글을 찾을 수 없습니다."));

        if (comment.getIsDeleted()) {
            throw new NoSuchElementException("삭제된 댓글입니다.");
        }

        if (!comment.getAuthor().getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 댓글만 수정할 수 있습니다.");
        }

        comment.setContent(content);
        return commentRepository.save(comment);
    }

    // 댓글 삭제 (소프트 삭제)
    public void deleteComment(Integer commentId, Integer userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NoSuchElementException("댓글을 찾을 수 없습니다."));

        if (comment.getIsDeleted()) {
            throw new NoSuchElementException("이미 삭제된 댓글입니다.");
        }

        if (!comment.getAuthor().getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 댓글만 삭제할 수 있습니다.");
        }

        comment.setIsDeleted(true);
        commentRepository.save(comment);

        // 게시글의 댓글 수 감소
        Post post = comment.getPost();
        post.decrementCommentCount();
        postRepository.save(post);
    }

    // 게시글의 댓글 목록 조회
    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByPostId(Integer postId, Integer currentUserId) {
        List<Comment> rootComments = commentRepository
                .findByPostPostIdAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(postId);

        return rootComments.stream()
                .map(comment -> buildCommentResponse(comment, currentUserId))
                .collect(Collectors.toList());
    }

    private CommentResponse buildCommentResponse(Comment comment, Integer currentUserId) {
        boolean isLiked = false;
        boolean isAuthor = false;

        if (currentUserId != null) {
            isLiked = commentLikeRepository.existsByCommentCommentIdAndUserUserId(
                    comment.getCommentId(), currentUserId);
            isAuthor = comment.getAuthor().getUserId().equals(currentUserId);
        }

        // 대댓글 조회
        List<Comment> replies = commentRepository
                .findByParentCommentCommentIdAndIsDeletedFalseOrderByCreatedAtAsc(comment.getCommentId());

        List<CommentResponse> replyResponses = replies.stream()
                .map(reply -> buildCommentResponse(reply, currentUserId))
                .collect(Collectors.toList());

        return CommentResponse.from(comment, isLiked, isAuthor, replyResponses);
    }
}
