// src/main/java/com/team/aiarticle/ai_article_backend/config/AdminTokenFilter.java
package com.team.aiarticle.ai_article_backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 어드민 스케줄 제어 API에 대해 X-Admin-Token 헤더를 검증한다.
 */
public class AdminTokenFilter extends OncePerRequestFilter {

    private final String expectedToken;

    public AdminTokenFilter(String expectedToken) {
        this.expectedToken = expectedToken;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        // 아래 경로에만 토큰 검증 적용
        return !(uri.startsWith("/admin/schedule/") || uri.startsWith("/api/admin/schedule/"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String token = req.getHeader("X-Admin-Token");
        if (!StringUtils.hasText(token) || !token.equals(expectedToken)) {
            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"error\":\"FORBIDDEN\",\"message\":\"invalid admin token\"}");
            return;
        }
        chain.doFilter(req, res);
    }
}
