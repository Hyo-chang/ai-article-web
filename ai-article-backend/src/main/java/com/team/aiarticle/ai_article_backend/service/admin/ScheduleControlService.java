package com.team.aiarticle.ai_article_backend.service.admin;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 스케줄 일시정지 상태를 인메모리로 보관/조회하는 서비스.
 * 서버 재시작 시 초기화됩니다. (영속 필요하면 DB로 확장)
 */
@Service
public class ScheduleControlService {

    private final Set<String> paused = ConcurrentHashMap.newKeySet();

    /** 특정 잡을 일시정지 상태로 표시 */
    public void pause(String job) {
        if (job != null) paused.add(job);
    }

    /** 특정 잡의 일시정지를 해제 */
    public void resume(String job) {
        if (job != null) paused.remove(job);
    }

    /** 특정 잡이 일시정지 상태인지 여부 */
    public boolean isPaused(String job) {
        return job != null && paused.contains(job);
    }
}
