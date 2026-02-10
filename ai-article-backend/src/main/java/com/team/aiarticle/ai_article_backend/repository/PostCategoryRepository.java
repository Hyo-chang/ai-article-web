package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.PostCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostCategoryRepository extends JpaRepository<PostCategory, Integer> {
    Optional<PostCategory> findByCategoryCode(String categoryCode);
    List<PostCategory> findAllByOrderByDisplayOrderAsc();
}
