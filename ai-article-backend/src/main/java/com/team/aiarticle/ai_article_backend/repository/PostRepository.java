package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.Post;
import com.team.aiarticle.ai_article_backend.entity.PostCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Integer> {

    // 공지글(isPinned) 우선, 그 다음 최신순 정렬
    Page<Post> findByCategoryAndIsDeletedFalseOrderByIsPinnedDescCreatedAtDesc(
        PostCategory category, Pageable pageable);

    Page<Post> findByIsDeletedFalseOrderByIsPinnedDescCreatedAtDesc(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY p.isPinned DESC, p.createdAt DESC")
    Page<Post> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<Post> findByAuthorUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Integer userId);

    Optional<Post> findByPostIdAndIsDeletedFalse(Integer postId);
}
