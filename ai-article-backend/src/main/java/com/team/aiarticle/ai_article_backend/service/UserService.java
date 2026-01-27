package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.UserLoginRequestDTO;
import com.team.aiarticle.ai_article_backend.dto.UserRegisterRequestDTO;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(UserRegisterRequestDTO userRegisterRequestDTO) {
        User user = new User();
        user.setUsername(userRegisterRequestDTO.getUsername());
        user.setPasswordHash(passwordEncoder.encode(userRegisterRequestDTO.getPassword()));
        user.setEmail(userRegisterRequestDTO.getEmail());
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public User login(UserLoginRequestDTO userLoginRequestDTO) {
        // This is a simplified login method. In a real application, you would use Spring Security's authentication manager.
        User user = userRepository.findByUsername(userLoginRequestDTO.getUsername());
        if (user != null && passwordEncoder.matches(userLoginRequestDTO.getPassword(), user.getPasswordHash())) {
            return user;
        }
        return null;
    }
}
