import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const fallbackSupabaseUrl = "https://gxqcacrtntnfnakitdaf.supabase.co";
const fallbackSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWNhY3J0bnRuZm5ha2l0ZGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTE2MTksImV4cCI6MjEwMzg2NzYxOX0.gbpaPYNbldBKeLUwgJmauyPNGMmVRHTAAMBXPjD7bSw";

export const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;

export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "implicit",
  },
});
