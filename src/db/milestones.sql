-- Create Milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Disable RLS for milestones to match existing setup
ALTER TABLE public.milestones DISABLE ROW LEVEL SECURITY;
