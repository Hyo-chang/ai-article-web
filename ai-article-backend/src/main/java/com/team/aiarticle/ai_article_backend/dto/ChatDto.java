package com.team.aiarticle.ai_article_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 채팅 요청/응답 DTO
 */
public class ChatDto {

    /**
     * AI 채팅 요청 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        /**
         * 기사 본문 또는 요약 (맥락)
         */
        @JsonProperty("article_context")
        private String articleContext;

        /**
         * 사용자 질문
         */
        private String question;

        /**
         * 선택된 텍스트 (있는 경우)
         */
        private String snippet;
    }

    /**
     * AI 채팅 응답 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        /**
         * AI 응답
         */
        private String answer;
    }
}
