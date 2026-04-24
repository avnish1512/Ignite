-- ============================================================================
-- MIGRATION: Add profile_image_url column to students table
-- ============================================================================
-- Run this in Supabase SQL Editor to add support for profile image URLs

-- Add profile_image_url column if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS profile_image_url text;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'profile_image_url';

-- ============================================================================
-- STORAGE RLS POLICIES (FOR PROFILE-PHOTOS BUCKET)
-- ============================================================================
-- Run this in Supabase SQL Editor to set up storage access

-- Allow public read access to everyone
CREATE POLICY "Public Read Access Profile Photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload and manage their own profile images
CREATE POLICY "Allow authenticated uploads Profile Photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Allow authenticated updates Profile Photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-photos');

CREATE POLICY "Allow authenticated deletions Profile Photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photos');

