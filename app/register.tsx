import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Eye, EyeOff, User, Mail, Lock, GraduationCap, ArrowLeft } from 'lucide-react-native';
import { auth, db } from '@/config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const COURSE_OPTIONS = [
  'B.Tech Computer Science',
  'B.Tech Information Technology',
  'B.Tech Electronics',
  'B.Tech Mechanical',
  'B.Tech Civil',
  'B.Tech Electrical',
  'MBA',
  'MCA',
  'M.Tech',
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function RegisterScreen() {
  const [step, setStep] = useState(1); // Step 1: account info, Step 2: profile info
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  // Step 2 fields
  const [Name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');

  const validateStep1 = () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter your full name'); return false; }
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Alert.alert('Error', 'Please enter a valid email address'); return false; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return false; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return false; }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleRegister = async () => {
    if (!course) { Alert.alert('Error', 'Please select your course'); return; }
    if (!year) { Alert.alert('Error', 'Please select your year'); return; }
    if (!phone.trim()) { Alert.alert('Error', 'Please enter your phone number'); return; }

    setIsLoading(true);
    try {
      // Create Firebase Auth account
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

      // Set display name
      await updateProfile(credential.user, { displayName: name.trim() });

      // Create student document in Firestore
      const studentData = {
        id: credential.user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        course,
        year,
        cgpa: cgpa ? parseFloat(cgpa) : 0,
        enrollmentNo: enrollmentNo.trim(),
        skills: [],
        resume: '',
        address: '',
        profileCompleted: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'students', credential.user.uid), studentData);

      Alert.alert(
        '🎉 Account Created!',
        `Welcome to SGU Placement Portal, ${name.trim()}!\n\nYour account has been created successfully.`,
        [
          {
            text: 'Go to Dashboard',
            onPress: () => router.replace('/(tab)' as any),
          }
        ]
      );
    } catch (error: any) {
      let message = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      }
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const CourseButton = ({ label }: { label: string }) => (
    <TouchableOpacity
      style={[styles.optionButton, course === label && styles.optionButtonActive]}
      onPress={() => setCourse(label)}
    >
      <Text style={[styles.optionButtonText, course === label && styles.optionButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const YearButton = ({ label }: { label: string }) => (
    <TouchableOpacity
      style={[styles.yearButton, year === label && styles.optionButtonActive]}
      onPress={() => setYear(label)}
    >
      <Text style={[styles.optionButtonText, year === label && styles.optionButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} style={styles.backBtn}>
              <ArrowLeft size={22} color="#374151" />
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            </View>
          </View>

          <View style={styles.headingBlock}>
            <GraduationCap size={36} color="#6366F1" />
            <Text style={styles.title}>
              {step === 1 ? 'Create Account' : 'Complete Profile'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Register for SGU Placement Portal'
                : 'Tell us about yourself'}
            </Text>
          </View>

          {step === 1 ? (
            /* ── STEP 1: Account info ── */
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <User size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="#9CA3AF"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password (min. 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholderTextColor="#9CA3AF"
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  {showConfirm ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleNext}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── STEP 2: Profile info ── */
            <View style={styles.form}>
              <TextInput
                style={styles.standaloneInput}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />

              <TextInput
                style={styles.standaloneInput}
                placeholder="Enrollment Number (optional)"
                value={enrollmentNo}
                onChangeText={setEnrollmentNo}
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />

              <Text style={styles.sectionLabel}>Select Course *</Text>
              <View style={styles.optionsGrid}>
                {COURSE_OPTIONS.map(c => <CourseButton key={c} label={c} />)}
              </View>

              <Text style={styles.sectionLabel}>Year of Study *</Text>
              <View style={styles.yearRow}>
                {YEAR_OPTIONS.map(y => <YearButton key={y} label={y} />)}
              </View>

              <TextInput
                style={styles.standaloneInput}
                placeholder="CGPA (e.g. 8.5)"
                value={cgpa}
                onChangeText={setCgpa}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Creating Account...' : '🎓 Create Account'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/unified-login' as any)}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { padding: 8 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: { backgroundColor: '#6366F1' },
  stepLine: { width: 32, height: 2, backgroundColor: '#E5E7EB' },

  headingBlock: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  form: { width: '100%' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    height: '100%',
  },
  passwordInput: { paddingRight: 36 },
  eyeBtn: { padding: 4 },

  standaloneInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 14,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    marginTop: 4,
  },

  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  optionButtonText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  optionButtonTextActive: { color: '#FFFFFF' },

  yearRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  yearButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },

  primaryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0, elevation: 0 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  loginLink: { alignItems: 'center', paddingVertical: 16 },
  loginLinkText: { fontSize: 14, color: '#6B7280' },
  loginLinkHighlight: { color: '#6366F1', fontWeight: '600' },
});
