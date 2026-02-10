package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.*;
import com.team.aiarticle.ai_article_backend.entity.*;
import com.team.aiarticle.ai_article_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class PostService {

    private final PostRepository postRepository;
    private final PostCategoryRepository categoryRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;

    // 카테고리 목록 조회
    @Transactional(readOnly = true)
    public List<PostCategoryResponse> getCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(PostCategoryResponse::from)
                .collect(Collectors.toList());
    }

    // 게시글 작성
    public Post createPost(Integer userId, PostCreateRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다."));

        PostCategory category = categoryRepository.findByCategoryCode(request.getCategoryCode())
                .orElseThrow(() -> new NoSuchElementException("카테고리를 찾을 수 없습니다."));

        Post post = Post.builder()
                .author(author)
                .category(category)
                .title(request.getTitle())
                .content(request.getContent())
                .build();

        return postRepository.save(post);
    }

    // 게시글 목록 조회 (페이징)
    @Transactional(readOnly = true)
    public Page<PostListResponse> getPostList(String categoryCode, Pageable pageable) {
        Page<Post> posts;

        if (categoryCode != null && !categoryCode.isEmpty()) {
            PostCategory category = categoryRepository.findByCategoryCode(categoryCode)
                    .orElseThrow(() -> new NoSuchElementException("카테고리를 찾을 수 없습니다."));
            posts = postRepository.findByCategoryAndIsDeletedFalseOrderByCreatedAtDesc(category, pageable);
        } else {
            posts = postRepository.findByIsDeletedFalseOrderByCreatedAtDesc(pageable);
        }

        return posts.map(PostListResponse::from);
    }

    // 게시글 상세 조회 (조회수 증가 포함)
    public PostDetailResponse getPostDetail(Integer postId, Integer currentUserId) {
        Post post = postRepository.findByPostIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new NoSuchElementException("게시글을 찾을 수 없습니다."));

        // 조회수 증가
        post.incrementViewCount();
        postRepository.save(post);

        boolean isLiked = false;
        boolean isAuthor = false;

        if (currentUserId != null) {
            isLiked = postLikeRepository.existsByPostPostIdAndUserUserId(postId, currentUserId);
            isAuthor = post.getAuthor().getUserId().equals(currentUserId);
        }

        // 댓글 조회
        List<CommentResponse> comments = getCommentsWithReplies(postId, currentUserId);

        return PostDetailResponse.from(post, isLiked, isAuthor, comments);
    }

    // 게시글 수정
    public Post updatePost(Integer postId, Integer userId, PostUpdateRequest request) {
        Post post = postRepository.findByPostIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new NoSuchElementException("게시글을 찾을 수 없습니다."));

        if (!post.getAuthor().getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 게시글만 수정할 수 있습니다.");
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());

        return postRepository.save(post);
    }

    // 게시글 삭제 (소프트 삭제)
    public void deletePost(Integer postId, Integer userId) {
        Post post = postRepository.findByPostIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new NoSuchElementException("게시글을 찾을 수 없습니다."));

        if (!post.getAuthor().getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 게시글만 삭제할 수 있습니다.");
        }

        post.setIsDeleted(true);
        postRepository.save(post);
    }

    // 게시글 검색
    @Transactional(readOnly = true)
    public Page<PostListResponse> searchPosts(String keyword, Pageable pageable) {
        return postRepository.searchByKeyword(keyword, pageable)
                .map(PostListResponse::from);
    }

    // 댓글과 대댓글 조회
    private List<CommentResponse> getCommentsWithReplies(Integer postId, Integer currentUserId) {
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
