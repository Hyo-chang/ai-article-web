package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.AnalyzeUrlRequest;
import com.team.aiarticle.ai_article_backend.dto.AnalyzeUrlResponse;
import com.team.aiarticle.ai_article_backend.dto.ChatDto;
import com.team.aiarticle.ai_article_backend.dto.RagRequestDto;
import com.team.aiarticle.ai_article_backend.dto.RagResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
// @RequiredArgsConstructor // <- 이 부분을 삭제하거나 주석 처리합니다.
@Slf4j
public class RagAiService {

    private final WebClient ragAiWebClient;

    // 생성자를 직접 작성하고, 주입받을 WebClient 파라미터에 @Qualifier를 명시합니다.
    public RagAiService(@Qualifier("ragWebClient") WebClient ragAiWebClient) {
        this.ragAiWebClient = ragAiWebClient;
    }

    /**
     * AI 서버에 기사 분석을 요청하고 비동기적으로 결과를 받아옵니다.
     * (메소드의 나머지 부분은 동일합니다)
     */
    public Mono<RagResponseDto> requestAnalysis(RagRequestDto requestDto) {
        log.info("AI 서버로 기사 분석 요청을 전송합니다. (제목: {})", requestDto.getArticleTitle());

        return ragAiWebClient.post()
                .uri("/analyze")
                .bodyValue(requestDto)
                .retrieve()
                .bodyToMono(RagResponseDto.class)
                .doOnSuccess(response -> log.info("AI 서버로부터 응답을 성공적으로 수신했습니다."))
                .doOnError(error -> log.error("AI 서버와 통신 중 오류가 발생했습니다.", error));
    }

    /**
     * AI 서버에 채팅 요청을 전송하고 응답을 받아옵니다.
     */
    public Mono<ChatDto.Response> requestChat(ChatDto.Request requestDto) {
        log.info("AI 서버로 채팅 요청을 전송합니다. (질문 길이: {})",
                requestDto.getQuestion() != null ? requestDto.getQuestion().length() : 0);

        return ragAiWebClient.post()
                .uri("/chat")
                .bodyValue(requestDto)
                .retrieve()
                .bodyToMono(ChatDto.Response.class)
                .doOnSuccess(response -> log.info("AI 채팅 응답을 성공적으로 수신했습니다."))
                .doOnError(error -> log.error("AI 채팅 중 오류가 발생했습니다.", error));
    }

    /**
     * AI 서버에 URL 분석 요청을 전송하고 응답을 받아옵니다.
     * (크롤링 + AI 분석을 RAG AI 서버에서 직접 수행)
     */
    public Mono<AnalyzeUrlResponse> requestAnalyzeUrl(String articleUrl) {
        log.info("AI 서버로 URL 분석 요청을 전송합니다. (URL: {})", articleUrl);

        AnalyzeUrlRequest request = new AnalyzeUrlRequest(articleUrl);

        return ragAiWebClient.post()
                .uri("/analyze-url")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AnalyzeUrlResponse.class)
                .timeout(Duration.ofMinutes(3))
                .doOnSuccess(response -> log.info("AI URL 분석 응답을 성공적으로 수신했습니다. (success: {})", response.isSuccess()))
                .doOnError(error -> log.error("AI URL 분석 중 오류가 발생했습니다.", error));
    }
}