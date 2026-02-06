package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.ChatDto;
import com.team.aiarticle.ai_article_backend.dto.RagRequestDto;
import com.team.aiarticle.ai_article_backend.dto.RagResponseDto;
import com.team.aiarticle.ai_article_backend.service.RagAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/analysis") // AI 분석 관련 API 엔드포인트
@RequiredArgsConstructor
@Slf4j
public class RagArticleAnalysisController { // 파일명에 맞춰 클래스명 변경

    private final RagAiService ragAiService;

    /**
     * AI 서버에 기사 분석을 요청하고 결과를 반환합니다.
     *
     * @param requestDto 분석할 기사 정보를 담은 DTO
     * @return AI 서버로부터 받은 분석 결과를 담은 Mono<ResponseEntity<RagResponseDto>>
     */
    @PostMapping("/rag")
    public Mono<ResponseEntity<RagResponseDto>> analyzeArticle(@RequestBody RagRequestDto requestDto) {
        log.info("클라이언트로부터 기사 분석 요청 수신: {}", requestDto.getArticleTitle());

        return ragAiService.requestAnalysis(requestDto)
                .map(response -> {
                    log.info("AI 분석 결과 반환 완료.");
                    return ResponseEntity.ok(response); // 성공 시 200 OK와 함께 응답 반환
                })
                .onErrorResume(e -> {
                    log.error("기사 분석 중 오류 발생: {}", e.getMessage());
                    // 오류 발생 시 500 Internal Server Error 반환
                    // 실제 프로덕션에서는 더 상세한 오류 처리 및 메시지 커스터마이징이 필요합니다.
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }

    /**
     * AI 서버에 채팅 요청을 보내고 응답을 반환합니다.
     *
     * @param requestDto 채팅 요청 정보 (기사 맥락, 질문, 선택 텍스트)
     * @return AI 응답을 담은 Mono<ResponseEntity<ChatDto.Response>>
     */
    @PostMapping("/chat")
    public Mono<ResponseEntity<ChatDto.Response>> chatWithArticle(@RequestBody ChatDto.Request requestDto) {
        log.info("클라이언트로부터 AI 채팅 요청 수신");

        return ragAiService.requestChat(requestDto)
                .map(response -> {
                    log.info("AI 채팅 응답 반환 완료.");
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(e -> {
                    log.error("AI 채팅 중 오류 발생: {}", e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }
}

