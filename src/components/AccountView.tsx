import React, { useState } from 'react';
import { User, Mail, ShieldCheck, Calendar, LogOut, KeyRound, Check, RefreshCw, Camera } from 'lucide-react';
import { Profile } from '../types';
import { authService } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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
  
  // States-ka cusub ee Wax-ka-beddelka Magaca iyo Sawirka
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatar_url || null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

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

  // Habaynta iyo kaydinta Magaca iyo Sawirka cusub
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setResetMessage(null);

    try {
      let avatarUrl = currentUser.avatar_url;

      // 1. Haddii uu sawir cusub doortay, ku shub Supabase Storage (avatars bucket)
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          throw new Error('Cillad sawirka upload-ka ah: ' + uploadError.message);
        }

        const { data: publicURLData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicURLData.publicUrl;
      }

      // 2. Cusboonaysii miiska profiles ee Database-ka
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', currentUser.id);

      if (dbError) throw dbError;

      setResetMessage('Xogta profaylka si guul leh ayaa loo kaydiyay! ✅');
      
      // Soo cusboonaysii xogta user-ka ee app-ka dhexdiisa
      if (onRefreshProfile) {
        await onRefreshProfile();
      }
    } catch (err: any) {
      setResetMessage('Cillad ayaa dhacday: ' + (err.message || 'Fadlan dib u day.'));
    } finally {
      setUpdatingProfile(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Account Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        
        {/* Foomka Wax-ka-beddelka Magaca & Sawirka */}
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            
            {/* Sawirka Profaylka / Badalkiisa */}
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg shadow-[#087A43]/20 border-2 border-[#087A43]"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#087A43] to-[#12A85A] text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-[#087A43]/20">
                  {fullName?.charAt(0) || currentUser.full_name?.charAt(0) || 'U'}
                </div>
              )}
              
              <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
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

              {/* Meesha lagu qorayo Magaca Cusub */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Badal Magacaaga</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#087A43]"
                  placeholder="Geli magacaaga buuxa..."
                  required
                />
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

          {/* Badhanka Kaydinta Isbedelka Magaca/Sawirka */}
          <button
            type="submit"
            disabled={updatingProfile}
            className="w-full py-2.5 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {updatingProfile ? 'Waa la kaydinayaa...' : 'Keydso Isbedelka Profaylka'}
          </button>
        </form>

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
