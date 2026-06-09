-- =============================================================================
-- Lunari dev seed data
-- Run via: pnpm --filter @lunari/api seed
-- NOTE: Replace TEST_USER_ID with the UUID of a real Supabase Auth test user
-- =============================================================================

-- 1. Test user (id must match a Supabase Auth user you create in the dashboard)
INSERT INTO users (id, email, name, created_at, onboarded_at, notification_prefs)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@herlunari.com',
  'Test User',
  now(),
  now(),
  '{"dailyReminder": true, "reminderTime": "08:00"}'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Cycle record — start date 14 days ago, so today is day 15 (follicular)
INSERT INTO cycles (id, user_id, start_date, cycle_length, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '14 days',
  28,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Symptom logs — one per phase
INSERT INTO symptom_logs (id, user_id, cycle_day, phase, symptoms, journal_note, logged_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    2,
    'menstrual',
    ARRAY['Cramps', 'Fatigue', 'Low mood'],
    'Rough first few days. Took it easy with yin yoga.',
    now() - INTERVAL '13 days'
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    8,
    'follicular',
    ARRAY['Energised', 'Motivated'],
    'Feeling great — crushed a strength session today.',
    now() - INTERVAL '7 days'
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    17,
    'ovulatory',
    ARRAY['Confident', 'High libido', 'Glowing skin'],
    'Best week of the cycle — social and energised.',
    now() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000001',
    23,
    'luteal',
    ARRAY['Bloating', 'Cravings', 'Fatigue'],
    'Cravings hitting hard. Dark chocolate helped.',
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Influencer referrals
INSERT INTO influencer_referrals (id, influencer_code, influencer_name, commission_rate, total_sales, total_commission_cents, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000020',
    'GYMGIRL20',
    'Test Influencer 1',
    0.20,
    0,
    0,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    'LUNARI15',
    'Test Influencer 2',
    0.15,
    0,
    0,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000022',
    'WELLNESS10',
    'Test Influencer 3',
    0.10,
    0,
    0,
    now()
  )
ON CONFLICT (id) DO NOTHING;
