package com.team.aiarticle.ai_article_backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    private static final Logger log = LoggerFactory.getLogger(WebClientConfig.class);

    @Value("${rag.api.key}")
    private String ragApiKey;

    @Value("${rag.api.timeout}")
    private Long ragApiTimeout;

    @Value("${rag.api.url}")
    private String ragApiUrl;

    @Bean
    public WebClient webClient() {
        return WebClient.builder().build();
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.info(">>> WebClient Request: {} {}", clientRequest.method(), clientRequest.url());
            clientRequest.headers().forEach((name, values) ->
                    values.forEach(value -> log.info("  {}: {}", name, value)));
            return Mono.just(clientRequest);
        });
    }

    @Bean
    @Qualifier("ragWebClient")
    public WebClient ragWebClient() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofMillis(ragApiTimeout));

        return WebClient.builder()
                .baseUrl(ragApiUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader("x-api-key", ragApiKey)
                .filter(logRequest())
                .build();
    }
}
