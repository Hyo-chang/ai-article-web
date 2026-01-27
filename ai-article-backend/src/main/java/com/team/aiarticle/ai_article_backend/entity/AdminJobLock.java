package com.team.aiarticle.ai_article_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_job_lock") // 스키마에 맞게 유지
@Getter
@Setter
@NoArgsConstructor
public class AdminJobLock {

    @Id
    @Column(name = "job_name", length = 100)
    private String jobName;

    @Column(name = "locked_at", nullable = false)
    private LocalDateTime lockedAt;
}
