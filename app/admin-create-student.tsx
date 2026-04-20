import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, UserPlus, CheckCircle, ShieldCheck } from 'lucide-react-native';
import { supabase, silentAuth } from '@/config/supabase';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const InputField = ({ label, value, onChangeText, placeholder, icon: Icon, secureTextEntry, rightIcon, onRightIconPress, editable = true }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      {Icon && <Icon size={18} color="#9CA3AF" />}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        editable={editable}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function AdminCreateStudent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      Alert.alert('Error', 'Please fill all fields and use at least 6 characters for password.');
      return;
    }
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      let authResult = await supabase.auth.admin.createUser({
        email: trimmedEmail,
        password: password,
        user_metadata: { name: trimmedName },
        email_confirm: true
      });

      if (authResult.error?.status === 403) {
        authResult = await silentAuth.signUp(trimmedEmail, password, trimmedName);
      }

      if (authResult.error) throw authResult.error;
      const newUid = authResult.data?.user?.id;

      const { error: insertError } = await supabase
        .from('students')
        .insert([{
          id: newUid,
          name: trimmedName,
          email: trimmedEmail,
          profile_completed: false,
          is_active: true,
          created_at: new Date().toISOString(),
        }]);

      if (insertError) throw insertError;
      setCreated({ name: trimmedName, email: trimmedEmail, password });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  if (created) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <CheckCircle size={48} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Account Ready!</Text>
          <Text style={styles.successSubtitle}>Give these credentials to the student for their first login.</Text>
          
          <View style={styles.credCard}>
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>STUDENT NAME</Text>
              <Text style={styles.credValue}>{created.name}</Text>
            </View>
            <View style={styles.credDivider} />
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>EMAIL / ID</Text>
              <Text style={styles.credValue}>{created.email}</Text>
            </View>
            <View style={styles.credDivider} />
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>PASSWORD</Text>
              <Text style={styles.credValue}>{created.password}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => setCreated(null)}>
            <Text style={styles.primaryButtonText}>Add Another student</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Add Student',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <UserPlus size={24} color="#6366F1" />
            </View>
            <Text style={styles.headerTitle}>Student Onboarding</Text>
            <Text style={styles.headerSubtitle}>Create login credentials for a new student</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ShieldCheck size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Account Credentials</Text>
            </View>
            
            <InputField
              label="Full Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Sharma"
              icon={User}
              editable={!isLoading}
            />
            
            <InputField
              label="Email Address *"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. rahul@college.com"
              icon={Mail}
              editable={!isLoading}
            />
            
            <InputField
              label="Password *"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              icon={Lock}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
              onRightIconPress={() => setShowPassword(!showPassword)}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  backButton: { padding: 8, marginLeft: -8 },
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
    flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 8,
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
  rightIcon: { padding: 4 },
  primaryButton: {
    backgroundColor: '#6366F1', paddingVertical: 16, borderRadius: 10, alignItems: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  primaryButtonDisabled: { backgroundColor: '#9CA3AF' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  
  // Success Screen
  successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  credCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24,
  },
  credRow: { paddingVertical: 4 },
  credLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 4 },
  credValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  credDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  secondaryButton: { marginTop: 16, padding: 8 },
  secondaryButtonText: { color: '#6366F1', fontWeight: '600' },
});
