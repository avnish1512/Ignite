/**
 * ============================================================================
 * IGNITE PORTAL - STORAGE SETUP (PROGRAMMATIC)
 * ============================================================================
 * This file provides JavaScript code to set up storage buckets and policies
 * using the Supabase client library.
 * 
 * You can either:
 * 1. Copy and run this code in your app initialization
 * 2. Run it manually in the browser console
 * 3. Use it as a reference for the Supabase API
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (already done in your app via config/supabase.ts)
// const supabase = createClient(url, anonKey);

/**
 * OPTION 1: Create buckets programmatically
 * Run this ONCE to create the storage buckets
 */
export async function setupStorageBuckets(supabase) {
  try {
    console.log('Creating storage buckets...');

    // Create profile-photos bucket
    const { data: photosData, error: photosError } = await supabase
      .storage
      .createBucket('profile-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

    if (photosError && !photosError.message.includes('already exists')) {
      console.error('Error creating profile-photos bucket:', photosError);
    } else {
      console.log('✅ profile-photos bucket ready');
    }

    // Create resumes bucket
    const { data: resumesData, error: resumesError } = await supabase
      .storage
      .createBucket('resumes', {
        public: false, // Keep private
        allowedMimeTypes: ['application/pdf', 'application/msword'],
        fileSizeLimit: 10485760 // 10MB
      });

    if (resumesError && !resumesError.message.includes('already exists')) {
      console.error('Error creating resumes bucket:', resumesError);
    } else {
      console.log('✅ resumes bucket ready');
    }

  } catch (error) {
    console.error('Storage setup error:', error);
  }
}

/**
 * OPTION 2: Upload a file to storage
 * Use this in your photo-upload and resume-upload hooks
 */
export async function uploadToStorage(supabase, bucketName, filePath, file) {
  try {
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`Error uploading to ${bucketName}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

/**
 * OPTION 3: Get a public URL for a file
 * Use this to display photos and allow resume downloads
 */
export function getStorageUrl(supabase, bucketName, filePath) {
  try {
    const { data } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting URL:', error);
    return null;
  }
}

/**
 * OPTION 4: Delete a file from storage
 * Use this when users want to remove their photo or resume
 */
export async function deleteFromStorage(supabase, bucketName, filePath) {
  try {
    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`Error deleting from ${bucketName}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * ============================================================================
 * HOW TO USE THIS FILE
 * ============================================================================
 *
 * 1. In your app initialization (e.g., app.tsx or _layout.tsx):
 *    import { setupStorageBuckets } from './SUPABASE_STORAGE_SETUP';
 *    import { supabase } from './config/supabase';
 *    
 *    // Call once when app starts
 *    useEffect(() => {
 *      setupStorageBuckets(supabase);
 *    }, []);
 *
 * 2. In your photo-upload component:
 *    import { uploadToStorage, getStorageUrl } from './SUPABASE_STORAGE_SETUP';
 *    
 *    const handleUpload = async (file) => {
 *      const fileName = `${userId}/${Date.now()}-photo.jpg`;
 *      const result = await uploadToStorage(supabase, 'profile-photos', fileName, file);
 *      if (result) {
 *        const url = getStorageUrl(supabase, 'profile-photos', fileName);
 *        // Save URL to database
 *      }
 *    };
 *
 * 3. In your resume-upload component:
 *    Similar pattern for 'resumes' bucket
 *
 * ============================================================================
 * STORAGE POLICY SETUP (Via Supabase UI)
 * ============================================================================
 *
 * After creating buckets, set up policies in Supabase Dashboard:
 *
 * PROFILE-PHOTOS:
 * 1. Storage → profile-photos → Policies tab
 * 2. Add policy: "For authenticated users"
 * 3. Allow: SELECT, INSERT, UPDATE, DELETE
 * 4. Expression: bucket_id = 'profile-photos'
 *
 * RESUMES:
 * 1. Storage → resumes → Policies tab
 * 2. Add policy: "For authenticated users"
 * 3. Allow: SELECT, INSERT, UPDATE, DELETE
 * 4. Expression: bucket_id = 'resumes'
 * 5. Add policy: "For admin"
 * 6. Allow: SELECT, INSERT, UPDATE, DELETE
 * 7. Expression: (auth.jwt() ->> 'email') = 'admin@sgu.edu.in' AND bucket_id = 'resumes'
 *
 * ============================================================================
 */

export default {
  setupStorageBuckets,
  uploadToStorage,
  getStorageUrl,
  deleteFromStorage
};
