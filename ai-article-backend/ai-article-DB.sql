-- --------------------------------------------------------
-- 호스트:                          203.231.146.220
-- 서버 버전:                        11.2.2-MariaDB-1:11.2.2+maria~ubu2204 - mariadb.org binary distribution
-- 서버 OS:                        debian-linux-gnu
-- HeidiSQL 버전:                  12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- cu202507 데이터베이스 구조 내보내기
CREATE DATABASE IF NOT EXISTS `cu202507` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `cu202507`;

-- 테이블 cu202507.admin_job_lock 구조 내보내기
CREATE TABLE IF NOT EXISTS `admin_job_lock` (
  `job_name` varchar(100) NOT NULL,
  `locked_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`job_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.admin_job_run 구조 내보내기
CREATE TABLE IF NOT EXISTS `admin_job_run` (
  `run_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `job_name` varchar(100) NOT NULL,
  `params_json` text DEFAULT NULL,
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `finished_at` datetime DEFAULT NULL,
  `status` enum('RUNNING','SUCCESS','FAILED') NOT NULL DEFAULT 'RUNNING',
  `note` text DEFAULT NULL,
  PRIMARY KEY (`run_id`),
  KEY `idx_job_started` (`job_name`,`started_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1525 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.article 구조 내보내기
CREATE TABLE IF NOT EXISTS `article` (
  `article_id` int(11) NOT NULL AUTO_INCREMENT,
  `article_url` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `initial_crawled_at` datetime DEFAULT current_timestamp(),
  `content_crawled_at` datetime DEFAULT NULL,
  `is_full_content_crawled` tinyint(1) DEFAULT 0,
  `definition` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `word` varchar(255) DEFAULT NULL,
  `category_code` varchar(32) DEFAULT NULL COMMENT '카테고리 코드: TECH_AI, BIZ_ECON, SOC_POL, CULT_ENT, SCI_ENV, LIFE',
  PRIMARY KEY (`article_id`),
  UNIQUE KEY `article_url` (`article_url`),
  KEY `idx_article_category_code` (`category_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.articlev2 구조 내보내기
CREATE TABLE IF NOT EXISTS `articlev2` (
  `article_id` int(11) NOT NULL AUTO_INCREMENT,
  `article_url` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `initial_crawled_at` datetime DEFAULT current_timestamp(),
  `content_crawled_at` datetime DEFAULT NULL,
  `is_full_content_crawled` tinyint(1) DEFAULT 0,
  `definition` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `word` varchar(255) DEFAULT NULL,
  `category_code` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`article_id`),
  UNIQUE KEY `article_url` (`article_url`),
  KEY `idx_articlev2_category_code` (`category_code`),
  KEY `idx_articlev2_cat_pub` (`category_code`,`published_at`),
  KEY `ix_articlev2_cat_art` (`category_code`,`article_id`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.article_analysis_result 구조 내보내기
CREATE TABLE IF NOT EXISTS `article_analysis_result` (
  `analysis_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `processed_content_id` int(11) NOT NULL,
  `summary_text` text DEFAULT NULL,
  `easy_summary_text` text DEFAULT NULL,
  `sentiment` varchar(255) DEFAULT NULL,
  `analyzed_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`analysis_id`),
  UNIQUE KEY `processed_content_id` (`processed_content_id`),
  CONSTRAINT `fk_analysis_result_processed_content_id` FOREIGN KEY (`processed_content_id`) REFERENCES `article_processed_content` (`processed_content_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.article_processed_content 구조 내보내기
CREATE TABLE IF NOT EXISTS `article_processed_content` (
  `processed_content_id` int(11) NOT NULL AUTO_INCREMENT,
  `article_id` int(11) NOT NULL,
  `processed_text` text NOT NULL,
  `processed_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`processed_content_id`),
  UNIQUE KEY `article_id` (`article_id`),
  UNIQUE KEY `uq_apc_article_id` (`article_id`),
  KEY `idx_apc_processed_at` (`processed_at`),
  CONSTRAINT `fk_processed_content_article_id` FOREIGN KEY (`article_id`) REFERENCES `article` (`article_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.article_processed_content_v2 구조 내보내기
CREATE TABLE IF NOT EXISTS `article_processed_content_v2` (
  `processed_content_id` int(11) NOT NULL AUTO_INCREMENT,
  `article_id` int(11) NOT NULL,
  `processed_text` text NOT NULL,
  `processed_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`processed_content_id`),
  UNIQUE KEY `article_id` (`article_id`),
  UNIQUE KEY `uq_apc_v2_article_id` (`article_id`),
  KEY `idx_apc_v2_article_processed` (`article_id`,`processed_at`),
  KEY `ix_apc_v2_processed_at` (`processed_at`),
  KEY `ix_apc_v2_article_id` (`article_id`),
  CONSTRAINT `fk_apc_v2_article` FOREIGN KEY (`article_id`) REFERENCES `articlev2` (`article_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=374 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.article_raw_content 구조 내보내기
CREATE TABLE IF NOT EXISTS `article_raw_content` (
  `raw_content_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `article_id` int(11) NOT NULL,
  `raw_html_content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`raw_content_id`),
  UNIQUE KEY `article_id` (`article_id`),
  KEY `idx_arc_article_id` (`article_id`),
  CONSTRAINT `fk_raw_content_article_id` FOREIGN KEY (`article_id`) REFERENCES `article` (`article_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 뷰 cu202507.article_unified 구조 내보내기
-- VIEW 종속성 오류를 극복하기 위해 임시 테이블을 생성합니다.
CREATE TABLE `article_unified` (
	`article_id` INT(11) NOT NULL,
	`article_url` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_general_ci',
	`title` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_general_ci',
	`content` LONGTEXT NOT NULL COLLATE 'utf8mb4_general_ci',
	`publisher` VARCHAR(1) NULL COLLATE 'utf8mb4_general_ci',
	`published_at` DATETIME NULL,
	`initial_crawled_at` DATETIME NULL,
	`content_crawled_at` DATETIME NULL,
	`is_full_content_crawled` TINYINT(1) NULL,
	`definition` VARCHAR(1) NULL COLLATE 'utf8mb4_general_ci',
	`link` VARCHAR(1) NULL COLLATE 'utf8mb4_general_ci',
	`word` VARCHAR(1) NULL COLLATE 'utf8mb4_general_ci',
	`category_code` VARCHAR(1) NULL COLLATE 'utf8mb4_general_ci'
);

-- 테이블 cu202507.category_keyword_trend_snapshot 구조 내보내기
CREATE TABLE IF NOT EXISTS `category_keyword_trend_snapshot` (
  `snapshot_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `category_code` varchar(32) NOT NULL,
  `keyword_id` int(11) NOT NULL,
  `window_start` datetime NOT NULL,
  `window_end` datetime NOT NULL,
  `doc_count` int(11) NOT NULL,
  `tfidf_sum` double NOT NULL,
  `tfidf_avg` double NOT NULL,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`snapshot_id`),
  UNIQUE KEY `uq_cat_kw_window` (`category_code`,`keyword_id`,`window_start`,`window_end`),
  KEY `idx_trend_cat_kw` (`category_code`,`keyword_id`),
  KEY `idx_trend_generated` (`generated_at`),
  KEY `fk_trend_kw` (`keyword_id`),
  KEY `idx_trend_cat_window` (`category_code`,`window_end`,`tfidf_sum`),
  CONSTRAINT `fk_trend_kw` FOREIGN KEY (`keyword_id`) REFERENCES `keyword` (`keyword_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2286 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.extracted_keyword 구조 내보내기
CREATE TABLE IF NOT EXISTS `extracted_keyword` (
  `extracted_keyword_id` int(11) NOT NULL AUTO_INCREMENT,
  `processed_content_id` int(11) NOT NULL,
  `keyword_id` int(11) NOT NULL,
  `tfidf_score` decimal(10,6) DEFAULT NULL,
  `extracted_at` datetime DEFAULT current_timestamp(),
  `analysis_id` bigint(20) NOT NULL,
  PRIMARY KEY (`extracted_keyword_id`),
  UNIQUE KEY `uq_extracted_keyword` (`processed_content_id`,`keyword_id`),
  UNIQUE KEY `uq_ek_pid_kid` (`processed_content_id`,`keyword_id`),
  KEY `FKs165vmf41eoajo1sqy98r3tlx` (`analysis_id`),
  KEY `idx_ek_kid` (`keyword_id`),
  KEY `idx_ek_pid` (`processed_content_id`),
  CONSTRAINT `FKs165vmf41eoajo1sqy98r3tlx` FOREIGN KEY (`analysis_id`) REFERENCES `article_analysis_result` (`analysis_id`),
  CONSTRAINT `fk_extracted_keyword_keyword_id` FOREIGN KEY (`keyword_id`) REFERENCES `keyword` (`keyword_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_extracted_keyword_processed_content_id` FOREIGN KEY (`processed_content_id`) REFERENCES `article_processed_content` (`processed_content_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.extracted_keyword_v2 구조 내보내기
CREATE TABLE IF NOT EXISTS `extracted_keyword_v2` (
  `extracted_keyword_id` int(11) NOT NULL AUTO_INCREMENT,
  `processed_content_id` int(11) NOT NULL,
  `keyword_id` int(11) NOT NULL,
  `tfidf_score` decimal(10,6) DEFAULT NULL,
  `extracted_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`extracted_keyword_id`),
  UNIQUE KEY `uq_extracted_keyword_v2` (`processed_content_id`,`keyword_id`),
  UNIQUE KEY `ux_extracted_keyword_v2_pcid_kwid` (`processed_content_id`,`keyword_id`),
  KEY `idx_ekv2_pid` (`processed_content_id`),
  KEY `idx_ekv2_kid` (`keyword_id`),
  KEY `idx_ekv2_pid_kid` (`processed_content_id`,`keyword_id`),
  KEY `idx_ekv2_extracted_at` (`extracted_at`),
  KEY `ix_extracted_kw_v2_kwid` (`keyword_id`),
  CONSTRAINT `fk_ekv2_apc` FOREIGN KEY (`processed_content_id`) REFERENCES `article_processed_content_v2` (`processed_content_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ekv2_keyword_id` FOREIGN KEY (`keyword_id`) REFERENCES `keyword` (`keyword_id`)
) ENGINE=InnoDB AUTO_INCREMENT=396135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.keyword 구조 내보내기
CREATE TABLE IF NOT EXISTS `keyword` (
  `keyword_id` int(11) NOT NULL AUTO_INCREMENT,
  `keyword_name` varchar(255) NOT NULL,
  PRIMARY KEY (`keyword_id`),
  UNIQUE KEY `keyword_name` (`keyword_name`),
  UNIQUE KEY `uq_keyword_name` (`keyword_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1777 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.roles 구조 내보내기
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` enum('ROLE_USER','ROLE_MODERATOR','ROLE_ADMIN') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.user 구조 내보내기
CREATE TABLE IF NOT EXISTS `user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `profile_image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.user_interest 구조 내보내기
CREATE TABLE IF NOT EXISTS `user_interest` (
  `user_interest_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `keyword_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`user_interest_id`),
  UNIQUE KEY `uq_user_interest` (`user_id`,`keyword_id`),
  KEY `fk_user_interest_keyword_id` (`keyword_id`),
  CONSTRAINT `fk_user_interest_keyword_id` FOREIGN KEY (`keyword_id`) REFERENCES `keyword` (`keyword_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_interest_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.user_read_history 구조 내보내기
CREATE TABLE IF NOT EXISTS `user_read_history` (
  `history_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `article_id` int(11) NOT NULL,
  `read_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`history_id`),
  KEY `fk_read_history_user_id` (`user_id`),
  KEY `fk_user_read_history_articlev2` (`article_id`),
  CONSTRAINT `fk_read_history_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_read_history_articlev2` FOREIGN KEY (`article_id`) REFERENCES `articlev2` (`article_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 테이블 cu202507.user_roles 구조 내보내기
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 내보낼 데이터가 선택되어 있지 않습니다.

-- 트리거 cu202507.trg_article_ins_cat_sync 구조 내보내기
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER trg_article_ins_cat_sync
AFTER INSERT ON article
FOR EACH ROW
BEGIN
  UPDATE articlev2
  SET category_code = NEW.category_code
  WHERE article_url = NEW.article_url;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- 트리거 cu202507.trg_article_upd_cat_sync 구조 내보내기
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER trg_article_upd_cat_sync
AFTER UPDATE ON article
FOR EACH ROW
BEGIN
  IF (NEW.category_code <=> OLD.category_code) IS FALSE THEN
    UPDATE articlev2
    SET category_code = NEW.category_code
    WHERE article_url = NEW.article_url;
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- 임시 테이블을 제거하고 최종 VIEW 구조를 생성
DROP TABLE IF EXISTS `article_unified`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `article_unified` AS select `v`.`article_id` AS `article_id`,`v`.`article_url` AS `article_url`,`v`.`title` AS `title`,`v`.`content` AS `content`,`v`.`publisher` AS `publisher`,`v`.`published_at` AS `published_at`,`v`.`initial_crawled_at` AS `initial_crawled_at`,`v`.`content_crawled_at` AS `content_crawled_at`,`v`.`is_full_content_crawled` AS `is_full_content_crawled`,`v`.`definition` AS `definition`,`v`.`link` AS `link`,`v`.`word` AS `word`,coalesce(`v`.`category_code`,`a`.`category_code`) AS `category_code` from (`articlev2` `v` left join `article` `a` on(`a`.`article_url` = `v`.`article_url`))
;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
