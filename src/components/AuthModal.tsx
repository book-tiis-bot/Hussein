import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight, KeyRound, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';
import { Profile } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

export type AuthTab = 'login' | 'register' | 'forgot' | 'update-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: Profile) => void;
  initialTab?: AuthTab;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawErrorMessage, setRawErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');

  const resetForm = () => {
    setErrorMessage(null);
    setRawErrorMessage(null);
    setSuccessMessage(null);
    setCanResendConfirmation(false);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  useEffect(() => {
    setTab(initialTab);
    resetForm();
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRawErrorMessage(null);
    setSuccessMessage(null);
    setCanResendConfirmation(false);
    setLoading(true);

    try {
      const res = await authService.signIn(email, password);
      if (res.success && res.profile) {
        onSuccess(res.profile);
        onClose();
      } else {
        setErrorMessage(res.error || 'Galitaanku ma suurtogelin. Fadlan hubi macluumaadkaaga.');
        if (res.rawError) {
          setRawErrorMessage(res.rawError);
        }
        if (res.canResendConfirmation) {
          setCanResendConfirmation(true);
          setUnconfirmedEmail(res.unconfirmedEmail || email);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRawErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await authService.signUp(fullName, email, password);
      if (res.success) {
        if (res.needsEmailConfirmation) {
          // Email confirmation is required by Supabase
          setSuccessMessage(res.message || `Waxaa email-kaaga loo soo diray link-ga xaqiijinta. Fadlan xaqiiji.`);
          setCanResendConfirmation(true);
          setUnconfirmedEmail(email.trim());
          setTab('login');
        } else if (res.profile) {
          onSuccess(res.profile);
          onClose();
        }
      } else {
        setErrorMessage(res.error || 'Diiwaangelintu ma suurtogelin.');
        if (res.rawError) {
          setRawErrorMessage(res.rawError);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRawErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await authService.resetPassword(email);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
        if (res.rawError) setRawErrorMessage(res.rawError);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRawErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('Furaha sirta ah iyo xaqiijintiisu isma laha. Fadlan hubi.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Furaha sirta ah waa inuu ka koobnaadaa ugu yaraan 6 xaraf.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.updatePassword(newPassword);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          setTab('login');
        }, 2000);
      } else {
        setErrorMessage(res.message);
        if (res.rawError) setRawErrorMessage(res.rawError);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khalad ayaa dhacay';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = unconfirmedEmail || email;
    if (!targetEmail) return;

    setResending(true);
    try {
      const res = await authService.resendConfirmationEmail(targetEmail);
      if (res.success) {
        setSuccessMessage(res.message);
        setErrorMessage(null);
        setRawErrorMessage(null);
      } else {
        setErrorMessage(res.message);
        if (res.rawError) setRawErrorMessage(res.rawError);
      }
    } finally {
      setResending(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D1EADE]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Xidh"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-[#EAF7EF] p-6 text-center border-b border-[#D1EADE]/60">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#087A43] text-white flex items-center justify-center font-black text-xl shadow-md mb-2">
            BT
          </div>
          <h2 className="text-xl font-black text-[#087A43]">
            {tab === 'login' && 'Ku soo dhowow BOOK-TIIS'}
            {tab === 'register' && 'Sameyso Koonto Cusub'}
            {tab === 'forgot' && 'Dib-u-dejinta Furaha Sirta ah'}
            {tab === 'update-password' && 'Furaha Sirta ah ee Cusub'}
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            {tab === 'login' && 'Geli macluumaadkaaga si aad u gasho maktabaddaada.'}
            {tab === 'register' && 'Ku biir kumanaanka qof ee wax ku akhriya BOOK-TIIS.'}
            {tab === 'forgot' && 'Geli email-kaaga si aan kuugu soo dirno link-ga beddelka.'}
            {tab === 'update-password' && 'Geli furahaaga sirta ah ee cusub si aad u dhammaystirto dib-u-dejinta.'}
          </p>
        </div>

        {/* Tab Switcher */}
        {tab !== 'forgot' && tab !== 'update-password' && (
          <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50/70 p-1">
            <button
              onClick={() => {
                setTab('login');
                resetForm();
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-[#087A43] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Gal (Sign In)
            </button>
            <button
              onClick={() => {
                setTab('register');
                resetForm();
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-[#087A43] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Isdiiwaangeli (Sign Up)
            </button>
          </div>
        )}

        <div className="p-6">
          {/* Error Banner with detailed Supabase error diagnosis */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed font-medium">
                  {errorMessage}
                </div>
              </div>

              {/* Exact Supabase Error details badge */}
              {rawErrorMessage && (
                <div className="mt-1.5 pt-1.5 border-t border-red-200/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-0.5">
                    Natiijada Supabase Auth:
                  </div>
                  <code className="text-[11px] font-mono text-red-950 bg-red-100/80 px-2 py-1 rounded block break-all">
                    {rawErrorMessage}
                  </code>
                </div>
              )}

              {/* One-click resend confirmation email button */}
              {canResendConfirmation && (
                <div className="mt-2 pt-2 border-t border-red-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 bg-red-100/50 p-2.5 rounded-xl">
                  <span className="text-[11px] text-red-900 font-semibold">
                    Ma xaqiijin email-kaaga?
                  </span>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="w-full sm:w-auto px-3 py-1.5 bg-[#087A43] hover:bg-[#066336] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>{resending ? 'Dirayaa...' : 'Dib u soo dir Xaqiijinta'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-[#12A85A] shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email-kaaga
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tusaale@email.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#087A43] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Furaha Sirta ah (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      resetForm();
                    }}
                    className="text-[11px] text-[#087A43] hover:underline cursor-pointer font-semibold"
                  >
                    Ma ilowday furaha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#087A43] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    aria-label="Muuji ama qari furaha"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (password.startsWith(' ') || password.endsWith(' ')) && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Fadlan ogow: Furaha sirta ah waxaa ku jira meel bannaan (space) bilowga ama dhammaadka. Nidaamku wuxuu isku dayi doonaa labadaba.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#087A43] hover:bg-[#066336] text-white font-bold text-sm rounded-xl shadow-md shadow-[#087A43]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Fadlan sug...' : 'Gal Koontada'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Magacaaga oo buuxa
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jaamac Axmed"
                    autoComplete="name"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#087A43] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jaamac@gmail.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#087A43] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Furaha Sirta ah (Ugu yaraan 6 xaraf)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#087A43] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    aria-label="Muuji ama qari furaha"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#12A85A] hover:bg-[#0f8e4c] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Fadlan sug...' : 'Abuur Koonto Cusub'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {tab === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email-kaaga
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email-kaaga@gmail.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#087A43] focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Waxaan kugu soo diri doonaa link xaqiijin ah oo aad ku cusbooneysiin karto furahaaga sirta ah.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#087A43] hover:bg-[#066336] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-md shadow-[#087A43]/20"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Dirayaa...' : 'Soo dir Link-ga Beddelka'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  resetForm();
                }}
                className="w-full text-center text-xs text-gray-600 hover:text-[#087A43] font-semibold pt-2 cursor-pointer transition-colors"
              >
                ← Ku noqo Galitaanka (Back to Sign In)
              </button>
            </form>
          )}

          {/* Update Password Form (Activated from recovery link) */}
          {tab === 'update-password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Furaha Sirta ah ee Cusub (Ugu yaraan 6 xaraf)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#087A43] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    aria-label="Muuji ama qari furaha"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Hubi Furaha Sirta ah ee Cusub
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#087A43] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#087A43] hover:bg-[#066336] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-md shadow-[#087A43]/20"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Cusbooneysiinayaa...' : 'Badal Furaha Sirta ah'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  resetForm();
                }}
                className="w-full text-center text-xs text-gray-600 hover:text-[#087A43] font-semibold pt-2 cursor-pointer transition-colors"
              >
                ← Ku noqo Galitaanka
              </button>
            </form>
          )}


        </div>
      </div>
    </div>
  );
};
