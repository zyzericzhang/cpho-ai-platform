import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during build/prerender if env vars are missing
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
