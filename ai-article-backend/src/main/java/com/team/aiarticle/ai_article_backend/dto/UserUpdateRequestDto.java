package com.team.aiarticle.ai_article_backend.dto;

public class UserUpdateRequestDto {
    private String username;
    private String email;
    private String profileImageUrl;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
}

