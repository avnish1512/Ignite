import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Phone, MapPin, GraduationCap, AlertCircle, User, Hash, Briefcase, FileText } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const COURSE_OPTIONS = [
  'B.Tech CSE', 'B.Tech IT', 'B.Tech E&TC', 'B.Tech Mech', 'B.Tech Civil', 'MBA', 'MCA'
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Passout'];

const InputField = React.memo(({ label, value, onChangeText, placeholder, icon: Icon, error, multiline = false, keyboardType = 'default' }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputContainer, error && styles.inputError]}>
      {Icon && <Icon size={18} color="#9CA3AF" />}
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
    {error && (
      <View style={styles.errorRow}>
        <AlertCircle size={12} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )}
  </View>
));

export default function ProfileSetupScreen() {
  const { student, completeProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState(student?.name || '');
  const [phone, setPhone] = useState(student?.phone || '');
  const [prnNumber, setPrnNumber] = useState(student?.prnNumber || '');
  const [enrollmentNo, setEnrollmentNo] = useState(student?.enrollmentNo || '');
  const [course, setCourse] = useState(student?.course || '');
  const [year, setYear] = useState(student?.year || '');
  const [cgpa, setCgpa] = useState(student?.cgpa ? String(student.cgpa) : '');
  const [address, setAddress] = useState(student?.address || '');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    if (!prnNumber.trim()) errs.prnNumber = 'PRN number is required';
    if (!course) errs.course = 'Please select your course';
    if (!year) errs.year = 'Please select your year';
    if (!cgpa) errs.cgpa = 'CGPA is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleComplete = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const updatedProfile = {
        ...student,
        name: fullName.trim(),
        phone: phone.trim(),
        prnNumber: prnNumber.trim(),
        enrollmentNo: enrollmentNo.trim(),
        course,
        year,
        cgpa: parseFloat(cgpa),
        address: address.trim(),
        profileCompleted: true,
      } as any;
      await completeProfile(updatedProfile);
      router.replace('/(tab)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <GraduationCap size={24} color="#6366F1" />
            </View>
            <Text style={styles.headerTitle}>Complete Profile</Text>
            <Text style={styles.headerSubtitle}>Set up your academic and professional identity</Text>
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Personal Details</Text>
            </View>
            <InputField
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              icon={User}
              error={errors.fullName}
            />
            <InputField
              label="Phone Number *"
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 9876543210"
              icon={Phone}
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <InputField
              label="Permanent Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Your current location"
              icon={MapPin}
              multiline
            />
          </View>

          {/* Academic Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <GraduationCap size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Academic Records</Text>
            </View>
            <InputField
              label="PRN Number *"
              value={prnNumber}
              onChangeText={setPrnNumber}
              placeholder="Enrollment / PRN ID"
              icon={Hash}
              error={errors.prnNumber}
            />
            
            <View style={styles.selectorGroup}>
              <Text style={styles.label}>Course *</Text>
              <View style={styles.chipContainer}>
                {COURSE_OPTIONS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, course === c && styles.chipActive]}
                    onPress={() => setCourse(c)}
                  >
                    <Text style={[styles.chipText, course === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.selectorGroup}>
              <Text style={styles.label}>Current Year *</Text>
              <View style={styles.chipContainer}>
                {YEAR_OPTIONS.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.chip, year === y && styles.chipActive]}
                    onPress={() => setYear(y)}
                  >
                    <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <InputField
              label="Current CGPA *"
              value={cgpa}
              onChangeText={setCgpa}
              placeholder="e.g. 8.75"
              icon={FileText}
              keyboardType="numeric"
              error={errors.cgpa}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving Profile...' : 'Complete & Enter Portal'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF',
    marginHorizontal: -16, marginTop: -16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 24,
  },
  headerIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginLeft: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, gap: 10,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#111827' },
  multilineInput: { minHeight: 60, textAlignVertical: 'top' },
  inputError: { borderColor: '#EF4444' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText: { fontSize: 11, color: '#EF4444' },
  selectorGroup: { marginBottom: 16 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  chipTextActive: { color: '#FFFFFF' },
  submitButton: {
    backgroundColor: '#6366F1', paddingVertical: 16, borderRadius: 10, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  submitButtonDisabled: { backgroundColor: '#9CA3AF' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
