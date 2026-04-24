import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, StatusBar, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Eye, EyeOff, Flame } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useTheme } from '@/hooks/theme-store';
import { supabase } from '@/config/supabase';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

export default function UnifiedLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const theme = useTheme();

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Detect admin by email
    const isAdminEmail = trimmedEmail.includes('admin');
    const role: 'student' | 'admin' = isAdminEmail ? 'admin' : 'student';
    const result = await login(trimmedEmail, password, role);

    if (result.success) {
      if (role === 'admin') {
        router.replace('/admin-dashboard' as any);
      } else {
        // For students: check Supabase for profileCompleted flag
        try {
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select('profile_completed')
              .eq('id', user.id)
              .maybeSingle();

            if (studentError) {
              console.error('Error fetching student data:', studentError);
              router.replace('/profile-setup' as any);
              return;
            }

            if (studentData?.profile_completed === true) {
              router.replace('/(tab)');
            } else {
              router.replace('/profile-setup' as any);
            }
          } else {
            router.replace('/(tab)');
          }
        } catch (err) {
          console.error('Error checking profile status:', err);
          router.replace('/profile-setup' as any);
        }
      }
    } else {
      let errorMsg = result.error || 'Invalid credentials.';
      if (errorMsg.includes('rate limit')) {
        errorMsg = 'EMAIL RATE LIMIT EXCEEDED:\n\nPlease disable "Confirm email" in your Supabase Dashboard -> Auth -> Providers -> Email to continue testing.';
      } else if (errorMsg.includes('verify')) {
        errorMsg = 'Please verify your email or disable "Confirm email" in Supabase Auth settings.';
      }
      Alert.alert('Login Failed', errorMsg);
    }
  };

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={s.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={s.logoContainer}>
              <View style={s.logoIconBox}>
                <Flame size={34} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text style={s.logoText}>Ignite</Text>
            </View>

            <View style={s.headerContainer}>
              <Text style={s.title}>Welcome to Ignite</Text>
              <Text style={s.subtitle}>Placement Portal</Text>
            </View>

            <View style={s.form}>
              <TextInput
                style={s.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.textMuted}
                editable={!isLoading}
              />

              <View style={s.passwordContainer}>
                <TextInput
                  style={[s.input, s.passwordInput]}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={theme.textMuted}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={s.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.textMuted} />
                  ) : (
                    <Eye size={20} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[
                  s.signInButton, 
                  isLoading && s.signInButtonDisabled
                ]} 
                onPress={handleSignIn}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={s.signInButtonText}>Signing In...</Text>
                  </View>
                ) : (
                  <Text style={s.signInButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={s.footer}>
              <Text style={s.footerText}>Ignite Placement Portal v1.0.0</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoIconBox: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    logoText: {
      fontSize: isTablet ? 26 : 22,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 1,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: isTablet ? 28 : 28,
      fontWeight: '700',
      color: theme.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: isTablet ? 16 : 14,
      color: theme.textMuted,
      textAlign: 'center',
      fontWeight: '500',
    },
    form: {
      width: '100%',
      marginBottom: 32,
    },
    input: {
      width: '100%',
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      borderRadius: 12,
      paddingVertical: isTablet ? 18 : 16,
      paddingHorizontal: 16,
      fontSize: isTablet ? 16 : 15,
      color: theme.text,
      fontWeight: '500',
      marginBottom: 16,
    },
    passwordContainer: {
      position: 'relative',
      width: '100%',
      marginBottom: 16,
    },
    passwordInput: {
      paddingRight: 48,
      marginBottom: 0,
    },
    eyeIcon: {
      position: 'absolute',
      right: 14,
      top: '50%',
      transform: [{ translateY: -10 }],
    },
    signInButton: {
      backgroundColor: '#E2231A',
      width: '100%',
      paddingVertical: isTablet ? 18 : 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#E2231A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },
    signInButtonDisabled: {
      backgroundColor: theme.textMuted,
      shadowOpacity: 0,
      elevation: 0,
    },
    signInButtonText: {
      color: '#FFFFFF',
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    footer: {
      alignItems: 'center',
      paddingTop: 16,
    },
    footerText: {
      fontSize: 12,
      color: theme.textMuted,
    },
  });
}
