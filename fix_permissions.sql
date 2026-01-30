-- 1. Disable RLS entirely (the simplest fix for a private/single-user app)
-- OR keep it on but fix the policy. Let's do both to be sure.

ALTER TABLE public.habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public access to habits" ON public.habits;
DROP POLICY IF EXISTS "Allow public access to habit_logs" ON public.habit_logs;

-- 3. Re-enable RLS (optional, but good practice if you want to keep lock icon green)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create wide-open policies for anon role
CREATE POLICY "Allow everything for habits" ON public.habits
FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow everything for logs" ON public.habit_logs
FOR ALL TO anon USING (true) WITH CHECK (true);
