import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Eye, EyeOff, User, Mail, Lock, GraduationCap, ArrowLeft, Phone, Hash } from 'lucide-react-native';
import { supabase } from '@/config/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [prn, setPrn] = useState('');

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
    if (!course) { Alert.alert('Error', 'Please enter your course name'); return; }
    if (!year) { Alert.alert('Error', 'Please enter your year of study'); return; }
    if (!phone.trim()) { Alert.alert('Error', 'Please enter your phone number'); return; }
    if (!prn.trim()) { Alert.alert('Error', 'PRN Number is required for placement records'); return; }

    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: { data: { name: name.trim() } }
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('Failed to create user');

      const { error: insertError } = await supabase
        .from('students')
        .insert([{
          id: data.user.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          course: course.trim(),
          year: year.trim(),
          cgpa: cgpa ? parseFloat(cgpa) : 0,
          prn_number: prn.trim(),
          profile_completed: true,
          is_active: true,
          created_at: new Date().toISOString(),
        }]);

      if (insertError) throw insertError;

      Alert.alert(
        '🎉 Success!',
        `Welcome ${name.trim()}! Your account has been created successfully.`,
        [{ text: 'Go to Dashboard', onPress: () => router.replace('/(tab)') }]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity 
            onPress={() => step === 1 ? router.back() : setStep(1)} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.logoBadge}>
            <View style={styles.logoIcon}>
              <GraduationCap size={40} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.headerBlock}>
            <Text style={styles.title}>
              {step === 1 ? 'Join the Portal' : 'One Last Step'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? 'Create your student account to get started' 
                : 'Complete your professional profile'}
            </Text>
          </View>

          {step === 1 ? (
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <User size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="University Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Hash size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="PRN / Roll Number"
                  value={prn}
                  onChangeText={setPrn}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Phone size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputWrapper}>
                <GraduationCap size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Course (e.g. B.Tech CS)"
                  value={course}
                  onChangeText={setCourse}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Year (e.g. 3rd)"
                    value={year}
                    onChangeText={setYear}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="CGPA"
                    value={cgpa}
                    onChangeText={setCgpa}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, isLoading && styles.disabled]} 
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={styles.footerLink} 
            onPress={() => router.replace('/unified-login')}
          >
            <Text style={styles.footerText}>
              Already part of the drive? <Text style={styles.linkText}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 20, left: 24, zIndex: 10, padding: 8 },
  
  logoBadge: { alignItems: 'center', marginBottom: 24 },
  logoIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  
  headerBlock: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  form: { width: '100%', gap: 16 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F9FAFB', borderWidt: 1, borderColor: '#E5E7EB',
    borderRadius: 16, paddingHorizontal: 16, height: 58,
  },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  row: { flexDirection: 'row', width: '100%' },

  primaryButton: {
    backgroundColor: '#6366F1', borderRadius: 16, height: 58,
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  disabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },

  footerLink: { marginTop: 32, alignItems: 'center' },
  footerText: { fontSize: 15, color: '#6B7280' },
  linkText: { color: '#6366F1', fontWeight: '700' },
});
