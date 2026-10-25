import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Profile } from '../types';
import { storeService } from './storeService';

export interface AuthResponse {
  success: boolean;
  profile?: Profile;
  error?: string;
  rawError?: string;
  errorCode?: string;
  canResendConfirmation?: boolean;
  unconfirmedEmail?: string;
  needsEmailConfirmation?: boolean;
  message?: string;
}

// Helper to provide friendly Somali messages alongside exact Supabase diagnostics
const formatSupabaseAuthError = (err: any): { displayMessage: string; rawError: string; code?: string; isEmailNotConfirmed?: boolean } => {
  const rawMsg = err?.message || 'Unknown authentication error';
  const code = err?.code || '';
  const status = err?.status;
  const rawError = `${rawMsg}${status ? ` (Status ${status})` : ''}${code ? ` [${code}]` : ''}`;

  let displayMessage = rawMsg;
  let isEmailNotConfirmed = false;

  const lower = rawMsg.toLowerCase();
  if (lower.includes('invalid login credentials') || code === 'invalid_credentials') {
    displayMessage = 'Macluumaadka galitaanka ma saxna (Invalid login credentials). Fadlan hubi in email-ka iyo furaha sirta ah ay sax yihiin. Hubi in Caps Lock uusan daarnayn ama meel bannaan (space) aysan ku jirin.';
  } else if (lower.includes('email not confirmed') || code === 'email_not_confirmed') {
    displayMessage = 'Email-kaaga lama xaqiijin (Email not confirmed). Fadlan ka eeg link-ga xaqiijinta sanduuqaaga (Inbox ama Spam) si aad u hawlgeliso koontadaada.';
    isEmailNotConfirmed = true;
  } else if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit') || status === 429) {
    displayMessage = 'Xadka dirista ayaa la gaaray (Rate limit exceeded). Fadlan sug dhowr daqiiqo ka hor inta aadan mar kale isku dayin.';
  } else if (lower.includes('user already registered') || lower.includes('already registered')) {
    displayMessage = 'Email-kan horey ayaa loogu diiwaangeliyay nidaamka. Fadlan toos u gal koontadaada.';
  } else if (lower.includes('password') && lower.includes('least')) {
    displayMessage = 'Furaha sirta ah waa inuu ka koobnaadaa ugu yaraan 6 xaraf.';
  } else if (lower.includes('user not found')) {
    displayMessage = 'Koonto laguma helin email-kan (User not found). Fadlan hubi email-ka ama sameyso koonto cusub.';
  } else if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    displayMessage = 'Cillad xidhiidhka shabakadda ah (Network / Failed to fetch). Fadlan hubi khadkaaga internet-ka ama dib u culee bogga.';
  }

  return { displayMessage, rawError, code, isEmailNotConfirmed };
};

// Helper to determine the correct redirect URL for deployed environments
export const getAppRedirectUrl = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/+$/, '');
    return `${origin}/`;
  }
  return 'https://ais-pre-ehye5lfbabg2a2lb4fhkqy-9523006165.europe-west2.run.app/';
};

class AuthService {
  // Get current active profile
  public async getCurrentProfile(): Promise<Profile | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const userEmail = (user.email || '').toLowerCase().trim();

        // Fetch protected profile record from Supabase profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // Check role directly stored in Supabase profiles table
        const isDbAdmin = profile?.role === 'admin';
        const isLegacyAdmin =
          userEmail === 'booktiis09@gmail.com' ||
          userEmail === 'xusenaadan11@gmail.com';
        const isAdmin = isDbAdmin || isLegacyAdmin;

        const resolvedRole: 'admin' | 'customer' = isAdmin ? 'admin' : (profile?.role === 'admin' ? 'admin' : 'customer');

        // If admin but database row role is not admin yet, sync it
        if (isAdmin && profile && profile.role !== 'admin') {
          try {
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
          } catch {
            // Ignore
          }
        }

        if (error || !profile) {
          // If profile row doesn't exist yet, insert default customer profile (or admin for legacy admin)
          const fallbackProfile: Profile = {
            id: user.id,
            email: user.email,
            full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || (isAdmin ? 'Maamule' : 'Macaamil'),
            role: resolvedRole
          };

          try {
            await supabase.from('profiles').insert([
              {
                id: fallbackProfile.id,
                full_name: fallbackProfile.full_name,
                role: resolvedRole === 'admin' ? 'admin' : 'customer'
              }
            ]);
          } catch {
            // Ignore insert error if RLS or already present
          }

          return fallbackProfile;
        }

