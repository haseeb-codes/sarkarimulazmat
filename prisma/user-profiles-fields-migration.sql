-- Add WhatsApp number, degree title, and degree specialization to user profiles.
-- Run manually against Postgres when ready (requires appropriate privileges).

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
    ADD COLUMN IF NOT EXISTS degree_title TEXT,
    ADD COLUMN IF NOT EXISTS degree_specialization TEXT,
    ADD COLUMN IF NOT EXISTS has_disability BOOLEAN NOT NULL DEFAULT FALSE;
