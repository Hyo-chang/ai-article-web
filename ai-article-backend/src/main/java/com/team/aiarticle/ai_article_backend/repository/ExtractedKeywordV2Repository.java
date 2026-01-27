package com.team.aiarticle.ai_article_backend.repository;

import com.team.aiarticle.ai_article_backend.entity.ExtractedKeywordV2;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExtractedKeywordV2Repository extends JpaRepository<ExtractedKeywordV2, Integer> {
}
