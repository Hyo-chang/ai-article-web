package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "word_definition")
public class WordDefinition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "definition_id")
    private Long definitionId;

    @Column(name = "word", nullable = false)
    private String word;

    @Column(name = "definition", columnDefinition = "TEXT", nullable = false)
    private String definition;
}
