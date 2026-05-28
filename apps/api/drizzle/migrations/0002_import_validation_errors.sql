ALTER TABLE import_jobs
  ADD COLUMN IF NOT EXISTS validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb;
