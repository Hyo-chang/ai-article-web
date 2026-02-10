package com.team.aiarticle.ai_article_backend.dto;

import com.team.aiarticle.ai_article_backend.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PostDetailResponse {
    private Integer postId;
    private String categoryCode;
    private String categoryName;
    private String title;
    private String content;
    private String authorName;
    private Integer authorId;
    private String authorProfileImageUrl;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Boolean isLikedByCurrentUser;
    private Boolean isAuthor;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CommentResponse> comments;

    public static PostDetailResponse from(Post post, boolean isLiked, boolean isAuthor, List<CommentResponse> comments) {
        return PostDetailResponse.builder()
                .postId(post.getPostId())
                .categoryCode(post.getCategory().getCategoryCode())
                .categoryName(post.getCategory().getCategoryName())
                .title(post.getTitle())
                .content(post.getContent())
                .authorName(post.getAuthor().getUsername())
                .authorId(post.getAuthor().getUserId())
                .authorProfileImageUrl(post.getAuthor().getProfileImageUrl())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .isLikedByCurrentUser(isLiked)
                .isAuthor(isAuthor)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .comments(comments)
                .build();
    }
}
