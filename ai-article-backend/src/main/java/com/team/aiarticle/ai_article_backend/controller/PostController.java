package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.*;
import com.team.aiarticle.ai_article_backend.entity.Comment;
import com.team.aiarticle.ai_article_backend.entity.Post;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.service.CommentService;
import com.team.aiarticle.ai_article_backend.service.LikeService;
import com.team.aiarticle.ai_article_backend.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

    private final PostService postService;
    private final CommentService commentService;
    private final LikeService likeService;

    // 카테고리 목록 조회
    @GetMapping("/categories")
    public ResponseEntity<List<PostCategoryResponse>> getCategories() {
        return ResponseEntity.ok(postService.getCategories());
    }

    // 게시글 목록 조회 (페이징)
    @GetMapping
    public ResponseEntity<Page<PostListResponse>> getPostList(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.getPostList(category, pageable));
    }

    // 게시글 상세 조회
    @GetMapping("/{postId}")
    public ResponseEntity<PostDetailResponse> getPostDetail(
            @PathVariable Integer postId,
            @AuthenticationPrincipal User currentUser) {
        Integer currentUserId = currentUser != null ? currentUser.getUserId() : null;
        return ResponseEntity.ok(postService.getPostDetail(postId, currentUserId));
    }

    // 게시글 작성
    @PostMapping
    public ResponseEntity<Map<String, Object>> createPost(
            @AuthenticationPrincipal User currentUser,
            @RequestBody PostCreateRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        Post post = postService.createPost(currentUser.getUserId(), request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "postId", post.getPostId(),
                "message", "게시글이 작성되었습니다."
        ));
    }

    // 게시글 수정
    @PutMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> updatePost(
            @PathVariable Integer postId,
            @AuthenticationPrincipal User currentUser,
            @RequestBody PostUpdateRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        postService.updatePost(postId, currentUser.getUserId(), request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "게시글이 수정되었습니다."
        ));
    }

    // 게시글 삭제
    @DeleteMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable Integer postId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        postService.deletePost(postId, currentUser.getUserId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "게시글이 삭제되었습니다."
        ));
    }

    // 게시글 검색
    @GetMapping("/search")
    public ResponseEntity<Page<PostListResponse>> searchPosts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.searchPosts(q, pageable));
    }

    // 게시글 좋아요 토글
    @PostMapping("/{postId}/like")
    public ResponseEntity<Map<String, Object>> togglePostLike(
            @PathVariable Integer postId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        boolean isLiked = likeService.togglePostLike(postId, currentUser.getUserId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "isLiked", isLiked,
                "message", isLiked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다."
        ));
    }

    // 댓글 목록 조회
    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Integer postId,
            @AuthenticationPrincipal User currentUser) {
        Integer currentUserId = currentUser != null ? currentUser.getUserId() : null;
        return ResponseEntity.ok(commentService.getCommentsByPostId(postId, currentUserId));
    }

    // 댓글 작성
    @PostMapping("/{postId}/comments")
    public ResponseEntity<Map<String, Object>> createComment(
            @PathVariable Integer postId,
            @AuthenticationPrincipal User currentUser,
            @RequestBody CommentCreateRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        Comment comment = commentService.createComment(currentUser.getUserId(), postId, request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "commentId", comment.getCommentId(),
                "message", "댓글이 작성되었습니다."
        ));
    }

    // 댓글 수정
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<Map<String, Object>> updateComment(
            @PathVariable Integer commentId,
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        commentService.updateComment(commentId, currentUser.getUserId(), request.get("content"));
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "댓글이 수정되었습니다."
        ));
    }

    // 댓글 삭제
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable Integer commentId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        commentService.deleteComment(commentId, currentUser.getUserId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "댓글이 삭제되었습니다."
        ));
    }

    // 댓글 좋아요 토글
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<Map<String, Object>> toggleCommentLike(
            @PathVariable Integer commentId,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        boolean isLiked = likeService.toggleCommentLike(commentId, currentUser.getUserId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "isLiked", isLiked,
                "message", isLiked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다."
        ));
    }
}
