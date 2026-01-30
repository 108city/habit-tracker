-- Add 'status' column to distinguish between completed and skipped days
ALTER TABLE public.habit_logs 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed'; -- 'completed' or 'skipped'
