package com.team.aiarticle.ai_article_backend.nlp;

import com.team.aiarticle.ai_article_backend.entity.ArticleProcessedContentV2;
import com.team.aiarticle.ai_article_backend.repository.ArticleProcessedContentV2Repository;
import kr.co.shineware.nlp.komoran.core.Komoran;
import kr.co.shineware.nlp.komoran.model.Token;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KoreanNlpService {

    private static final Logger log = LoggerFactory.getLogger(KoreanNlpService.class);
    private final Komoran komoran;

    @Nullable private final ArticleProcessedContentV2Repository apcV2Repo;

    @Value("${app.nlp.provider:mecab}")
    private String nlpProvider;

    @Value("${app.nlp.mecab.baseUrl:http://localhost:3100}")
    private String mecabBaseUrl;

    @Value("${app.nlp.mecab.url:}")
    private String mecabFullUrl;
	
    private static final Set<String> STOP_POS = Set.of(
            "JKS","JKC","JKG","JKO","JKB","JKV","JKQ","JX","JC",
            "MAG","MAJ", "IC",
            "SF","SP","SS","SE","SO","SW"
    );

    private static final Set<String> ALLOW_POS = Set.of(
            "NNG","NNP","NNB","NR","NP",
            "VV","VA","VX","VCP","VCN",
            "SN"
    );

    private final Set<String> userCompoundNounDict = new HashSet<>();
	
    public void loadUserCompoundNouns(Collection<String> entries) {
        userCompoundNounDict.clear();
        if (entries != null) {
            entries.forEach(e -> {
                if (e != null) {
                    String norm = e.trim().replaceAll("\\s+", "");
                    if (!norm.isEmpty()) userCompoundNounDict.add(norm);
                }
            });
        }
    }
	
    public String normalize(String text) {
        if (text == null) return "";
        return text.replace('\u00A0', ' ')
                   .replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }
	
    public List<String> extractTerms(String text) {
        return extractContentTokens(text);
    }
	
    public List<String> extractContentTokens(String text) {
        if (text == null || text.isBlank()) return List.of();
        if ("mecab".equalsIgnoreCase(nlpProvider)) {
            try {
                List<String> toks = mecabTokenize(text);
                if (toks == null) return List.of();
                if (userCompoundNounDict.isEmpty() || toks.isEmpty()) return toks;
                return mergeCompoundNouns(toks, userCompoundNounDict);
            } catch (Exception e) {
                log.warn("[NLP] mecab tokenize failed: {}", e.getMessage());
                return List.of();
            }
        } else {
            List<Token> tokens = komoran.analyze(text).getTokenList();
            List<String> morphemes = tokens.stream()
                    .filter(t -> ALLOW_POS.contains(t.getPos()) && !STOP_POS.contains(t.getPos()))
                    .map(Token::getMorph)
                    .filter(m -> m != null && !m.isBlank())
                    .toList();
            if (userCompoundNounDict.isEmpty() || morphemes.isEmpty()) return morphemes;
            return mergeCompoundNouns(morphemes, userCompoundNounDict);
        }
    }
	
    public List<String> tokenize(String processedText) {
        if (processedText == null || processedText.isBlank()) return List.of();
        return Arrays.stream(processedText.trim().split("\\s+"))
                     .filter(s -> !s.isBlank())
                     .toList();
    }
	
    private List<String> mergeCompoundNouns(List<String> tokens, Set<String> dict) {
        List<String> result = new ArrayList<>();
        int n = tokens.size();
        int i = 0;
        int maxLen = 5;

        while (i < n) {
            boolean matched = false;
            int take = Math.min(maxLen, n - i);
            for (int len = take; len >= 2; len--) {
                String cand = String.join("", tokens.subList(i, i + len));
                if (dict.contains(cand)) {
                    result.add(cand);
                    i += len;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                result.add(tokens.get(i));
                i++;
            }
        }
        return result;
    }
	
    private List<String> mecabTokenize(String text) {
        RestTemplate rt = new RestTemplate();
        String url;
        if (mecabFullUrl != null && !mecabFullUrl.isBlank()) {
            url = mecabFullUrl.trim();
        } else {
            url = mecabBaseUrl.endsWith("/") ? (mecabBaseUrl + "tokenize") : (mecabBaseUrl + "/tokenize");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, String> body = Map.of("text", text);
        HttpEntity<Map<String, String>> req = new HttpEntity<>(body, headers);
        ResponseEntity<Map> resp = rt.postForEntity(url, req, Map.class);
        if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) return List.of();
        Object arr = resp.getBody().get("tokens");
        if (arr instanceof List<?> list) {
            List<String> out = new ArrayList<>();
            for (Object o : list) {
                if (o != null) {
                    String s = o.toString().trim();
                    if (!s.isBlank()) out.add(s);
                }
            }
            return out;
        }
        return List.of();
    }
}
