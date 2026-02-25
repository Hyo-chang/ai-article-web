package com.team.aiarticle.ai_article_backend.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.team.aiarticle.ai_article_backend.dto.JwtResponse;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.repository.UserRepository;
import com.team.aiarticle.ai_article_backend.security.jwt.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class OAuth2Controller {

    @Value("${google.client.id:}")
    private String googleClientId;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String idTokenString = request.get("credential");

        if (idTokenString == null || idTokenString.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Google credential is required"));
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid Google token"));
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            // Find or create user
            User user = userRepository.findByProviderAndProviderId("google", googleId);

            if (user == null) {
                // Check if email already exists with different provider
                User existingUser = userRepository.findByEmail(email);
                if (existingUser != null) {
                    // Link Google to existing account
                    existingUser.setProvider("google");
                    existingUser.setProviderId(googleId);
                    if (pictureUrl != null && existingUser.getProfileImageUrl() == null) {
                        existingUser.setProfileImageUrl(pictureUrl);
                    }
                    user = userRepository.save(existingUser);
                } else {
                    // Create new user
                    user = new User();
                    user.setEmail(email);
                    user.setUsername(name != null ? name : email.split("@")[0]);
                    user.setPasswordHash(""); // No password for OAuth users
                    user.setProvider("google");
                    user.setProviderId(googleId);
                    user.setProfileImageUrl(pictureUrl);
                    user.setCreatedAt(LocalDateTime.now());
                    user = userRepository.save(user);
                }
            } else {
                // Update profile picture if changed
                if (pictureUrl != null && !pictureUrl.equals(user.getProfileImageUrl())) {
                    user.setProfileImageUrl(pictureUrl);
                    user = userRepository.save(user);
                }
            }

            // Generate JWT token
            String token = jwtUtils.generateJwtToken(user.getEmail());
            List<String> roles = user.getRoles() == null ? Collections.emptyList() :
                    user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList());

            JwtResponse resp = new JwtResponse(token, user.getUserId(), user.getUsername(),
                    user.getEmail(), roles, user.getProfileImageUrl());

            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            System.err.println("[OAuth2] Google login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Failed to verify Google token"));
        }
    }
}