        return {
          id: profile.id,
          email: user.email,
          full_name: profile.full_name || (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Macaamil',
          role: resolvedRole,
          created_at: profile.created_at
        };
      } catch (err) {
        console.error('Error fetching Supabase profile:', err);
        return null;
      }
    }

    // Fallback store
    return storeService.getCurrentProfile();
  }

  // Sign up
  public async signUp(fullName: string, email: string, password: string): Promise<AuthResponse> {
    const cleanName = fullName?.trim() || '';
    const cleanEmail = email?.trim().toLowerCase() || '';

    if (!cleanName || cleanName.length < 3) {
      return { success: false, error: 'Fadlan geli magacaaga oo dhameystiran (ugu yaraan 3 xaraf).' };
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Fadlan geli email sax ah.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Furaha sirta ah waa inuu ka koobnaadaa ugu yaraan 6 xaraf.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const redirectUrl = getAppRedirectUrl();

        // Sign up with Supabase Authentication. Do NOT pass role in metadata (role escalation prevention).
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: cleanName
            }
          }
        });

        if (error) {
          const formatted = formatSupabaseAuthError(error);
          return {
            success: false,
            error: formatted.displayMessage,
            rawError: formatted.rawError,
            errorCode: formatted.code
          };
        }

        if (data.user) {
          // If Supabase has email confirmation enabled, data.session is null until verified
          const isConfirmed = Boolean(data.session) || Boolean(data.user.confirmed_at);

          // Default role for new accounts is strictly 'customer'
          const newProfile: Profile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: cleanName,
            role: 'customer'
          };

          // Guarantee customer profile row in public.profiles table
          try {
            await supabase.from('profiles').insert([
              {
                id: data.user.id,
                full_name: cleanName,
                role: 'customer'
              }
            ]);
          } catch {
            // Handled by database trigger or existing profile
          }

          if (isConfirmed && data.session) {
            storeService.setCurrentProfile(newProfile);
          }

          return {
            success: true,
            profile: newProfile,
            needsEmailConfirmation: !isConfirmed,
            message: !isConfirmed
              ? `Koontadaadu si guul leh ayaa loo abuuray! Waxaa email-kaaga (${cleanEmail}) loo soo diray link-ga xaqiijinta. Fadlan xaqiiji ka hor inta aadan galin.`
              : 'Koontadaada si guul leh ayaa loo diiwaangeliyay!'
          };
        }
      } catch (err: unknown) {
        const formatted = formatSupabaseAuthError(err);
        return {
          success: false,
          error: formatted.displayMessage,
          rawError: formatted.rawError
        };
      }
    }

    // Local mode registration
    const existing = storeService.getProfiles().find(p => p.email?.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'Email-kan horey ayaa loogu diiwaangeliyay. Fadlan gal koontadaada.' };
    }

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      full_name: cleanName,
      email: cleanEmail,
      role: 'customer',
      created_at: new Date().toISOString()
    };

    storeService.addProfile(newProfile);
    storeService.setCurrentProfile(newProfile);
    return { success: true, profile: newProfile };
  }

  // Sign in
  public async signIn(email: string, password: string): Promise<AuthResponse> {
    const rawEmail = email || '';
    const cleanEmail = rawEmail.trim();
    const lowerEmail = cleanEmail.toLowerCase();
    const cleanPassword = password || '';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Fadlan geli email sax ah.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Fadlan geli furahaaga sirta ah.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        // Step 1: Attempt sign in with standard lower-cased email and entered password
        let { data, error } = await supabase.auth.signInWithPassword({
          email: lowerEmail,
          password: cleanPassword
        });

        // Step 2: If failed with invalid login credentials, check for whitespace or case sensitivity variations
        if (error && (error.message.includes('Invalid login credentials') || error.code === 'invalid_credentials')) {
          // If password contains leading or trailing spaces, try trimmed password
          if (cleanPassword !== cleanPassword.trim()) {
            const retryTrimmed = await supabase.auth.signInWithPassword({
              email: lowerEmail,
              password: cleanPassword.trim()
            });
            if (!retryTrimmed.error && retryTrimmed.data.user) {
              data = retryTrimmed.data;
              error = null;
            }
          }

          // If still failing and cleanEmail is different casing than lowerEmail, try exact email
          if (error && cleanEmail !== lowerEmail) {
            const retryCase = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword
            });
            if (!retryCase.error && retryCase.data.user) {
              data = retryCase.data;
              error = null;
            } else if (cleanPassword !== cleanPassword.trim()) {
              const retryBoth = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword.trim()
              });
              if (!retryBoth.error && retryBoth.data.user) {
                data = retryBoth.data;
                error = null;
              }
            }
          }
        }

        if (error) {
          const formatted = formatSupabaseAuthError(error);
          return {
            success: false,
            error: formatted.displayMessage,
            rawError: formatted.rawError,
            errorCode: formatted.code,
            canResendConfirmation: formatted.isEmailNotConfirmed,
            unconfirmedEmail: lowerEmail
          };
        }

        if (data?.user) {
          const userEmail = (data.user.email || lowerEmail).toLowerCase();
          
          // Verify role directly from Supabase profiles table
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          const isDbAdmin = dbProfile?.role === 'admin';
          const isLegacyAdmin =
            userEmail === 'booktiis09@gmail.com' ||
            userEmail === 'xusenaadan11@gmail.com';
          const isAdmin = isDbAdmin || isLegacyAdmin;

          const resolvedRole: 'admin' | 'customer' = isAdmin ? 'admin' : (dbProfile?.role === 'admin' ? 'admin' : 'customer');

          if (isAdmin && dbProfile && dbProfile.role !== 'admin') {
            try {
              await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
            } catch {
              // Ignore
            }
          }

          const profile: Profile = {
            id: data.user.id,
            email: data.user.email || lowerEmail,
            full_name: dbProfile?.full_name || (data.user.user_metadata?.full_name as string) || cleanEmail.split('@')[0] || (isAdmin ? 'Maamule' : 'Macaamil'),
            role: resolvedRole,
            created_at: dbProfile?.created_at
          };

          // Self-heal profile row if missing in public.profiles table (without ever elevating to admin unless verified)
          if (!dbProfile) {
            try {
              await supabase.from('profiles').insert([
                {
                  id: data.user.id,
                  full_name: profile.full_name,
                  role: resolvedRole === 'admin' ? 'admin' : 'customer'
                }
              ]);
            } catch {
              // Handled by database trigger or existing record
            }
          }

          storeService.setCurrentProfile(profile);
          return { success: true, profile };
        }
      } catch (err: unknown) {
        const formatted = formatSupabaseAuthError(err);
        return {
          success: false,
          error: formatted.displayMessage,
          rawError: formatted.rawError
        };
      }
    }

    // Local mode fallback
    const found = storeService.getProfiles().find(p => p.email?.toLowerCase() === cleanEmail.toLowerCase());
    if (!found) {
      return { success: false, error: 'Laguma helin koonto email-kan leh. Fadlan marka hore isdiiwaangeli.' };
    }

    storeService.setCurrentProfile(found);
    return { success: true, profile: found };
  }

  // Sign out
  public async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error signing out:', e);
      }
    }
    storeService.setCurrentProfile(null);
  }

  // Password reset request
  public async resetPassword(email: string): Promise<{ success: boolean; message: string; rawError?: string }> {
    const cleanEmail = email?.trim() || '';
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Fadlan geli email sax ah.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const redirectUrl = getAppRedirectUrl();
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl
        });

        if (error) {
          const formatted = formatSupabaseAuthError(error);
          return {
            success: false,
            message: formatted.displayMessage,
            rawError: formatted.rawError
          };
        }

        return {
          success: true,
          message: `Waxaa email-kaaga (${cleanEmail}) loo soo diray link-ga dib-u-dejinta furaha sirta ah. Fadlan ka hubi sanduuqaaga (Inbox iyo Spam).`
        };
      } catch (err: unknown) {
        const formatted = formatSupabaseAuthError(err);
        return {
          success: false,
          message: formatted.displayMessage,
          rawError: formatted.rawError
        };
      }
    }

    // Local mode demo
    return {
      success: true,
      message: `Email-ka xaqiijinta dib-u-dejinta furaha sirta ah waxaa loo diray ${cleanEmail}. (Habka tijaabada)`
    };
  }

  // Update password (used after user clicks the recovery link from Supabase)
  public async updatePassword(newPassword: string): Promise<{ success: boolean; message: string; rawError?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Furaha sirta ah ee cusub waa inuu ka koobnaadaa ugu yaraan 6 xaraf.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
          const formatted = formatSupabaseAuthError(error);
          return {
            success: false,
            message: formatted.displayMessage,
            rawError: formatted.rawError
          };
        }

        return {
          success: true,
          message: 'Furahaaga sirta ah si guul leh ayaa loo cusbooneysiiyay! Hadda waad gali kartaa koontadaada.'
        };
      } catch (err: unknown) {
        const formatted = formatSupabaseAuthError(err);
        return {
          success: false,
          message: formatted.displayMessage,
          rawError: formatted.rawError
        };
      }
    }

    return {
      success: true,
      message: 'Furaha sirta ah si guul leh ayaa loo beddelay. (Habka tijaabada)'
    };
  }

  // Resend confirmation email for unverified user
  public async resendConfirmationEmail(email: string): Promise<{ success: boolean; message: string; rawError?: string }> {
    const cleanEmail = email?.trim() || '';
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Fadlan geli email sax ah.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const redirectUrl = getAppRedirectUrl();
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: cleanEmail,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          const formatted = formatSupabaseAuthError(error);
          return {
            success: false,
            message: formatted.displayMessage,
            rawError: formatted.rawError
          };
        }

        return {
          success: true,
          message: `Email-ka xaqiijinta waxaa dib loogu soo diray ${cleanEmail}. Fadlan ka hubi sanduuqaaga (Inbox iyo Spam).`
        };
      } catch (err: unknown) {
        const formatted = formatSupabaseAuthError(err);
        return {
          success: false,
          message: formatted.displayMessage,
          rawError: formatted.rawError
        };
      }
    }

    return {
      success: true,
      message: `Email-ka xaqiijinta dib ayaa loogu diray ${cleanEmail}. (Habka tijaabada)`
    };
  }

  // Helper to re-fetch and refresh current user profile directly from Supabase profiles table
  public async refreshCurrentProfile(): Promise<Profile | null> {
    const profile = await this.getCurrentProfile();
    if (profile) {
      storeService.setCurrentProfile(profile);
    }
    return profile;
  }

}

export const authService = new AuthService();

