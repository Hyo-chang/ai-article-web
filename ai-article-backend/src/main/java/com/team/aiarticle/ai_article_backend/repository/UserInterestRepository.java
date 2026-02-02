package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserInterestRepository extends JpaRepository<UserInterest, Integer> {

    List<UserInterest> findByUserUserId(Integer userId);

    void deleteByUserUserId(Integer userId);

    @Query("SELECT ui.categoryCode FROM UserInterest ui WHERE ui.user.userId = :userId AND ui.categoryCode IS NOT NULL")
    List<String> findCategoryCodesByUserId(@Param("userId") Integer userId);

    @Query("SELECT k.keywordName FROM UserInterest ui JOIN ui.keyword k WHERE ui.user.userId = :userId")
    List<String> findKeywordNamesByUserId(@Param("userId") Integer userId);
}
