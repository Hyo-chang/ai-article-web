package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.CategoryKeywordTrendSnapshot;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryKeywordTrendRepository extends JpaRepository<CategoryKeywordTrendSnapshot, Long> {

    @Query("""
        SELECT k.keywordName
        FROM CategoryKeywordTrendSnapshot s
        JOIN s.keyword k
        WHERE s.categoryCode = :categoryCode
        ORDER BY s.scoreSum DESC, s.docCount DESC, k.keywordName ASC
    """)
    List<String> findTopKeywordsByCategory(@Param("categoryCode") String categoryCode, Pageable pageable);
}
