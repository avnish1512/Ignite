import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import {
  Bell,
  Shield,
  Moon,
  Globe,
  Download,
  Trash2,
  HelpCircle,
  ChevronRight,
  User,
  Lock,
  Smartphone,
  CheckCircle,
  Mail,
  Briefcase,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useSettings } from '@/hooks/settings-store';
import { useTheme } from '@/hooks/theme-store';
import { supabase } from '@/config/supabase';
import * as LocalAuthentication from 'expo-local-authentication';

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1600),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);

  return (
    <Animated.View style={[toastStyles.container, { opacity }]} pointerEvents="none">
      <CheckCircle size={16} color="#FFFFFF" />
      <Text style={toastStyles.text}>{message}</Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const theme = useTheme();
  const { student, logout } = useAuth();
  const {
    pushNotifications,
    emailNotifications,
    jobAlerts,
    darkMode,
    language,
    biometricAuth,
    setPushNotifications,
    setEmailNotifications,
    setJobAlerts,
    setDarkMode,
    setLanguage,
    setBiometricAuth,
    loadSettings,
    clearCache,
  } = useSettings();

  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Check if biometrics are hardware-available on this device
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled   = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(compatible && enrolled);
      } catch {
        setBiometricAvailable(false);
      }
    })();
  }, []);

  // Load settings each time screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSettings(student?.id);
    }, [loadSettings, student?.id])
  );

  // Also load on mount
  useEffect(() => {
    loadSettings(student?.id);
  }, [loadSettings, student?.id]);

  // ─── Toast helper ─────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastKey(k => k + 1);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handlePushToggle = (v: boolean) => {
    setPushNotifications(v);
    showToast(v ? 'Push notifications enabled' : 'Push notifications disabled');
  };

  const handleEmailToggle = (v: boolean) => {
    setEmailNotifications(v);
    showToast(v ? 'Email notifications enabled' : 'Email notifications disabled');
  };

  const handleJobAlertsToggle = (v: boolean) => {
    setJobAlerts(v);
    showToast(v ? 'Job alerts enabled' : 'Job alerts disabled');
  };

  const handleDarkModeToggle = (v: boolean) => {
    setDarkMode(v);
    showToast(v ? 'Dark mode on' : 'Light mode on');
  };

  const handleBiometricToggle = async (v: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Biometric authentication is not available on web.');
      return;
    }

    if (v) {
      // Enabling — verify the user can actually authenticate first
      if (!biometricAvailable) {
        Alert.alert(
          'Biometric Unavailable',
          'No biometric data (fingerprint / Face ID) is enrolled on this device. Please set it up in your device settings first.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric login',
          fallbackLabel: 'Use Passcode',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (result.success) {
          setBiometricAuth(true);
          showToast('Biometric authentication enabled');
        } else {
          Alert.alert(
            'Authentication Failed',
            result.error === 'user_cancel'
              ? 'Cancelled. Biometric login not enabled.'
              : 'Could not verify biometrics. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to access biometrics. Please try again.');
      }
    } else {
      // Disabling — confirm with a simple alert
      Alert.alert(
        'Disable Biometric Login',
        'Are you sure you want to disable biometric authentication?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setBiometricAuth(false);
              showToast('Biometric authentication disabled');
            },
          },
        ]
      );
    }
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will clear all cached data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearCache();
          showToast('Cache cleared');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user account via Supabase admin API
              // Note: This requires the user to be logged in and uses admin functions
              const { error } = await supabase.auth.admin.deleteUser(
                (await supabase.auth.getUser()).data.user?.id || ''
              );
              
              if (error) throw error;
              
              await logout();
              router.replace('/unified-login' as any);
            } catch (error: any) {
              if (error?.message?.includes('not authenticated')) {
                Alert.alert(
                  'Re-authentication Required',
                  'Please log out and log back in before deleting your account.'
                );
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert('Language', 'Select your preferred language:', [
      { text: 'English', onPress: () => { setLanguage('en'); showToast('Language set to English'); } },
      { text: 'Hindi',   onPress: () => { setLanguage('hi'); showToast('भाषा हिंदी में बदली गई'); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy & Security',
      'Your data is secured with Supabase Authentication and stored in a secure PostgreSQL database.\n\n• Passwords are hashed and salted by Supabase Auth\n• Data is never shared with third parties\n• You can delete your account anytime\n• Messages are stored securely in Supabase\n• Row Level Security (RLS) policies protect your data',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'For assistance, contact:\n\n📧 support@ignite.edu.in\n📞 +91 98765 43210\n\nPlacement Cell\nIgnite\nPlacement Portal',
      [{ text: 'OK' }]
    );
  };

  if (!student) {
    const s = makeStyles(theme);
    return (
      <SafeAreaView style={[s.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Settings' }} />
        <View style={s.emptyState}>
          <Text style={[s.emptyTitle, { color: theme.text }]}>Please login to access settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Sections ─────────────────────────────────────────────────────────────

  const sections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile Settings',
          subtitle: 'Update your personal information',
          icon: User,
          type: 'nav' as const,
          onPress: () => router.push('/profile' as any),
        },
        {
          id: 'privacy',
          title: 'Privacy & Security',
          subtitle: 'Manage your privacy settings',
          icon: Shield,
          type: 'nav' as const,
          onPress: handlePrivacyPolicy,
        },
        {
          id: 'biometric',
          title: 'Biometric Authentication',
          subtitle: biometricAvailable
            ? (biometricAuth ? 'Enabled — tap to disable' : 'Use fingerprint or Face ID to login')
            : 'Not available on this device',
          icon: Lock,
          type: 'toggle' as const,
          value: biometricAuth,
          onToggle: handleBiometricToggle,
          disabled: !biometricAvailable && Platform.OS !== 'web',
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'push',
          title: 'Push Notifications',
          subtitle: pushNotifications ? 'On — you\'ll receive device alerts' : 'Off — no device alerts',
          icon: Smartphone,
          type: 'toggle' as const,
          value: pushNotifications,
          onToggle: handlePushToggle,
        },
        {
          id: 'email',
          title: 'Email Notifications',
          subtitle: emailNotifications ? 'On — updates sent to your email' : 'Off — no emails',
          icon: Mail,
          type: 'toggle' as const,
          value: emailNotifications,
          onToggle: handleEmailToggle,
        },
        {
          id: 'job-alerts',
          title: 'Job Alerts',
          subtitle: jobAlerts ? 'On — notified of new opportunities' : 'Off — no job alerts',
          icon: Briefcase,
          type: 'toggle' as const,
          value: jobAlerts,
          onToggle: handleJobAlertsToggle,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: darkMode ? 'Currently using dark theme' : 'Currently using light theme',
          icon: Moon,
          type: 'toggle' as const,
          value: darkMode,
          onToggle: handleDarkModeToggle,
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: language === 'hi' ? 'Hindi / हिंदी' : 'English',
          icon: Globe,
          type: 'nav' as const,
          onPress: handleLanguageChange,
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          id: 'download-data',
          title: 'Download My Data',
          subtitle: 'Export your account data',
          icon: Download,
          type: 'action' as const,
          onPress: () =>
            Alert.alert(
              'Download My Data',
              `Your data export will be sent to:\n${student?.email || 'your registered email'}\n\nThis feature will be available soon.`,
              [{ text: 'OK' }]
            ),
        },
        {
          id: 'clear-cache',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          icon: Trash2,
          type: 'action' as const,
          onPress: handleClearCache,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Contact placement cell support',
          icon: HelpCircle,
          type: 'nav' as const,
          onPress: handleHelp,
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          id: 'delete-account',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account and data',
          icon: Trash2,
          type: 'action' as const,
          onPress: handleDeleteAccount,
          destructive: true,
        },
      ],
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle:      { backgroundColor: theme.surface },
          headerTintColor:  theme.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Settings</Text>
          <Text style={s.subtitle}>Manage your account and app preferences</Text>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.sectionCard}>
              {section.items.map((item, idx) => {
                const IconComp = item.icon;
                const isLast   = idx === section.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.row, !isLast && s.rowBorder]}
                    onPress={item.type !== 'toggle' ? item.onPress : undefined}
                    disabled={item.type === 'toggle'}
                    activeOpacity={0.7}
                  >
                    <View style={[s.iconWrap, (item as any).destructive && s.iconWrapDanger]}>
                      <IconComp
                        size={19}
                        color={(item as any).destructive ? theme.danger : theme.primary}
                      />
                    </View>

                    <View style={s.rowText}>
                      <Text style={[s.rowTitle, (item as any).destructive && { color: theme.danger }]}>
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text style={s.rowSubtitle}>{item.subtitle}</Text>
                      ) : null}
                    </View>

                    <View style={s.rowRight}>
                      {item.type === 'toggle' && (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          disabled={(item as any).disabled}
                          trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                          thumbColor="#FFFFFF"
                          ios_backgroundColor={theme.switchTrackOff}
                        />
                      )}
                      {item.type === 'nav' && (
                        <ChevronRight size={16} color={theme.textMuted} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Version */}
        <View style={s.version}>
          <Text style={s.versionText}>Ignite Placement Portal v1.0.0</Text>
          <Text style={s.buildText}>Build 2024.1.0</Text>
        </View>
      </ScrollView>

      {/* Toast */}
      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
    </SafeAreaView>
  );
}

// ─── Dynamic styles ───────────────────────────────────────────────────────────

function makeStyles(theme: ReturnType<typeof import('@/hooks/theme-store').useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
      color: theme.text,
    },
    header: {
      padding: 20,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    section: {
      marginTop: 28,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0 : 0.06,
      shadowRadius: 8,
      elevation: theme.isDark ? 0 : 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    iconWrapDanger: {
      backgroundColor: theme.dangerLight,
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 2,
    },
    rowSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    rowRight: {
      marginLeft: 12,
    },
    version: {
      alignItems: 'center',
      paddingVertical: 32,
      marginTop: 12,
    },
    versionText: {
      fontSize: 13,
      color: theme.textMuted,
      marginBottom: 4,
    },
    buildText: {
      fontSize: 11,
      color: theme.border,
    },
  });
}