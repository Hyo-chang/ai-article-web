package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.CategoryKeywordTrendSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CategoryKeywordTrendSnapshotRepository
        extends JpaRepository<CategoryKeywordTrendSnapshot, Long> {

    List<CategoryKeywordTrendSnapshot> findTop50ByCategoryCodeAndWindowStartAndWindowEndOrderByScoreSumDesc(
            String categoryCode, LocalDateTime windowStart, LocalDateTime windowEnd);

    @Modifying
    @Query("DELETE FROM CategoryKeywordTrendSnapshot s WHERE s.generatedAt < :threshold")
    int deleteByGeneratedAtBefore(@Param("threshold") LocalDateTime threshold);
}
