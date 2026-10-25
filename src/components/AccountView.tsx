import React, { useState } from 'react';
import { User, Mail, ShieldCheck, Calendar, LogOut, KeyRound, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Profile } from '../types';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';

interface AccountViewProps {
  currentUser: Profile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onRefreshProfile?: () => Promise<void>;
}

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  onLogout,
  onOpenAuth,
  onRefreshProfile,
}) => {
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncingRole, setSyncingRole] = useState(false);
  const isConfigured = isSupabaseConfigured();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#EAF7EF] text-[#087A43] flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Kuma jirtid Koonto</h2>
        <p className="text-xs text-gray-500">
          Fadlan gal koontadaada ama isdiiwaangeli si aad u aragto macluumaadkaaga.
        </p>
        <button
          onClick={onOpenAuth}
          className="py-2.5 px-6 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          Gal Koontada
        </button>
      </div>
    );
  }

  const handlePasswordReset = async () => {
    if (!currentUser.email) return;
    setLoading(true);
    setResetMessage(null);
    try {
      const res = await authService.resetPassword(currentUser.email);
      setResetMessage(res.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRole = async () => {
    if (!onRefreshProfile) return;
    setSyncingRole(true);
    try {
      await onRefreshProfile();
      setResetMessage('Doorka koontada waxaa laga soo cusbooneysiiyay xog-kaydka Supabase!');
    } catch {
      setResetMessage('Ma suurtogelin cusbooneysiinta doorka.');
    } finally {
      setSyncingRole(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Account Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#087A43] to-[#12A85A] text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-[#087A43]/20">
            {currentUser.full_name?.charAt(0) || 'U'}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-gray-900">
                {currentUser.full_name}
              </h2>
              {currentUser.role === 'admin' ? (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Maamule (Admin)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF7EF] text-[#087A43] border border-[#D1EADE]">
                  Macaamil (Customer)
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>{currentUser.email || 'Email lama diiwaangelin'}</span>
            </div>

            <div className="text-[11px] text-gray-400 flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Xubin ilaa: {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'Dhawaan'}</span>
            </div>
          </div>
        </div>

        {/* Account Details Form */}
        <div className="pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Aqoonsiga Macaamilka (User ID)
            </span>
            <span className="font-mono text-gray-800 select-all font-semibold break-all">
              {currentUser.id}
            </span>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Doorka Amniga (Security Role)
              </span>
              <span className="font-bold text-gray-900 capitalize flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#087A43]" />
                {currentUser.role === 'admin' ? 'Maamule Guud (Full Admin)' : 'Macaamil Caadi ah'}
              </span>
            </div>
            {onRefreshProfile && (
              <button
                onClick={handleSyncRole}
                disabled={syncingRole}
                title="Ka hubi Supabase profiles table"
                className="p-1.5 text-gray-500 hover:text-[#087A43] hover:bg-white rounded-lg border border-gray-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingRole ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Security / Password reset action */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handlePasswordReset}
            disabled={loading}
            className="w-full sm:w-auto py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-4 h-4 text-gray-600" />
            <span>{loading ? 'Dirayaa...' : 'Beddel Furaha Sirta ah (Reset Password)'}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full sm:w-auto py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Ka bax Koontada</span>
          </button>
        </div>

        {resetMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{resetMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
