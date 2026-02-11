package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.*;
import com.team.aiarticle.ai_article_backend.entity.Comment;
import com.team.aiarticle.ai_article_backend.entity.Post;
import com.team.aiarticle.ai_article_backend.security.services.UserDetailsImpl;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    // SecurityContext에서 현재 로그인 사용자 ID 추출
    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        if (auth.getPrincipal() instanceof UserDetailsImpl details) {
            return details.getUserId();
        }
        return null;
    }

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
            @PathVariable Integer postId) {
        Integer currentUserId = getCurrentUserId();
        return ResponseEntity.ok(postService.getPostDetail(postId, currentUserId));
    }

    // 게시글 작성
    @PostMapping
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestBody PostCreateRequest request) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        Post post = postService.createPost(userId, request);
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
            @RequestBody PostUpdateRequest request) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        postService.updatePost(postId, userId, request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "게시글이 수정되었습니다."
        ));
    }

    // 게시글 삭제
    @DeleteMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> deletePost(
            @PathVariable Integer postId) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        postService.deletePost(postId, userId);
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
            @PathVariable Integer postId) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        boolean isLiked = likeService.togglePostLike(postId, userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "isLiked", isLiked,
                "message", isLiked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다."
        ));
    }

    // 댓글 목록 조회
    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Integer postId) {
        Integer currentUserId = getCurrentUserId();
        return ResponseEntity.ok(commentService.getCommentsByPostId(postId, currentUserId));
    }

    // 댓글 작성
    @PostMapping("/{postId}/comments")
    public ResponseEntity<Map<String, Object>> createComment(
            @PathVariable Integer postId,
            @RequestBody CommentCreateRequest request) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        Comment comment = commentService.createComment(userId, postId, request);
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
            @RequestBody Map<String, String> request) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        commentService.updateComment(commentId, userId, request.get("content"));
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "댓글이 수정되었습니다."
        ));
    }

    // 댓글 삭제
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable Integer commentId) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "댓글이 삭제되었습니다."
        ));
    }

    // 댓글 좋아요 토글
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<Map<String, Object>> toggleCommentLike(
            @PathVariable Integer commentId) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        boolean isLiked = likeService.toggleCommentLike(commentId, userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "isLiked", isLiked,
                "message", isLiked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다."
        ));
    }
}
