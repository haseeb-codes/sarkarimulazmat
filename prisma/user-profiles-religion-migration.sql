-- Add religion to user profiles (Muslim / Non-Muslim).
-- Run manually against Postgres when ready (requires appropriate privileges).

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS religion TEXT NOT NULL DEFAULT 'muslim';
