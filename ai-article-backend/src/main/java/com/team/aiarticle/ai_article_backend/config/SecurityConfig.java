// src/main/java/com/team/aiarticle/ai_article_backend/config/SecurityConfig.java
package com.team.aiarticle.ai_article_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // application-v2.properties: admin.token=1234
    @Value("${admin.token:changeme}")
    private String adminToken;

    @Autowired(required = false)
    private com.team.aiarticle.ai_article_backend.security.jwt.AuthTokenFilter authTokenFilter;

    @Autowired(required = false)
    private AuthenticationEntryPoint authenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            /* CORS */
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            /* CSRF: 어드민 스케줄 제어 엔드포인트는 비동기 POST 호출이므로 CSRF 제외 */
            .csrf(csrf -> csrf.ignoringRequestMatchers(
                "/admin/schedule/**",
                "/api/admin/schedule/**",
                "/api/admin/**" // 기존 규칙 유지
            ))

            /* 인가 규칙 */
            .authorizeHttpRequests(auth -> auth
                /* 정적/어드민 리소스 */
                .requestMatchers("/", "/index.html", "/favicon.ico").permitAll()
                .requestMatchers(
                    "/admin/**",                 // /admin/index.html, /admin/admin.js, /admin/admin.css 등
                    "/static/**", "/css/**", "/js/**", "/images/**"
                ).permitAll()

                /* 공개 API */
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/articles/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                /* 스케줄 제어 엔드포인트는 토큰 필터에서 검증 -> 여기서는 우선 허용 */
                .requestMatchers("/admin/schedule/**", "/api/admin/schedule/**").permitAll()

                /* 나머지 */
                .anyRequest().permitAll()
            )

            /* 커스텀 헤더 토큰 필터 추가 */
            .exceptionHandling(ex -> {
                if (authenticationEntryPoint != null) ex.authenticationEntryPoint(authenticationEntryPoint);
            })
            .addFilterBefore(new AdminTokenFilter(adminToken), UsernamePasswordAuthenticationFilter.class);

        // Add JWT filter if available
        if (authTokenFilter != null) {
            http.addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);
        }

        // Ensure CSRF is disabled for stateless API usage (prevents 403 on browser POST)
        http.csrf(csrf -> csrf.disable());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        // Allow any origin (no cookies). For stricter control, list exact origins.
        cfg.setAllowedOriginPatterns(Arrays.asList("*"));
        cfg.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        cfg.setAllowedHeaders(Arrays.asList("Authorization","Content-Type","X-Requested-With","X-Admin-Token"));
        cfg.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
