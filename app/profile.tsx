import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Mail, Phone, MapPin, GraduationCap, Calendar, Edit3, Save, X, AlertCircle, Upload, Download, Trash2, FileText, Hash, Camera, Plus, Minus } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { ValidationRules, formatPhoneNumber } from '@/hooks/validation-utils';
import { useResumeUpload } from '@/hooks/resume-upload';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { student, updateStudent, uploadProfileImage } = useAuth();
  const router = useRouter();
  const { uploading, uploadProgress, uploadResume, deleteResume } = useResumeUpload();
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  
  const [editedProfile, setEditedProfile] = useState(student || {
    id: '',
    name: '',
    email: '',
    phone: '',
    course: '',
    year: '',
    cgpa: 0,
    skills: [],
    address: '',
    prnNumber: '',
    profileImageUrl: '',
  });

  const validateProfile = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate name
    const nameValidation = ValidationRules.name(editedProfile.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error || '';
    }

    // Validate email
    const emailValidation = ValidationRules.email(editedProfile.email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error || '';
    }

    // Validate phone
    if (editedProfile.phone) {
      const phoneValidation = ValidationRules.phone(editedProfile.phone);
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error || '';
      }
    }

    // Validate CGPA
    const cgpaValidation = ValidationRules.cgpa(editedProfile.cgpa);
    if (!cgpaValidation.valid) {
      newErrors.cgpa = cgpaValidation.error || '';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [editedProfile]);

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Profile' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Please login to view profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!validateProfile()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }
    try {
      let profileToSave = { ...editedProfile };
      
      // Upload profile image if it's a new local URI (not already a URL)
      if (editedProfile.profileImageUrl && 
          !editedProfile.profileImageUrl.startsWith('http') && 
          student?.id) {
        setProfileImageUploading(true);
        const uploadedUrl = await uploadProfileImage(student.id, editedProfile.profileImageUrl);
        setProfileImageUploading(false);
        
        if (uploadedUrl) {
          profileToSave.profileImageUrl = uploadedUrl;
        } else {
          Alert.alert('Warning', 'Profile image could not be uploaded, but profile will be saved');
        }
      }
      
      await updateStudent(profileToSave);
      setIsEditing(false);
      setErrors({});
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      setProfileImageUploading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCancel = () => {
    setEditedProfile(student);
    setIsEditing(false);
    setErrors({});
    setSkillInput('');
  };

  const handlePickProfileImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const image = result.assets[0];
        setProfileImageUploading(true);
        
        // In a real app, you would upload to a storage service
        // For now, we'll use the local URI
        setEditedProfile(prev => ({
          ...prev,
          profileImageUrl: image.uri
        }));
        
        setProfileImageUploading(false);
        Alert.alert('Success', 'Profile image updated');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      setProfileImageUploading(false);
    }
  }, []);

  const handleTakeProfilePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const image = result.assets[0];
        setProfileImageUploading(true);
        
        setEditedProfile(prev => ({
          ...prev,
          profileImageUrl: image.uri
        }));
        
        setProfileImageUploading(false);
        Alert.alert('Success', 'Profile photo captured');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      setProfileImageUploading(false);
    }
  }, []);

  const handleAddSkill = useCallback(() => {
    if (!skillInput.trim()) {
      Alert.alert('Error', 'Please enter a skill');
      return;
    }

    if (editedProfile.skills.includes(skillInput.trim())) {
      Alert.alert('Duplicate', 'This skill is already added');
      return;
    }

    setEditedProfile(prev => ({
      ...prev,
      skills: [...prev.skills, skillInput.trim()]
    }));
    setSkillInput('');
  }, [skillInput, editedProfile.skills]);

  const handleRemoveSkill = useCallback((skillToRemove: string) => {
    setEditedProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  }, []);

  const handleUploadResume = useCallback(async () => {
    if (!student) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setResumeError(null);

      const uploadResult = await uploadResume(student.id, student.name, {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      });

      if (uploadResult.success) {
        updateStudent({
          ...student,
          resumeUrl: uploadResult.downloadUrl,
          resume: uploadResult.downloadUrl
        });
        Alert.alert('Success', 'Resume uploaded successfully');
      } else {
        setResumeError(uploadResult.error || 'Failed to upload resume');
      }
    } catch (err) {
      setResumeError('An error occurred during selection');
      console.error(err);
    }
  }, [student, uploadResume, updateStudent]);

  const handleDeleteResume = useCallback(async () => {
    if (!student) return;

    Alert.alert(
      'Delete Resume',
      'Are you sure you want to delete your resume?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteResume(student.id, student.resume || '');
            if (result.success) {
              updateStudent({
                ...student,
                resumeUrl: undefined,
                resume: undefined
              });
              Alert.alert('Success', 'Resume deleted successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete resume');
            }
          }
        }
      ]
    );
  }, [student, deleteResume, updateStudent]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Profile',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              style={styles.headerButton}
            >
              {isEditing ? (
                <Save size={20} color="#6366F1" />
              ) : (
                <Edit3 size={20} color="#6366F1" />
              )}
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            {isEditing && profileImageUploading && (
              <View style={[styles.profileImage, styles.loadingOverlay]}>
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
            )}
            {editedProfile.profileImageUrl ? (
              <Image 
                source={{ uri: editedProfile.profileImageUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Text style={styles.profileAvatarText}>👤</Text>
              </View>
            )}
            
            {isEditing && (
              <View style={styles.imageActionButtons}>
                <TouchableOpacity 
                  style={styles.imageActionButton}
                  onPress={handlePickProfileImage}
                  disabled={profileImageUploading}
                >
                  <Upload size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.imageActionButton}
                  onPress={handleTakeProfilePhoto}
                  disabled={profileImageUploading}
                >
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isEditing ? (
            <>
              <TextInput
                style={[styles.nameInput, errors.name && styles.inputError]}
                value={editedProfile.name}
                onChangeText={(text) => setEditedProfile(prev => ({ ...prev, name: text }))}
                placeholder="Full Name"
              />
              {errors.name && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.name}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.profileName}>{student.name}</Text>
          )}
          <Text style={styles.profileCourse}>{student.course} • {student.year}</Text>
          <View style={styles.cgpaContainer}>
            <Text style={styles.cgpaLabel}>CGPA</Text>
            {isEditing ? (
              <>
                <TextInput
                  style={[styles.cgpaInput, errors.cgpa && styles.inputError]}
                  value={editedProfile.cgpa.toString()}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, cgpa: parseFloat(text) || 0 }))}
                  placeholder="0.0"
                  keyboardType="decimal-pad"
                />
                {errors.cgpa && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.cgpa}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.cgpaValue}>{student.cgpa}</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <X size={16} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Mail size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.detailInput, errors.email && styles.inputError]}
                    value={editedProfile.email}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, email: text }))}
                    placeholder="Email address"
                    keyboardType="email-address"
                  />
                  {errors.email && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.detailValue}>{student.email}</Text>
              )}
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Hash size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>PRN</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedProfile.prnNumber}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, prnNumber: text }))}
                  placeholder="Permanent Registration Number"
                  autoCapitalize="characters"
                />
              ) : (
                <Text style={styles.detailValue}>{student.prnNumber || 'Not provided'}</Text>
              )}
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Phone size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.detailInput, errors.phone && styles.inputError]}
                    value={editedProfile.phone}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, phone: text }))}
                    placeholder="10-digit phone number"
                    keyboardType="phone-pad"
                  />
                  {errors.phone && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.detailValue}>{student.phone || 'Not provided'}</Text>
              )}
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <MapPin size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Address</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedProfile.address}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, address: text }))}
                  placeholder="Address"
                  multiline
                />
              ) : (
                <Text style={styles.detailValue}>{student.address || 'Not provided'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Academic Information */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <GraduationCap size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Course</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedProfile.course}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, course: text }))}
                  placeholder="Course name"
                />
              ) : (
                <Text style={styles.detailValue}>{student.course}</Text>
              )}
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Year</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedProfile.year}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, year: text }))}
                  placeholder="Academic year"
                />
              ) : (
                <Text style={styles.detailValue}>{student.year}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Skills Section */}
        <View style={styles.detailsSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Professional Skills</Text>
            {isEditing && <Text style={styles.editingBadge}>Editing</Text>}
          </View>
          
          {isEditing && (
            <View style={styles.skillInputContainer}>
              <TextInput
                style={styles.skillInput}
                value={skillInput}
                onChangeText={setSkillInput}
                placeholder="Enter a skill (e.g., React, Python, AWS)"
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={handleAddSkill}
              />
              <TouchableOpacity 
                style={styles.addSkillButton}
                onPress={handleAddSkill}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.skillsContainer}>
            {editedProfile.skills && editedProfile.skills.length > 0 ? (
              editedProfile.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.removeSkillButton}
                      onPress={() => handleRemoveSkill(skill)}
                    >
                      <Minus size={14} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noSkillsText}>
                {isEditing ? 'Add your professional skills above' : 'No skills added yet'}
              </Text>
            )}
          </View>
        </View>

        {/* Resume Section */}
        <View style={styles.detailsSection}>
          <View style={styles.resumeHeader}>
            <Text style={styles.sectionTitle}>Resume</Text>
            {uploading && (
              <ActivityIndicator size="small" color="#6366F1" />
            )}
          </View>

          {resumeError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorBannerText}>{resumeError}</Text>
            </View>
          )}

          {student.resume ? (
            <View style={styles.resumeCard}>
              <View style={styles.resumeContent}>
                <View style={styles.resumeIcon}>
                  <FileText size={24} color="#6366F1" />
                </View>
                <View style={styles.resumeInfo}>
                  <Text style={styles.resumeFileName}>Your Resume</Text>
                  <Text style={styles.resumeUploadedText}>
                    Status: Verified & Uploaded
                  </Text>
                </View>
              </View>
              <View style={styles.resumeActions}>
                <TouchableOpacity
                  style={styles.resumeActionButton}
                  onPress={() => {
                    if (student.resume) {
                      // Open resume in browser/viewer
                      Alert.alert('Resume', 'Opening resume link...');
                      import('expo-web-browser').then(WebBrowser => {
                        WebBrowser.openBrowserAsync(student.resume!);
                      });
                    }
                  }}
                  disabled={uploading}
                >
                  <Download size={18} color="#6366F1" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resumeActionButton, styles.deleteButton]}
                  onPress={handleDeleteResume}
                  disabled={uploading}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={handleUploadResume}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <>
                  <Upload size={20} color="#6366F1" />
                  <Text style={styles.uploadButtonText}>Upload Resume (PDF)</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {student.resume && (
            <TouchableOpacity
              style={styles.changeResumeButton}
              onPress={handleUploadResume}
              disabled={uploading}
            >
              <Upload size={16} color="#6366F1" />
              <Text style={styles.changeResumeText}>Change Resume</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.resumeHint}>
            Max file size: 5MB • Format: PDF only
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 24,
    marginBottom: 8,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  profileAvatarText: {
    fontSize: 48,
  },
  imageActionButtons: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 4,
    minWidth: 200,
  },
  profileCourse: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  cgpaContainer: {
    alignItems: 'center',
  },
  cgpaLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  cgpaValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  cgpaInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 4,
    minWidth: 80,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editingBadge: {
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
  },
  detailInput: {
    fontSize: 16,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  addSkillButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeSkillButton: {
    padding: 2,
  },
  skillText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  noSkillsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  inputError: {
    borderBottomColor: '#EF4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: -10,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  resumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  resumeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resumeInfo: {
    flex: 1,
  },
  resumeFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resumeUploadedText: {
    fontSize: 12,
    color: '#6B7280',
  },
  resumeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resumeActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteButton: {
    borderColor: '#FEE2E2',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#6366F1',
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },

  changeResumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  changeResumeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  disabledButton: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  resumeHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
});