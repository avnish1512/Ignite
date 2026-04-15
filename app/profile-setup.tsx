import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Phone, MapPin, GraduationCap, AlertCircle, User, Hash, GraduationCap as CapIcon } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const COURSE_OPTIONS = [
  'B.Tech Computer Science',
  'B.Tech Information Technology',
  'B.Tech Electronics & Communication',
  'B.Tech Mechanical Engineering',
  'B.Tech Civil Engineering',
  'B.Tech Electrical Engineering',
  'Computer Science Engineering',
  'Information Technology',
  'Electronics and Communication',
  'MBA',
  'MCA',
  'M.Tech',
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Passout'];

const ErrorMsg = ({ msg }: { msg: string }) => (
  <View style={styles.errorRow}>
    <AlertCircle size={12} color="#EF4444" />
    <Text style={styles.errorText}>{msg}</Text>
  </View>
);

export default function ProfileSetupScreen() {
  const { student, completeProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fields — name comes pre-filled from Firebase Auth but student can correct it
  const [fullName, setFullName] = useState(student?.name || '');
  const [phone, setPhone] = useState(student?.phone || '');
  const [prnNumber, setPrnNumber] = useState(student?.prnNumber || '');
  const [enrollmentNo, setEnrollmentNo] = useState(student?.enrollmentNo || '');
  const [course, setCourse] = useState(student?.course || '');
  const [customCourse, setCustomCourse] = useState('');
  const [year, setYear] = useState(student?.year || '');
  const [cgpa, setCgpa] = useState(student?.cgpa ? String(student.cgpa) : '');
  const [address, setAddress] = useState(student?.address || '');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[\d\s\+\-\(\)]{8,15}$/.test(phone.trim())) errs.phone = 'Enter a valid phone number';
    if (!prnNumber.trim()) errs.prnNumber = 'PRN number is required';
    const finalCourse = customCourse.trim() || course;
    if (!finalCourse) errs.course = 'Please select or enter your course';
    if (!year) errs.year = 'Please select your year of study';
    if (!cgpa) errs.cgpa = 'CGPA is required';
    else {
      const val = parseFloat(cgpa);
      if (isNaN(val) || val < 0 || val > 10) errs.cgpa = 'CGPA must be between 0 and 10';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleComplete = async () => {
    if (!validate()) {
      Alert.alert('Missing Info', 'Please fill all required fields before continuing.');
      return;
    }
    if (!student) return;

    const finalCourse = customCourse.trim() || course;

    setLoading(true);
    try {
      const updatedProfile = {
        ...student,
        name: fullName.trim(),
        phone: phone.trim(),
        prnNumber: prnNumber.trim(),
        enrollmentNo: enrollmentNo.trim(),
        course: finalCourse,
        year,
        cgpa: parseFloat(cgpa),
        address: address.trim(),
        profileCompleted: true,
      };
      await completeProfile(updatedProfile);
      router.replace('/(tab)');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save profile';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerBlock}>
            <View style={styles.iconWrap}>
              <CapIcon size={32} color="#6366F1" />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Fill in your details to start applying for placements
            </Text>
          </View>

          {/* Email info banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              📧 Logged in as <Text style={styles.emailHighlight}>{student.email}</Text>
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name <Text style={styles.req}>*</Text></Text>
              <View style={[styles.inputRow, errors.fullName && styles.inputError]}>
                <User size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChangeText={v => { setFullName(v); if (errors.fullName) setErrors(p => ({ ...p, fullName: '' })); }}
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.fullName && <ErrorMsg msg={errors.fullName} />}
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number <Text style={styles.req}>*</Text></Text>
              <View style={[styles.inputRow, errors.phone && styles.inputError]}>
                <Phone size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChangeText={v => { setPhone(v); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.phone && <ErrorMsg msg={errors.phone} />}
            </View>

            {/* PRN Number */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>PRN Number <Text style={styles.req}>*</Text></Text>
              <Text style={styles.fieldHint}>Permanent Registration Number issued by your university</Text>
              <View style={[styles.inputRow, errors.prnNumber && styles.inputError]}>
                <Hash size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 72310120001"
                  value={prnNumber}
                  onChangeText={v => { setPrnNumber(v); if (errors.prnNumber) setErrors(p => ({ ...p, prnNumber: '' })); }}
                  keyboardType="default"
                  autoCapitalize="characters"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.prnNumber && <ErrorMsg msg={errors.prnNumber} />}
            </View>

            {/* Enrollment No (optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Enrollment Number <Text style={styles.optional}>(optional)</Text>
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.textInput, { marginLeft: 0 }]}
                  placeholder="e.g. SGU2024CS001"
                  value={enrollmentNo}
                  onChangeText={setEnrollmentNo}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Course */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Course / Program <Text style={styles.req}>*</Text></Text>
              <View style={styles.optionsWrap}>
                {COURSE_OPTIONS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, course === c && styles.chipActive]}
                    onPress={() => {
                      setCourse(c);
                      setCustomCourse('');
                      if (errors.course) setErrors(p => ({ ...p, course: '' }));
                    }}
                  >
                    <Text style={[styles.chipText, course === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Custom course input */}
              <View style={[styles.inputRow, { marginTop: 8 }, errors.course && styles.inputError]}>
                <GraduationCap size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Or type your course..."
                  value={customCourse}
                  onChangeText={v => {
                    setCustomCourse(v);
                    if (v) setCourse('');
                    if (errors.course) setErrors(p => ({ ...p, course: '' }));
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.course && <ErrorMsg msg={errors.course} />}
            </View>

            {/* Year */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Year of Study <Text style={styles.req}>*</Text></Text>
              <View style={styles.yearRow}>
                {YEAR_OPTIONS.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.yearChip, year === y && styles.chipActive]}
                    onPress={() => { setYear(y); if (errors.year) setErrors(p => ({ ...p, year: '' })); }}
                  >
                    <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.year && <ErrorMsg msg={errors.year} />}
            </View>

            {/* CGPA */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>CGPA <Text style={styles.req}>*</Text></Text>
              <View style={[styles.inputRow, errors.cgpa && styles.inputError]}>
                <GraduationCap size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 8.5 (out of 10)"
                  value={cgpa}
                  onChangeText={v => { setCgpa(v); if (errors.cgpa) setErrors(p => ({ ...p, cgpa: '' })); }}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.cgpa && <ErrorMsg msg={errors.cgpa} />}
            </View>

            {/* Address (optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Address <Text style={styles.optional}>(optional)</Text>
              </Text>
              <View style={styles.inputRow}>
                <MapPin size={18} color="#9CA3AF" />
                <TextInput
                  style={[styles.textInput, styles.multiline]}
                  placeholder="Your current city / address"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>🚀 Save & Go to Dashboard</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 48 },

  headerBlock: { alignItems: 'center', marginBottom: 20 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: isTablet ? 26 : 22, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

  infoBanner: {
    backgroundColor: '#EEF2FF', borderRadius: 10, padding: 12,
    marginBottom: 24, borderWidth: 1, borderColor: '#C7D2FE',
  },
  infoBannerText: { fontSize: 13, color: '#4338CA', textAlign: 'center' },
  emailHighlight: { fontWeight: '700' },

  form: { width: '100%' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  req: { color: '#EF4444' },
  optional: { color: '#9CA3AF', fontWeight: '400' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 1,
    borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  inputError: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  textInput: { flex: 1, fontSize: 15, color: '#1F2937' },
  multiline: { minHeight: 48, textAlignVertical: 'top' },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText: { fontSize: 12, color: '#EF4444' },

  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },

  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  yearChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },

  submitBtn: {
    backgroundColor: '#6366F1', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 10,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  submitBtnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
