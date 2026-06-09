-- Row Level Security policies for Lunari
-- Run in Supabase SQL editor after creating tables

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own" ON users
  USING (id = auth.uid());

-- Cycles
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cycles_own" ON cycles
  USING (user_id = auth.uid());

-- Symptom logs
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_own" ON symptom_logs
  USING (user_id = auth.uid());

-- Orders (users see own, null user_id is admin-only)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_own" ON orders
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own" ON subscriptions
  USING (user_id = auth.uid());
