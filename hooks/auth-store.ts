import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

import { Student } from '@/types/job';
import { supabase } from '@/config/supabase';
import { DEFAULT_ADMIN_ID } from '@/constants/admin';

type Admin = {
  id: string;
  name: string;
  email: string;
  role: 'admin';
};

type User = Student | Admin;

const mockAdmin: Admin = {
  id: 'admin1',
  name: 'Admin User',
  email: 'admin@sgu.edu.in',
  role: 'admin'
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<any | null>(null);

  // Listen to Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      console.log('Auth state changed:', user?.email);
      setSupabaseUser(user || null);

      if (user) {
        try {
          // Check if it's admin
          if (user.email === 'admin@sgu.edu.in') {
            const adminUser: Admin = {
              id: DEFAULT_ADMIN_ID,
              name: user.user_metadata?.name || 'Admin',
              email: user.email || '',
              role: 'admin',
            };
            await AsyncStorage.setItem('user', JSON.stringify(adminUser));
            setUser(adminUser);
          } else {
            // Load student profile from Supabase
            const { data: studentData, error } = await supabase
              .from('students')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching student:', error.message);
            }

            if (!studentData) {
              console.log('Student not found, creating placeholder');
              // Create a minimal placeholder so they can log in
              const basicStudent: Student = {
                id: user.id,
                name: user.user_metadata?.name || 'Student',
                email: user.email || '',
                phone: '',
                course: '',
                year: '',
                cgpa: 0,
                skills: [],
                profileCompleted: false,
              };
              try {
                // Insert with snake_case column names
                await supabase.from('students').insert([{
                  id: basicStudent.id,
                  name: basicStudent.name,
                  email: basicStudent.email,
                  phone: basicStudent.phone,
                  course: basicStudent.course,
                  year: basicStudent.year,
                  cgpa: basicStudent.cgpa,
                  skills: basicStudent.skills,
                  profile_completed: basicStudent.profileCompleted,
                  created_at: new Date().toISOString()
                }]);
              } catch (writeErr) {
                console.warn('Could not write placeholder student:', writeErr);
              }
              await AsyncStorage.setItem('user', JSON.stringify(basicStudent));
              setUser(basicStudent);
            } else {
              // Convert snake_case to camelCase
              const convertedStudent: Student = {
                id: studentData.id,
                name: studentData.name,
                email: studentData.email,
                phone: studentData.phone || '',
                course: studentData.course || '',
                year: studentData.year || '',
                cgpa: studentData.cgpa || 0,
                skills: studentData.skills || [],
                profileImageUrl: studentData.profile_image_url || undefined,
                profileCompleted: studentData.profile_completed || false,
              };

              // Check if admin has deactivated this student
              if (studentData.is_active === false) {
                console.log('Blocked inactive student from logging in:', user.email);
                await supabase.auth.signOut();
                await AsyncStorage.removeItem('user');
                setUser(null);
                setIsLoading(false);
                Alert.alert(
                  'Account Disabled',
                  'Your account has been disabled. Please contact the admin.',
                  [{ text: 'OK' }]
                );
                return;
              }

              await AsyncStorage.setItem('user', JSON.stringify(convertedStudent));
              setUser(convertedStudent);
              console.log('Loaded student profile:', convertedStudent.name);
            }
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser(null);
        }
      } else {
        await AsyncStorage.removeItem('user');
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, userType: 'student' | 'admin' = 'student') => {
    setIsLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log('Login attempt:', { email: trimmedEmail, userType });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });

      if (error) throw error;
      
      console.log('Supabase login successful:', data.user?.email);
      return { success: true, userType };
    } catch (error: any) {
      console.error('Login error:', error.message);
      
      let errorMessage = 'Login failed';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Incorrect email or password. Please try again.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'Student account not found. Please contact admin.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address first.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Initiating logout...');
      
      // 1. ABSOLUTELY clear local state immediately
      setUser(null);
      setSupabaseUser(null);
      await AsyncStorage.removeItem('user');
      
      // 2. Attempt server-side sign out (ignore errors as session might already be dead)
      try {
        await supabase.auth.signOut({ scope: 'local' }); // Force local cleanup
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error (ignoring):', err);
      }
      
      console.log('✅ Logout sequence complete');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setSupabaseUser(null);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Update in Supabase if it's a student (not admin)
      if ('course' in updatedUser) {
        const { error } = await supabase
          .from('students')
          .update({
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            course: updatedUser.course,
            year: updatedUser.year,
            cgpa: updatedUser.cgpa,
            skills: updatedUser.skills,
            profile_completed: updatedUser.profileCompleted,
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedUser.id);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedStudent));
      setUser(updatedStudent);
      
      // Update in Supabase - convert camelCase to snake_case
      if (supabaseUser) {
        const { error } = await supabase
          .from('students')
          .update({
            name: updatedStudent.name,
            email: updatedStudent.email,
            phone: updatedStudent.phone,
            course: updatedStudent.course,
            year: updatedStudent.year,
            cgpa: updatedStudent.cgpa,
            skills: updatedStudent.skills,
            profile_image_url: updatedStudent.profileImageUrl || null,
            profile_completed: updatedStudent.profileCompleted,
            updated_at: new Date().toISOString()
          })
          .eq('id', supabaseUser.id);
        
        if (error) {
          // Log detailed error info
          console.error('Supabase update error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }


      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update student profile';
      console.error('Error updating student:', errorMessage);
      
      // Check if this is a column missing error
      if (error instanceof Error && error.message.includes('profile_image_url')) {
        console.error('⚠️ Database column missing: profile_image_url. Run MIGRATION_ADD_PROFILE_IMAGE_URL.sql in Supabase SQL Editor');
      }
      throw error;
    }
  };

  const completeProfile = async (profileData: Student) => {
    try {
      const completedProfile = { ...profileData, profileCompleted: true };
      await AsyncStorage.setItem('user', JSON.stringify(completedProfile));
      setUser(completedProfile);
      
      // Update in Supabase — convert camelCase to snake_case
      if (supabaseUser) {
        const { error } = await supabase
          .from('students')
          .update({
            name: completedProfile.name,
            email: completedProfile.email,
            phone: completedProfile.phone,
            course: completedProfile.course,
            year: completedProfile.year,
            cgpa: completedProfile.cgpa,
            skills: completedProfile.skills,
            profile_image_url: completedProfile.profileImageUrl || null,
            profile_completed: true,
            prn_number: completedProfile.prnNumber || null,
            enrollment_no: completedProfile.enrollmentNo || null,
            address: completedProfile.address || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', supabaseUser.id);
        
        if (error) {
          console.error('Supabase update error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }


      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete profile';
      console.error('Error completing profile:', errorMessage);
      
      // Check if this is a column missing error
      if (error instanceof Error && error.message.includes('profile_image_url')) {
        console.error('⚠️ Database column missing: profile_image_url. Run MIGRATION_ADD_PROFILE_IMAGE_URL.sql in Supabase SQL Editor');
      }
      throw error;
    }
  };

  const getAvailableStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*');

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }, []);

  // Upload profile image to Supabase Storage
  const uploadProfileImage = useCallback(async (studentId: string, imageUri: string): Promise<string | null> => {
    try {
      if (!imageUri) return null;
      
      // Fetch the image file
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create a unique filename
      const filename = `${studentId}_profile_${Date.now()}.jpg`;
      const filePath = `profile-images/${filename}`;
      
      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true // Replace if exists
        });
      
      if (uploadError) {
        console.error('Error uploading profile image:', uploadError);
        
        // Check for specific storage errors
        if (uploadError.message.includes('bucket not found') || uploadError.message.includes('Bucket not found')) {
          console.error('⚠️ Supabase Storage bucket "profile-photos" not found. Please create it in Supabase dashboard.');
        } else if (uploadError.message.includes('row-level security') || uploadError.message === 'New row violates row-level security policy') {
          console.error('⚠️ RLS policy missing or restrictive for bucket "profile-photos".');
        }
        
        return null;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
      
      return publicUrlData?.publicUrl || null;
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      return null;
    }
  }, []);

  return {
    user,
    student: user && 'course' in user ? user : null,
    admin: user && 'role' in user ? user : null,
    supabaseUser,
    isLoading,
    login,
    logout,
    updateUser,
    updateStudent,
    completeProfile,
    getAvailableStudents,
    uploadProfileImage,
    isAuthenticated: !!user,
    isAdmin: !!user && 'role' in user,
    isStudent: !!user && 'course' in user
  };
});