-- THIS WILL DISABLE ALL SECURITY POLICIES (Ultimate Fix)
ALTER TABLE public.habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs DISABLE ROW LEVEL SECURITY;

-- Optional: ensure no weird permissions are blocking
GRANT ALL ON TABLE public.habits TO anon;
GRANT ALL ON TABLE public.habits TO authenticated;
GRANT ALL ON TABLE public.habit_logs TO anon;
GRANT ALL ON TABLE public.habit_logs TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
