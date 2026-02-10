package com.team.aiarticle.ai_article_backend.dto;

import com.team.aiarticle.ai_article_backend.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostListResponse {
    private Integer postId;
    private String categoryCode;
    private String categoryName;
    private String title;
    private String authorName;
    private Integer authorId;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Boolean isPinned;
    private LocalDateTime createdAt;

    public static PostListResponse from(Post post) {
        return PostListResponse.builder()
                .postId(post.getPostId())
                .categoryCode(post.getCategory().getCategoryCode())
                .categoryName(post.getCategory().getCategoryName())
                .title(post.getTitle())
                .authorName(post.getAuthor().getUsername())
                .authorId(post.getAuthor().getUserId())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .isPinned(post.getIsPinned())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
