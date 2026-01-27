-- Indexes and constraints for v2 TF-IDF pipeline and category aggregation
-- Run these on your MariaDB instance (adjust names if they already exist).

-- 1) Ensure idempotent upsert of keywords per processed document
ALTER TABLE extracted_keyword_v2
  ADD UNIQUE KEY ux_extracted_keyword_v2_pcid_kwid (processed_content_id, keyword_id);

-- 2) Speed up time window scans and joins
CREATE INDEX ix_apc_v2_processed_at ON article_processed_content_v2 (processed_at);
CREATE INDEX ix_apc_v2_article_id  ON article_processed_content_v2 (article_id);
CREATE INDEX ix_articlev2_cat_art  ON articlev2 (category_code, article_id);

-- 3) Optional: help queries that filter by keyword_id
CREATE INDEX ix_extracted_kw_v2_kwid ON extracted_keyword_v2 (keyword_id);

-- Notes:
-- - If these indexes already exist, DROP the conflicting ones or skip as needed.
-- - MariaDB versions before 10.5 may not support IF NOT EXISTS for all statements.

