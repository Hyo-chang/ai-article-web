package com.team.aiarticle.ai_article_backend.controller;

import com.team.aiarticle.ai_article_backend.dto.DictionaryDto;
import com.team.aiarticle.ai_article_backend.entity.WordDefinition;
import com.team.aiarticle.ai_article_backend.repository.WordDefinitionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/dictionary")
public class DictionaryController {

    @Autowired(required = false)
    private WordDefinitionRepository wordDefinitionRepository;

    @GetMapping("/{word}")
    public ResponseEntity<WordDefinition> getDefinition(@PathVariable String word) {
        if (wordDefinitionRepository == null) return ResponseEntity.notFound().build();
        Optional<WordDefinition> def = wordDefinitionRepository.findAll().stream()
                .filter(w -> word.equalsIgnoreCase(w.getWord()))
                .findFirst();
        return def.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<WordDefinition> createOrUpdate(@RequestBody DictionaryDto dto) {
        if (wordDefinitionRepository == null) return ResponseEntity.badRequest().build();
        WordDefinition wd = new WordDefinition();
        wd.setWord(dto.getWord());
        wd.setDefinition(dto.getDefinition());
        return ResponseEntity.ok(wordDefinitionRepository.save(wd));
    }
}
