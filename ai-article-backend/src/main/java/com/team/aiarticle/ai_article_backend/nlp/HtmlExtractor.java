package com.team.aiarticle.ai_article_backend.nlp;

import org.jsoup.Jsoup;
import org.springframework.stereotype.Component;

@Component
public class HtmlExtractor {
    public String toPlainText(String html) {
        if (html == null) return "";
        return Jsoup.parse(html).text();
    }
}
