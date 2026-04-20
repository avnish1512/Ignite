import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure to set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Helper functions for authentication
export const auth = {
  async signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  },

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback: (user: any | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(session?.user || null);
      }
    );
    return subscription?.unsubscribe;
  }
};

// Create a special client for "Admin-side Student Creation" 
// that doesn't persist session (prevents logging out the admin)
const silentSupabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export const silentAuth = {
  async signUp(email: string, password: string, name: string) {
    return silentSupabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
  }
};

// Database helper
export const db = {
  from: (table: string) => supabase.from(table),
  
  async insertOne(table: string, data: any) {
    return supabase.from(table).insert([data]).select().single();
  },

  async selectAll(table: string) {
    return supabase.from(table).select();
  },

  async selectById(table: string, id: string) {
    return supabase.from(table).select().eq('id', id).single();
  },

  async update(table: string, id: string, data: any) {
    return supabase.from(table).update(data).eq('id', id);
  },

  async delete(table: string, id: string) {
    return supabase.from(table).delete().eq('id', id);
  }
};

// Storage helper
export const storage = {
  from: (bucket: string) => supabase.storage.from(bucket),

  async uploadFile(bucket: string, path: string, file: Blob) {
    return supabase.storage.from(bucket).upload(path, file, { upsert: true });
  },

  async deleteFile(bucket: string, path: string) {
    return supabase.storage.from(bucket).remove([path]);
  },

  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || '';
  }
};
