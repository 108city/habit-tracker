-- Update the habits table to support frequency
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS frequency_type text DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS frequency_value int DEFAULT 1,
ADD COLUMN IF NOT EXISTS frequency_days int[] DEFAULT '{}';
