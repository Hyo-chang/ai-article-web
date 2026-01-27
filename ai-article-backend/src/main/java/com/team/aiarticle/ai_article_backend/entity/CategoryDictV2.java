package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "category_dict_v2")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDictV2 {

    @Id
    @Column(name = "category_code", length = 255, nullable = false)
    private String categoryCode;

    @Column(name = "category_name", length = 50, nullable = false)
    private String categoryName;
}
