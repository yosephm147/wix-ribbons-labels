CREATE TABLE app_versions (
  app_name TEXT NOT NULL PRIMARY KEY,
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
