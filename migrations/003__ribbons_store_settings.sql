CREATE TABLE ribbons_store_settings (
  instance_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  site_url TEXT NOT NULL,
  seen_first_success_modal BOOLEAN NOT NULL DEFAULT FALSE,
  has_given_feedback BOOLEAN NOT NULL DEFAULT FALSE,
  rating INTEGER,
  feedback_text TEXT,
  unlocked_labels BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_unique_site_id
ON ribbons_store_settings (site_id);

-- Trigger to maintain updated_at (optional)
CREATE OR REPLACE FUNCTION touchUpdatedAt() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER ribbonsStoreSettingsTouch
BEFORE UPDATE ON ribbons_store_settings FOR EACH ROW EXECUTE FUNCTION touchUpdatedAt();

CREATE OR REPLACE TRIGGER appVersionsTouch
BEFORE UPDATE ON app_versions FOR EACH ROW EXECUTE FUNCTION touchUpdatedAt();