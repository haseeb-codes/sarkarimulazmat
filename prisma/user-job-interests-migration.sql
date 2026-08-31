-- Job-interest keywords for signed-in users (one row per keyword).
-- Run manually against Postgres when ready (requires appropriate privileges).

CREATE TABLE IF NOT EXISTS user_job_interests (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    keyword    TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS user_job_interests_user_id_keyword_key
    ON user_job_interests (user_id, keyword);
CREATE INDEX IF NOT EXISTS user_job_interests_user_id_idx ON user_job_interests (user_id);
