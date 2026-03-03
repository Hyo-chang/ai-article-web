package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.entity.ArticleV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleV2Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
public class SitemapController {

    private final ArticleV2Repository articleV2Repository;
    private static final String BASE_URL = "https://www.aharead.com";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> generateSitemap() {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // 정적 페이지들
        addStaticPages(xml);

        // 동적 기사 페이지들
        addArticlePages(xml);

        xml.append("</urlset>");
        return ResponseEntity.ok()
            .header("Content-Type", MediaType.APPLICATION_XML_VALUE)
            .header("Cache-Control", "public, max-age=" + TimeUnit.HOURS.toSeconds(1))
            .body(xml.toString());
    }

    private void addStaticPages(StringBuilder xml) {
        String today = LocalDateTime.now().format(DATE_FORMAT);

        // 메인 페이지
        addUrl(xml, "/", today, "daily", "1.0");

        // 주요 페이지
        addUrl(xml, "/home", today, "hourly", "0.9");
        addUrl(xml, "/experience", today, "weekly", "0.8");
        addUrl(xml, "/board", today, "daily", "0.8");
        addUrl(xml, "/updates", today, "weekly", "0.6");

        // 기타 페이지
        addUrl(xml, "/privacy", today, "monthly", "0.4");
        addUrl(xml, "/terms", today, "monthly", "0.4");
        addUrl(xml, "/login", today, "monthly", "0.5");
        addUrl(xml, "/signup", today, "monthly", "0.5");
    }

    private void addArticlePages(StringBuilder xml) {
        List<ArticleV2> articles = articleV2Repository.findSitemapArticles();

        for (ArticleV2 article : articles) {
            addUrl(xml, "/content/" + article.getArticleId(), resolveLastmod(article), "weekly", "0.7");
        }
    }

    private String resolveLastmod(ArticleV2 article) {
        if (article.getPublishedAt() != null) return article.getPublishedAt().format(DATE_FORMAT);
        if (article.getInitialCrawledAt() != null) return article.getInitialCrawledAt().format(DATE_FORMAT);
        return LocalDateTime.now().format(DATE_FORMAT);
    }

    private void addUrl(StringBuilder xml, String path, String lastmod, String changefreq, String priority) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(BASE_URL).append(path).append("</loc>\n");
        xml.append("    <lastmod>").append(lastmod).append("</lastmod>\n");
        xml.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        xml.append("    <priority>").append(priority).append("</priority>\n");
        xml.append("  </url>\n");
    }
}
