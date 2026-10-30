import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = Constants.manifest?.extra || {};

export const createSupabaseClient = (
  supabaseUrl: string = NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: string = NEXT_PUBLIC_SUPABASE_ANON_KEY!
): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required.');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();
