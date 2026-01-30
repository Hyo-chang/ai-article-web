package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.ManualCrawlResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class CrawlingBridgeService {

    private static final Logger log = LoggerFactory.getLogger(CrawlingBridgeService.class);

    private final String pythonCommand;
    private final String scriptPath;
    private final String backendEndpoint;
    private final Duration timeout;
    private final double fastSleepMin;
    private final double fastSleepMax;

    public CrawlingBridgeService(
            @Value("${crawler.python:python3}") String pythonCommand,
            @Value("${crawler.script:src/crawling.py}") String scriptPath,
            @Value("${crawler.backend-endpoint:http://localhost:8080/api/articles}") String backendEndpoint,
            @Value("${crawler.timeout-seconds:120}") long timeoutSeconds,
            @Value("${crawler.sleep-min:0.1}") double fastSleepMin,
            @Value("${crawler.sleep-max:0.3}") double fastSleepMax
    ) {
        this.pythonCommand = pythonCommand;
        this.scriptPath = scriptPath;
        this.backendEndpoint = backendEndpoint;
        this.timeout = Duration.ofSeconds(Math.max(1, timeoutSeconds));
        this.fastSleepMin = Math.min(fastSleepMin, fastSleepMax);
        this.fastSleepMax = Math.max(fastSleepMin, fastSleepMax);
    }

    public ManualCrawlResponse crawlSingleArticle(String articleUrl) {
        if (articleUrl == null || articleUrl.isBlank()) {
            throw new IllegalArgumentException("기사 URL이 비어 있습니다.");
        }

        Path script = Paths.get(scriptPath).toAbsolutePath().normalize();
        if (!Files.exists(script)) {
            throw new IllegalStateException("crawling.py를 찾을 수 없습니다: " + script);
        }

        List<String> command = new ArrayList<>();
        String pythonExecutable = resolvePythonExecutable();
        command.add(pythonExecutable);
        command.add(script.toString());
        command.add("--article-url");
        command.add(articleUrl);
        // Removed --max-articles, --sleep-min, --sleep-max, --once as they are not parsed by crawling.py's argparse
        command.add("--wait-min");
        command.add("0"); // Use 0 for single article immediate processing
        command.add("--wait-max");
        command.add("0"); // Use 0 for single article immediate processing
        // Removed --loop and "False" as crawling.py's argparse defines --loop as action="store_true"
        command.add("--backend-endpoint");
        command.add(backendEndpoint);

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);

        StringBuilder logBuilder = new StringBuilder();
        int exitCode = -1;
        try {
            Process process = pb.start();
            ExecutorService executor = Executors.newSingleThreadExecutor();
            executor.submit(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        logBuilder.append(line).append('\n');
                    }
                } catch (IOException ignored) {
                    // 로그 스트림을 비우는 용도이므로 예외는 무시
                }
            });

            boolean finished = process.waitFor(timeout.toSeconds(), TimeUnit.SECONDS);
            executor.shutdown();
            executor.awaitTermination(5, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                throw new IllegalStateException("crawling.py 실행이 제한 시간 내에 종료되지 않았습니다.");
            }
            exitCode = process.exitValue();
        } catch (IOException e) {
            throw new IllegalStateException("crawling.py 실행에 실패했습니다.", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("crawling.py 실행이 인터럽트되었습니다.", e);
        }

        boolean success = exitCode == 0;
        return new ManualCrawlResponse(success, exitCode, logBuilder.toString());
    }

    private String resolvePythonExecutable() {
        Path configuredPath = resolveToAbsolute(pythonCommand);
        if (isUsableExecutable(configuredPath)) {
            return configuredPath.toString();
        }
        if (Files.exists(configuredPath)) {
            log.warn("crawler.python 경로 '{}' 가 존재하지만 실행 권한이 없어 사용할 수 없습니다.", configuredPath);
        }

        List<String> fallbackPaths = List.of(
                "venv/bin/python3",
                "venv/bin/python",
                ".venv/bin/python3",
                ".venv/bin/python",
                "venv/Scripts/python.exe",
                ".venv/Scripts/python.exe"
        );

        for (String fallback : fallbackPaths) {
            Path candidate = resolveToAbsolute(fallback);
            if (isUsableExecutable(candidate)) {
                log.info("crawler.python '{}' 대신 '{}' 경로를 사용합니다.", pythonCommand, candidate);
                return candidate.toString();
            }
        }

        List<String> fallbackCommands = List.of("python3", "python", "py");
        for (String fallbackCommand : fallbackCommands) {
            log.info("crawler.python '{}' 대신 PATH 에서 '{}' 실행을 시도합니다.", pythonCommand, fallbackCommand);
            return fallbackCommand;
        }

        log.warn("crawler.python 설정 '{}' 경로를 찾을 수 없습니다. 커맨드 이름 그대로 실행합니다.", pythonCommand);
        return pythonCommand;
    }

    private Path resolveToAbsolute(String rawPath) {
        Path path = Paths.get(rawPath);
        return path.isAbsolute() ? path.normalize() : Paths.get("").toAbsolutePath().resolve(path).normalize();
    }

    private boolean isUsableExecutable(Path path) {
        try {
            return Files.exists(path) && Files.isExecutable(path);
        } catch (SecurityException ignored) {
            return false;
        }
    }
}
