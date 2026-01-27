-- Helpful indexes/constraints for v2 keyword aggregation and TF-IDF upsert

-- 1) Ensure ON DUPLICATE KEY on (processed_content_id, keyword_id) works as intended
ALTER TABLE extracted_keyword_v2
  ADD UNIQUE KEY ux_extracted_keyword_v2_pcid_kwid (processed_content_id, keyword_id);

-- 2) Speed up time-window scans and joins
CREATE INDEX ix_apc_v2_processed_at ON article_processed_content_v2 (processed_at);
CREATE INDEX ix_apc_v2_article_id  ON article_processed_content_v2 (article_id);
CREATE INDEX ix_articlev2_cat_art  ON articlev2 (category_code, article_id);

-- Optional: keyword_id filter when needed
CREATE INDEX ix_extracted_kw_v2_kwid ON extracted_keyword_v2 (keyword_id);

