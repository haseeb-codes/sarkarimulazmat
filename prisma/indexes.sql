-- Optional performance indexes for JobPostings filter/sort paths.
-- Run manually against Postgres when ready (requires appropriate privileges).
-- Eligibility / sort columns
CREATE INDEX IF NOT EXISTS job_postings_active_idx ON "JobPostings" (active);
CREATE INDEX IF NOT EXISTS job_postings_ad_date_idx ON "JobPostings" (ad_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS job_postings_last_date_idx ON "JobPostings" (last_date_to_apply ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS job_postings_grade_idx ON "JobPostings" (grade);
CREATE INDEX IF NOT EXISTS job_postings_education_level_idx ON "JobPostings" (education_level);
CREATE INDEX IF NOT EXISTS job_postings_min_age_idx ON "JobPostings" (min_age);
CREATE INDEX IF NOT EXISTS job_postings_max_age_idx ON "JobPostings" (max_age);

-- Trigram indexes for contains filters (requires pg_trgm)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS job_postings_degree_area_trgm ON "JobPostings" USING gin (degree_area gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS job_postings_degrees_trgm ON "JobPostings" USING gin (degrees gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS job_postings_place_trgm ON "JobPostings" USING gin (place_of_posting gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS job_postings_domicile_trgm ON "JobPostings" USING gin (domicile gin_trgm_ops);
