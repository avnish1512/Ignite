# 🔧 Fix: Profile Image Update Error

## Problem
The app was trying to save profile images but failed with: **"Failed to update student profile"**

## Root Cause
The database `students` table is missing the `profile_image_url` column that the code needs.

## Solution: Add the Column to Supabase

### Steps:
1. **Open Supabase SQL Editor**
   - Go to https://app.supabase.com
   - Select your project
   - Click "SQL Editor" (left sidebar)
   - Click "New Query"

2. **Run the Migration**
   - Copy the SQL from: `MIGRATION_ADD_PROFILE_IMAGE_URL.sql`
   - Paste into the SQL Editor
   - Click the "Run" button (blue play icon)
   - Wait for ✅ Success message

3. **Verify It Worked**
   - You should see: "profile_image_url | text" in the output
   - This means the column was added successfully

4. **Test the App**
   - Go back to the app
   - Try updating your profile picture again
   - It should now work! ✅

## Alternative: Manual SQL
If you prefer to copy/paste manually, here's the exact SQL:

```sql
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS profile_image_url text;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'profile_image_url';
```

## What This Does
- Adds a new `profile_image_url` text column to store profile image URLs
- If the column already exists, it won't error (the `IF NOT EXISTS` part handles this)
- The column stores full URLs to images stored in Supabase Storage

## Still Having Issues?
If you get an error:
- Check the browser console for detailed error messages (they'll help debug)
- Make sure you're running the SQL in the correct Supabase project
- Verify that RLS policies allow authenticated users to update their own records

✅ After running this migration, profile image updates will work perfectly!
