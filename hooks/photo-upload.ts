import { useState, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import * as ImagePicker from 'expo-image-picker';

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Pick image from camera or gallery
  const pickImage = useCallback(async (source: 'camera' | 'gallery' = 'gallery') => {
    try {
      setError(null);

      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Camera permission denied');
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled) {
          return result.assets[0];
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Gallery permission denied');
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled) {
          return result.assets[0];
        }
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick image';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Upload photo to Supabase Storage
  const uploadPhoto = useCallback(async (
    studentId: string,
    imageAsset: {
      uri: string;
      width: number;
      height: number;
    }
  ) => {
    try {
      if (!studentId || !imageAsset?.uri) {
        throw new Error('Missing studentId or image URI');
      }

      setUploading(true);
      setError(null);
      setUploadProgress(0);

      console.log('📸 Starting photo upload for student:', studentId);
      console.log('📸 Image URI:', imageAsset.uri);

      const timestamp = Date.now();
      const storagePath = `profile-photos/${studentId}/profile_${timestamp}.jpg`;

      console.log('📸 Storage path:', storagePath);

      // Convert URI to blob
      let fileBlob: Blob;

      if (imageAsset.uri.startsWith('file://') || imageAsset.uri.startsWith('/')) {
        console.log('📸 Converting file:// URI to blob');
        try {
          const response = await fetch(imageAsset.uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          fileBlob = await response.blob();
          console.log('📸 Blob created from file://, size:', fileBlob.size, 'bytes');
        } catch (fetchError) {
          console.error('📸 File fetch error:', fetchError);
          throw new Error('Failed to read image file. Please try again.');
        }
      } else if (imageAsset.uri.startsWith('http')) {
        throw new Error('Please select a local file to upload');
      } else {
        console.log('📸 Converting data URL to blob');
        try {
          const response = await fetch(imageAsset.uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          fileBlob = await response.blob();
          console.log('📸 Blob created from data URL, size:', fileBlob.size, 'bytes');
        } catch (error) {
          console.error('📸 Blob creation error:', error);
          throw new Error('Failed to process image. Please try again.');
        }
      }

      if (fileBlob.size === 0) {
        throw new Error('Image file is empty');
      }

      // Check file size (max 5MB)
      const maxFileSize = 5 * 1024 * 1024;
      if (fileBlob.size > maxFileSize) {
        throw new Error(`Image is too large (${(fileBlob.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`);
      }

      console.log(`📸 File size OK: ${(fileBlob.size / 1024).toFixed(1)}KB`);

      try {
        const { data, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(storagePath, fileBlob, {
            upsert: true,
            contentType: 'image/jpeg'
          });

        if (uploadError) throw uploadError;
        console.log('📸 Upload complete');
      } catch (uploadError: any) {
        console.error('❌ Supabase upload error:', uploadError);
        if (uploadError.message?.includes('permission')) {
          throw new Error('Storage permission denied. Admin needs to update storage permissions.');
        }
        throw uploadError;
      }

      console.log('📸 Getting public URL');
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(storagePath);

      const downloadUrl = data?.publicUrl;
      
      if (!downloadUrl) {
        throw new Error('Failed to get image URL.');
      }

      console.log('📸 Download URL obtained');

      // Update student profile with photo URL
      console.log('📸 Updating Supabase document...');
      try {
        await supabase
          .from('students')
          .update({
            profile_photo: downloadUrl,
            profile_photo_path: storagePath,
          })
          .eq('id', studentId);
        console.log('📸 Supabase document updated successfully');
      } catch (dbError: any) {
        console.error('❌ Database update error:', dbError);
        console.warn('⚠️ Warning: Photo uploaded but could not update profile. Please try updating your profile manually.');
      }

      setUploadProgress(100);
      return {
        success: true,
        downloadUrl,
        storagePath,
        message: 'Photo uploaded successfully'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo';
      console.error('❌ Photo upload error:', errorMessage);
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setUploading(false);
    }
  }, []);

  // Delete photo from Supabase Storage
  const deletePhoto = useCallback(async (studentId: string, photoPath: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase.storage
        .from('profile-photos')
        .remove([photoPath]);

      if (deleteError) throw deleteError;

      // Update student profile to remove photo URL
      await supabase
        .from('students')
        .update({
          profilePhoto: null,
          profilePhotoPath: null,
        })
        .eq('id', studentId);

      return {
        success: true,
        message: 'Photo deleted successfully'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  return {
    uploading,
    uploadProgress,
    error,
    pickImage,
    uploadPhoto,
    deletePhoto,
  };
};
