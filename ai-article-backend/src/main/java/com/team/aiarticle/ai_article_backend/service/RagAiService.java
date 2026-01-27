package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.RagRequestDto;
import com.team.aiarticle.ai_article_backend.dto.RagResponseDto;
// import lombok.RequiredArgsConstructor; // 이 어노테이션을 삭제하거나 주석 처리합니다.
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

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
}