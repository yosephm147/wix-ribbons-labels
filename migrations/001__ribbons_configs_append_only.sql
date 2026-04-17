-- Append-only config history. Prune via cron: SELECT public.prune_configs_older_than_14_days();
-- Requires pgcrypto for gen_random_uuid().

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE ribbons_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  config JSONB NOT NULL,
  config_hash TEXT NOT NULL,
  config_version INTEGER NOT NULL,
  site_url TEXT NOT NULL,
  merchant_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_configs_instance_created
  ON ribbons_configs (instance_id, created_at DESC);

CREATE INDEX idx_configs_site
  ON ribbons_configs (site_id);

CREATE UNIQUE INDEX idx_unique_instance_hash
  ON ribbons_configs (instance_id, config_hash);

-- Keeps rows from the last 14 days; always retains the latest row per instance_id (even if older).
CREATE OR REPLACE FUNCTION public.prune_ribbons_configs_older_than_14_days()
RETURNS INTEGER
LANGUAGE sql
AS $$
  WITH deleted AS (
    DELETE FROM ribbons_configs c
    WHERE c.created_at < now() - interval '14 days'
      AND c.id NOT IN (
        SELECT id FROM (
          SELECT DISTINCT ON (instance_id) id
          FROM ribbons_configs
          ORDER BY instance_id, created_at DESC
        ) latest
      )
    RETURNING c.id
  )
  SELECT count(*)::INTEGER FROM deleted;
$$;

COMMENT ON TABLE ribbons_configs IS 'Append-only label config snapshots; prune with prune_ribbons_configs_older_than_14_days() (e.g. daily cron).';
COMMENT ON FUNCTION public.prune_ribbons_configs_older_than_14_days() IS 'Run daily via cron. Deletes rows older than 14 days except the latest row per instance_id.';
