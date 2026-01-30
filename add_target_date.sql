-- Add target_date column to habits
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS target_date date;
