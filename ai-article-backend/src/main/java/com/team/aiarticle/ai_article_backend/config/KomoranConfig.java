package com.team.aiarticle.ai_article_backend.config;

import kr.co.shineware.nlp.komoran.constant.DEFAULT_MODEL;
import kr.co.shineware.nlp.komoran.core.Komoran;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;

@Configuration
public class KomoranConfig {

    @Bean
    public Komoran komoran() {
        // FULL 모델 로드
        Komoran k = new Komoran(DEFAULT_MODEL.FULL);

        // (선택) 사용자 사전 적용: src/main/resources/nlp/user.dic
        try {
            ClassPathResource cpr = new ClassPathResource("nlp/user.dic");
            if (cpr.exists()) {
                var tmp = Files.createTempFile("komoran-user", ".dic").toFile();
                try (InputStream in = cpr.getInputStream(); OutputStream out = new FileOutputStream(tmp)) {
                    in.transferTo(out);
                }
                k.setUserDic(tmp.getAbsolutePath());
            }
        } catch (Exception ignore) {}
        return k;
    }
}
