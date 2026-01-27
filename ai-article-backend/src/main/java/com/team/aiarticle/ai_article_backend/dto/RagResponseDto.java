package com.team.aiarticle.ai_article_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * AI 서버(/analyze)로부터 받은 분석 결과를 담는 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RagResponseDto {

    /**
     * AI가 생성한 기사 요약문
     * Python: summary
     */
    private String summary;

    /**
     * 각 키워드에 대한 정의
     * Python: definitions (Dictionary)
     */
    private Map<String, String> definitions;
}