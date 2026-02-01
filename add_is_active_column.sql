-- Add is_active column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update any existing habits to be active by default
UPDATE habits SET is_active = true WHERE is_active IS NULL;
