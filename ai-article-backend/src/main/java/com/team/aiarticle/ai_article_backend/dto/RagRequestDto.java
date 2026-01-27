package com.team.aiarticle.ai_article_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI 서버(/analyze)로 기사 분석을 요청하기 위한 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RagRequestDto {

    /**
     * 분석할 기사 원문
     * Python: article_text
     */
    @JsonProperty("article_text")
    private String articleText;

    /**
     * 분석할 기사 제목
     * Python: article_title
     */
    @JsonProperty("article_title")
    private String articleTitle;

    /**
     * AI 서버가 참고할 핵심 키워드 리스트
     * Python: key_words
     */
    @JsonProperty("key_words")
    private List<String> keyWords;
}