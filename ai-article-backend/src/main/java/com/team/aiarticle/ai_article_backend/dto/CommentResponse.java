package com.team.aiarticle.ai_article_backend.dto;

import com.team.aiarticle.ai_article_backend.entity.Comment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CommentResponse {
    private Integer commentId;
    private Integer postId;
    private Integer parentCommentId;
    private String content;
    private String authorName;
    private Integer authorId;
    private String authorProfileImageUrl;
    private Integer likeCount;
    private Boolean isLikedByCurrentUser;
    private Boolean isAuthor;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CommentResponse> replies;

    public static CommentResponse from(Comment comment, boolean isLiked, boolean isAuthor, List<CommentResponse> replies) {
        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .postId(comment.getPost().getPostId())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getCommentId() : null)
                .content(comment.getContent())
                .authorName(comment.getAuthor().getUsername())
                .authorId(comment.getAuthor().getUserId())
                .authorProfileImageUrl(comment.getAuthor().getProfileImageUrl())
                .likeCount(comment.getLikeCount())
                .isLikedByCurrentUser(isLiked)
                .isAuthor(isAuthor)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .replies(replies)
                .build();
    }
}
