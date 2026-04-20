import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { supabase } from '@/config/supabase';

export interface SettingsState {
  // Notification preferences
  pushNotifications: boolean;
  emailNotifications: boolean;
  jobAlerts: boolean;

  // Display preferences
  darkMode: boolean;
  language: string;

  // Security preferences
  biometricAuth: boolean;

  // App preferences
  appVersion: string;

  // Internal: the logged-in userId so setters can auto-save with it
  _userId: string | undefined;

  // Setters — all immediately persist
  setPushNotifications:   (value: boolean) => void;
  setEmailNotifications:  (value: boolean) => void;
  setJobAlerts:           (value: boolean) => void;
  setDarkMode:            (value: boolean) => void;
  setLanguage:            (value: string)  => void;
  setBiometricAuth:       (value: boolean) => void;

  // Persistence
  loadSettings:  (userId?: string) => Promise<void>;
  saveSettings:  (userId?: string) => Promise<void>;
  clearCache:    () => Promise<void>;
}

// Internal helper to build a saveable snapshot from state
function buildSnapshot(state: SettingsState) {
  return {
    pushNotifications:  state.pushNotifications,
    emailNotifications: state.emailNotifications,
    jobAlerts:          state.jobAlerts,
    darkMode:           state.darkMode,
    language:           state.language,
    biometricAuth:      state.biometricAuth,
    appVersion:         state.appVersion,
    updatedAt:          new Date().toISOString(),
  };
}

export const useSettings = create<SettingsState>((set, get) => ({
  // Defaults
  pushNotifications:  true,
  emailNotifications: true,
  jobAlerts:          true,
  darkMode:           false,
  language:           'en',
  biometricAuth:      false,
  appVersion:         '1.0.0',
  _userId:            undefined,

  // ─── Setters ────────────────────────────────────────────────────────────────

  setPushNotifications: (value) => {
    set({ pushNotifications: value });
    get().saveSettings(get()._userId);
  },

  setEmailNotifications: (value) => {
    set({ emailNotifications: value });
    get().saveSettings(get()._userId);
  },

  setJobAlerts: (value) => {
    set({ jobAlerts: value });
    get().saveSettings(get()._userId);
  },

  setDarkMode: (value) => {
    set({ darkMode: value });
    get().saveSettings(get()._userId);
  },

  setLanguage: (value) => {
    set({ language: value });
    get().saveSettings(get()._userId);
  },

  setBiometricAuth: (value) => {
    set({ biometricAuth: value });
    get().saveSettings(get()._userId);
  },

  // ─── Persistence ────────────────────────────────────────────────────────────

  loadSettings: async (userId?: string) => {
    // Remember userId for future auto-saves
    set({ _userId: userId });

    try {
      // 1️⃣ Try Supabase first
      if (userId) {
        try {
          const { data: settingsData, error } = await supabase
            .from('settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (settingsData && !error) {
            const d = settingsData;
            set({
              pushNotifications:  d.push_notifications  ?? true,
              emailNotifications: d.email_notifications ?? true,
              jobAlerts:          d.job_alerts          ?? true,
              darkMode:           d.dark_mode           ?? false,
              language:           d.language            ?? 'en',
              biometricAuth:      d.biometric_auth      ?? false,
              appVersion:         d.app_version         ?? '1.0.0',
            });
            console.log('✅ Settings loaded from Supabase');
            // Sync to local cache
            await AsyncStorage.setItem('app_settings', JSON.stringify(d)).catch(() => {});
            return;
          }
        } catch (err) {
          console.log('ℹ️ Supabase settings unavailable, falling back to local storage');
        }
      }

      // 2️⃣ Fallback to AsyncStorage
      const saved = await AsyncStorage.getItem('app_settings');
      if (saved) {
        const p = JSON.parse(saved);
        set({
          pushNotifications:  p.pushNotifications  ?? true,
          emailNotifications: p.emailNotifications ?? true,
          jobAlerts:          p.jobAlerts          ?? true,
          darkMode:           p.darkMode           ?? false,
          language:           p.language           ?? 'en',
          biometricAuth:      p.biometricAuth      ?? false,
          appVersion:         p.appVersion         ?? '1.0.0',
        });
        console.log('✅ Settings loaded from AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  saveSettings: async (userId?: string) => {
    const effectiveUserId = userId ?? get()._userId;
    try {
      const state = get();
      const snapshot = {
        user_id: effectiveUserId,
        push_notifications:  state.pushNotifications,
        email_notifications: state.emailNotifications,
        job_alerts:          state.jobAlerts,
        dark_mode:           state.darkMode,
        language:           state.language,
        biometric_auth:      state.biometricAuth,
        app_version:         state.appVersion,
      };

      // Always save to AsyncStorage immediately
      await AsyncStorage.setItem('app_settings', JSON.stringify(state));

      // Save to Supabase if we have a userId
      if (effectiveUserId) {
        try {
          const { error } = await supabase
            .from('settings')
            .upsert(snapshot);

          if (error) throw error;
          console.log('✅ Settings saved to Supabase');
        } catch (err) {
          console.log('ℹ️ Could not save to Supabase — saved locally only');
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  clearCache: async () => {
    try {
      await AsyncStorage.multiRemove(['job_cache', 'student_cache']);
      console.log('✅ Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },
}));
