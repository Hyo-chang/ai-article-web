package com.team.aiarticle.ai_article_backend.service;

import com.team.aiarticle.ai_article_backend.dto.UserLoginRequestDTO;
import com.team.aiarticle.ai_article_backend.dto.UserRegisterRequestDTO;
import com.team.aiarticle.ai_article_backend.entity.User;
import com.team.aiarticle.ai_article_backend.entity.UserInterest;
import com.team.aiarticle.ai_article_backend.repository.UserInterestRepository;
import com.team.aiarticle.ai_article_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserInterestRepository userInterestRepository;

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
        User user = userRepository.findByUsername(userLoginRequestDTO.getUsername());
        if (user != null && passwordEncoder.matches(userLoginRequestDTO.getPassword(), user.getPasswordHash())) {
            return user;
        }
        return null;
    }

    public Optional<User> findById(Integer userId) {
        return userRepository.findById(userId);
    }

    @Transactional
    public User updateProfile(Integer userId, String username, String profileImageUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        if (username != null && !username.isBlank()) {
            // 다른 사용자가 이미 사용 중인 username인지 확인
            User existing = userRepository.findByUsername(username);
            if (existing != null && !existing.getUserId().equals(userId)) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
            user.setUsername(username);
        }

        if (profileImageUrl != null) {
            user.setProfileImageUrl(profileImageUrl);
        }

        return userRepository.save(user);
    }

    // 관심 카테고리 조회
    public List<String> getUserInterestCategories(Integer userId) {
        return userInterestRepository.findCategoryCodesByUserId(userId);
    }

    // 관심 카테고리 저장 (기존 삭제 후 새로 저장)
    @Transactional
    public void saveUserInterestCategories(Integer userId, List<String> categoryCodes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        // 기존 관심사 삭제
        userInterestRepository.deleteByUserUserId(userId);

        // 새 관심사 저장
        for (String categoryCode : categoryCodes) {
            UserInterest interest = new UserInterest();
            interest.setUser(user);
            interest.setCategoryCode(categoryCode);
            interest.setCreatedAt(LocalDateTime.now());
            userInterestRepository.save(interest);
        }
    }
}
