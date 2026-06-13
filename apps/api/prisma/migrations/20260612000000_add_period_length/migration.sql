-- Add per-user period length to the cycle settings.
-- Existing rows default to 5 days so current users keep working unchanged.
ALTER TABLE "cycles" ADD COLUMN "period_length" INTEGER NOT NULL DEFAULT 5;
