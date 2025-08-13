export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// This will be set dynamically from the request
export let SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://ufiqqextlfrtdbwgylco.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaXFxZXh0bGZydGRid2d5bGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTgyODMsImV4cCI6MjA2Nzc5NDI4M30.a60pyfQk-0vhaRZa6_hkT7WZvn_JC3WPM5k-Ip08SHg'
};

export function setSupabaseConfig(config: SupabaseConfig) {
  SUPABASE_CONFIG = config;
}
