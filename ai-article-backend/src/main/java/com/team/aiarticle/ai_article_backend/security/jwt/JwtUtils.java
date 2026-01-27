package com.team.aiarticle.ai_article_backend.security.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${app.jwt.secret:VGhpcy1pcy1hLWRlZmF1bHQtand0LXNlY3JldC1mb3ItZGV2}")
    private String jwtSecretBase64;

    @Value("${app.jwt.expirationMs:86400000}")
    private long jwtExpirationMs;

    private Key key() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecretBase64);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateJwtToken(String subject) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + jwtExpirationMs);
        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getSubjectFromJwt(String token) {
        return Jwts.parser().setSigningKey(key()).parseClaimsJws(token).getBody().getSubject();
    }
}
