import { createClient } from '@supabase/supabase-js';
import { SupabaseConfig } from './env';

// Initialize Supabase client with dynamic configuration
export function createSupabaseClient(config: SupabaseConfig) {
  return createClient(config.url, config.anonKey);
}
