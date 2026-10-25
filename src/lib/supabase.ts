import { createClient, SupabaseClient } from '@supabase/supabase-js';

const sanitize = (val?: string): string => {
  if (!val) return '';
  return val
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .trim();
};

// Fallback to configured BOOK-TIIS Supabase project credentials if env vars are unset
const DEFAULT_SUPABASE_URL = 'https://pkrevkitxefvyozcvgrz.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable__oLIQOxgWXNzyZyMwg-UQw_eezmtKyS';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl = sanitize(rawUrl) || DEFAULT_SUPABASE_URL;
export const supabaseKey = sanitize(rawKey) || DEFAULT_SUPABASE_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes('your-project-id') &&
    Boolean(supabaseKey) &&
    !supabaseKey.includes('your-anon-or-publishable-key')
  );
};

// Resilient fetch handler: Tries direct request first.
// If the browser encounters "Failed to fetch" (e.g. adblocker, CSP, DNS, or network firewall),
// it automatically retries via the local app proxy (/api/supabase) without failing user actions.
const resilientFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isNetworkOrFetchError =
      (err as any)?.name === 'TypeError' ||
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      errorMsg.includes('Load failed');

    if (isNetworkOrFetchError && typeof window !== 'undefined') {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.href
          : (input as Request).url;

      if (urlStr && urlStr.includes('pkrevkitxefvyozcvgrz.supabase.co')) {
        const proxiedUrl = urlStr.replace(
          'https://pkrevkitxefvyozcvgrz.supabase.co',
          '/api/supabase'
        );
        try {
          return await fetch(proxiedUrl, init);
        } catch {
          // If proxy also fails, throw original error
          throw err;
        }
      }
    }
    throw err;
  }
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: resilientFetch,
  },
});

// Diagnostic check in browser runtime
if (typeof window !== 'undefined') {
  console.info('[BOOK-TIIS] Supabase Initialized:', {
    url: supabaseUrl,
    configured: isSupabaseConfigured(),
  });
}

