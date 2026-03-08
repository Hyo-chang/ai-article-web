package com.team.aiarticle.ai_article_backend.service.admin;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminRunLogger {
    private final JdbcTemplate jdbc;

    @PostConstruct
    public void initTable() {
        jdbc.execute(
            "CREATE TABLE IF NOT EXISTS admin_job_run (" +
            "  run_id BIGINT AUTO_INCREMENT PRIMARY KEY," +
            "  job_name VARCHAR(255) NOT NULL," +
            "  params_json TEXT," +
            "  started_at DATETIME DEFAULT NOW()," +
            "  finished_at DATETIME," +
            "  status VARCHAR(50)," +
            "  note TEXT" +
            ")"
        );
    }

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
