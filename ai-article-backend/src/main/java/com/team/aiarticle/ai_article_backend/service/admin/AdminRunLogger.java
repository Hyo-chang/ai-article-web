package com.team.aiarticle.ai_article_backend.service.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminRunLogger {
    private final JdbcTemplate jdbc;

    public long start(String jobName, @Nullable String paramsJson) {
        jdbc.update("INSERT INTO admin_job_run(job_name, params_json) VALUES (?,?)", jobName, paramsJson);
        Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return id == null ? -1L : id;
    }
    public void success(long runId, String note) {
        if (runId > 0) jdbc.update(
            "UPDATE admin_job_run SET finished_at=NOW(), status='SUCCESS', note=? WHERE run_id=?",
            note, runId
        );
    }
    public void fail(long runId, String note) {
        if (runId > 0) jdbc.update(
            "UPDATE admin_job_run SET finished_at=NOW(), status='FAILED', note=? WHERE run_id=?",
            note, runId
        );
    }
}
