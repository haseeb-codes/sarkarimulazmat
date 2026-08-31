-- Search log enrichment: IP/device/browser context for filtered job queries.
-- Run manually against Postgres when ready (requires appropriate privileges).

ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS path TEXT;
ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS browser_version TEXT;
ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS device_type TEXT;
