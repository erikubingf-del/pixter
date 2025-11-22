-- Add city field to profiles table for Pix merchant city
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add comment
COMMENT ON COLUMN profiles.city IS 'City for Pix payments (merchant city in BR Code)';
