import { useState, useCallback } from 'react';
import { supabase } from '@/config/supabase';

export interface Resume {
  id: string;
  studentId: string;
  fileName: string;
  fileSize: number;
  uploadedDate: Date;
  downloadUrl: string;
  isDefault: boolean;
}

export const useResumeUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);

  // Upload resume
  const uploadResume = useCallback(async (
    studentId: string,
    studentName: string,
    file: {
      uri: string;
      name: string;
      type: string;
    }
  ) => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const storagePath = `resumes/${studentId}/resume_${timestamp}.${fileExtension}`;

      // Convert URI to blob
      let fileBlob: Blob;

      if (file.uri.startsWith('file://') || file.uri.startsWith('/')) {
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
      } else if (file.uri.startsWith('http')) {
        throw new Error('Please select a local file to upload');
      } else {
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
      }

      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, fileBlob, {
          upsert: true,
          contentType: file.type || 'application/octet-stream'
        });

      if (uploadError) throw uploadError;

      // Get download URL
      const { data: publicUrlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(storagePath);

      const downloadUrl = publicUrlData?.publicUrl;
      if (!downloadUrl) throw new Error('Failed to get download URL');

      // Update student profile with resume URL
      const { error: updateError } = await supabase
        .from('students')
        .update({
          resume: downloadUrl,
          resume_path: storagePath,
          resume_file_name: file.name,
          resume_uploaded_date: new Date().toISOString()
        })
        .eq('id', studentId);

      if (updateError) throw updateError;

      setUploadProgress(100);
      return {
        success: true,
        downloadUrl,
        message: 'Resume uploaded successfully'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload resume';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  // Delete resume
  const deleteResume = useCallback(async (
    studentId: string,
    resumePath: string
  ) => {
    try {
      setError(null);

      // Delete from Supabase Storage
      if (resumePath) {
        const { error: deleteError } = await supabase.storage
          .from('resumes')
          .remove([resumePath]);

        if (deleteError) throw deleteError;
      }

      // Update student profile to remove resume
      const { error: updateError } = await supabase
        .from('students')
        .update({
          resume: null,
          resume_path: null,
          resume_file_name: null,
          resume_uploaded_date: null
        })
        .eq('id', studentId);

      if (updateError) throw updateError;

      return { success: true, message: 'Resume deleted successfully' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete resume';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get student's resumes
  const getStudentResumes = useCallback(async (studentId: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .list(`${studentId}/`);

      if (error) throw error;

      const resumesList: Resume[] = [];
      for (const file of data || []) {
        const { data: publicUrlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(`${studentId}/${file.name}`);

        resumesList.push({
          id: file.name,
          studentId,
          fileName: file.name.split('_')[1] || file.name,
          fileSize: file.metadata?.size || 0,
          uploadedDate: new Date(file.created_at || Date.now()),
          downloadUrl: publicUrlData?.publicUrl || '',
          isDefault: false
        });
      }

      setResumes(resumesList);
      return resumesList;
    } catch (err) {
      console.error('Error getting resumes:', err);
      return [];
    }
  }, []);

  // Download resume
  const downloadResume = useCallback(async (downloadUrl: string, fileName: string) => {
    try {
      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.click();
      }
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download resume';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    uploading,
    uploadProgress,
    error,
    resumes,
    uploadResume,
    deleteResume,
    getStudentResumes,
    downloadResume
  };
};
