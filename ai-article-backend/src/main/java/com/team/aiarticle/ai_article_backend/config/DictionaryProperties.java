package com.team.aiarticle.ai_article_backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dictionary")
public class DictionaryProperties {
    private String source;

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}

