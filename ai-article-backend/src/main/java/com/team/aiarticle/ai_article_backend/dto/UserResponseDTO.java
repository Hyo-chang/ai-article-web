package com.team.aiarticle.ai_article_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserResponseDTO {
    private Long userId;
    private String username;
    private String email;
}
