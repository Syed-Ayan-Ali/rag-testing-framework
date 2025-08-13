export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// This will be set dynamically from the request
export let SUPABASE_CONFIG: SupabaseConfig = {
  url: '',
  anonKey: ''
};

export function setSupabaseConfig(config: SupabaseConfig) {
  SUPABASE_CONFIG = config;
}
