-- Migration: add check-in fields to symptom_logs
-- Run via: npx prisma migrate dev --name add_checkin_fields

ALTER TABLE symptom_logs
  ADD COLUMN IF NOT EXISTS mood          INT,
  ADD COLUMN IF NOT EXISTS energy_level  INT,
  ADD COLUMN IF NOT EXISTS sleep_hours   NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS water_glasses INT;

-- Unique constraint: one log per user per day
ALTER TABLE symptom_logs
  DROP CONSTRAINT IF EXISTS symptom_logs_user_date_unique;

CREATE UNIQUE INDEX IF NOT EXISTS symptom_logs_user_date_unique
  ON symptom_logs (user_id, (logged_at::date));

-- Unique constraint on cycles.user_id (one active cycle per user)
ALTER TABLE cycles
  DROP CONSTRAINT IF EXISTS cycles_user_id_key;

ALTER TABLE cycles
  ADD CONSTRAINT cycles_user_id_key UNIQUE (user_id);
