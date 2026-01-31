-- 1. Create the new habits
INSERT INTO public.habits (name, frequency_type, created_at)
VALUES 
  ('Exercise', 'daily', '2026-01-01 00:00:00+00'),
  ('Log Food', 'daily', '2026-01-01 00:00:00+00'),
  ('Drink Water', 'daily', '2026-01-01 00:00:00+00'),
  ('Read', 'daily', '2026-01-01 00:00:00+00'),
  ('Take a progress photo', 'daily', '2026-01-01 00:00:00+00');

-- 2. Backfill Completed Days (Jan 1 - Jan 22)
INSERT INTO public.habit_logs (habit_id, completed_at, status)
SELECT h.id, d.day + interval '12 hours', 'completed'
FROM public.habits h
CROSS JOIN generate_series('2026-01-01'::timestamp, '2026-01-22'::timestamp, '1 day'::interval) AS d(day)
WHERE h.name IN ('Exercise', 'Log Food', 'Drink Water', 'Read', 'Take a progress photo')
AND h.created_at >= '2026-01-01';

-- 3. Backfill Skipped/Break Days (Jan 23 - Jan 28)
INSERT INTO public.habit_logs (habit_id, completed_at, status)
SELECT h.id, d.day + interval '12 hours', 'skipped'
FROM public.habits h
CROSS JOIN generate_series('2026-01-23'::timestamp, '2026-01-28'::timestamp, '1 day'::interval) AS d(day)
WHERE h.name IN ('Exercise', 'Log Food', 'Drink Water', 'Read', 'Take a progress photo')
AND h.created_at >= '2026-01-01';

-- 4. Backfill Final Days (Jan 29 - Jan 30)
INSERT INTO public.habit_logs (habit_id, completed_at, status)
SELECT h.id, d.day + interval '12 hours', 'completed'
FROM public.habits h
CROSS JOIN generate_series('2026-01-29'::timestamp, '2026-01-30'::timestamp, '1 day'::interval) AS d(day)
WHERE h.name IN ('Exercise', 'Log Food', 'Drink Water', 'Read', 'Take a progress photo')
AND h.created_at >= '2026-01-01';
