package com.team.aiarticle.ai_article_backend.service.admin;

import com.team.aiarticle.ai_article_backend.entity.AdminJobLock;
import com.team.aiarticle.ai_article_backend.repository.AdminJobLockRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminJobGate {
    private final AdminJobLockRepository lockRepository;

    public boolean isPaused(String jobName) {
        return lockRepository.findById(jobName).isPresent();
    }

    public void pause(String jobName) {
        // ★ 변경: (String, LocalDateTime) 생성자 대신 기본 생성자 + setter 사용
        lockRepository.findById(jobName).orElseGet(() -> {
            AdminJobLock lock = new AdminJobLock();           // ★
            lock.setJobName(jobName);                         // ★
            lock.setLockedAt(LocalDateTime.now());            // ★
            return lockRepository.save(lock);
        });
    }

    public void resume(String jobName) {
        if (lockRepository.existsById(jobName)) {
            lockRepository.deleteById(jobName);
        }
    }
}
