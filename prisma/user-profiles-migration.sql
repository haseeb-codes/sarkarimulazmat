-- Signed-in user profiles for Google sign-in (Auth.js JWT session user id = user_profiles.id).
-- Run manually against Postgres when ready (requires appropriate privileges).

CREATE TABLE IF NOT EXISTS user_profiles (
    id               TEXT PRIMARY KEY,
    google_sub       TEXT NOT NULL,
    email            TEXT NOT NULL,
    name             TEXT,
    image            TEXT,
    date_of_birth    DATE,
    highest_degree   TEXT,
    graduation_date  DATE,
    gender           TEXT,
    email_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
    consent_given_at TIMESTAMP(3),
    created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_google_sub_key ON user_profiles (google_sub);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles (email);
