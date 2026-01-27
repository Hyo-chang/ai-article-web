package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.*;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.repository.UserRepository;
import com.team.aiarticle.ai_article_backend.repository.RoleRepository;
import com.team.aiarticle.ai_article_backend.entity.Role;
import com.team.aiarticle.ai_article_backend.entity.ERole;
import com.team.aiarticle.ai_article_backend.security.jwt.JwtUtils;
import com.team.aiarticle.ai_article_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired(required = false)
    private RoleRepository roleRepository;

    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody UserRegisterRequestDTO userRegisterRequestDTO) {
        return ResponseEntity.ok(userService.registerUser(userRegisterRequestDTO));
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody UserLoginRequestDTO userLoginRequestDTO) {
        User user = userService.login(userLoginRequestDTO);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(401).build();
    }

    // VK-style JWT signin
    @PostMapping("/signin")
    public ResponseEntity<?> signin(@RequestBody LoginRequest req) {
        // basic log
        System.out.println("[AUTH] signin email=" + req.getEmail());
        User user = userRepository.findByEmail(req.getEmail());
        if (user == null) {
            return ResponseEntity.status(401).body(java.util.Map.of("message","Invalid credentials"));
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body(java.util.Map.of("message","Invalid credentials"));
        }
        String token = jwtUtils.generateJwtToken(user.getEmail());
        List<String> roles = user.getRoles() == null ? Collections.emptyList() :
                user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList());
        JwtResponse resp = new JwtResponse(token, user.getUserId(), user.getUsername(), user.getEmail(), roles);
        return ResponseEntity.ok(resp);
    }

    // VK-style signup
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody RegisterRequest req) {
        System.out.println("[AUTH] signup username=" + req.getUsername() + ", email=" + req.getEmail());
        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.status(409).body(java.util.Map.of("message","Username is already taken"));
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.status(409).body(java.util.Map.of("message","Email is already in use"));
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        // assign default role if exists
        if (roleRepository != null) {
            roleRepository.findByName(ERole.ROLE_USER).ifPresent(role -> {
                if (user.getRoles() != null) user.getRoles().add(role);
            });
        }
        userRepository.save(user);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(java.util.Map.of(
                        "userId", user.getUserId(),
                        "username", user.getUsername(),
                        "email", user.getEmail()
                ));
    }
}
