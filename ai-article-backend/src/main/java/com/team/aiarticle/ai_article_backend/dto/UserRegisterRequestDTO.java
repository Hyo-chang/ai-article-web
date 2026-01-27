package com.team.aiarticle.ai_article_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRegisterRequestDTO {
    private String username;
    private String password;
    private String email;
}
