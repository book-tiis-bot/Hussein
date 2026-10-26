import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
export function AccountView({ currentUser, onRefreshProfile }: { currentUser: any; onRefreshProfile?: () => Promise<void> }) {
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar_url || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setResetMessage(null);

    try {
      let avatarUrl = currentUser.avatar_url;

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

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (dbError) throw dbError;

      setAvatarFile(null);
      setAvatarPreview(avatarUrl);
      setResetMessage('Xogta profaylka si guul leh ayaa loo kaydiyay! ✅');
      
      if (onRefreshProfile) {
        await onRefreshProfile();
      }

      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (err: any) {
      console.error("Cilladda Profaylka:", err);
      alert('Cillad ayaa dhacday: ' + (err.message || JSON.stringify(err)));
      setResetMessage('Cillad ayaa dhacday: ' + (err.message || 'Fadlan dib u day.'));
    } finally {
      setUpdatingProfile(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Habaynta Koontada (Account Settings)</h2>
      
      <div className="flex items-center space-x-4">
        <img 
          src={avatarPreview || 'https://via.placeholder.com/150'} 
          alt="Avatar" 
          className="w-20 h-20 rounded-full object-cover border"
        />
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Magaca Buuxa:</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Beddel Sawirka Profaylka:</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setAvatarFile(e.target.files[0]);
              }
            }} 
            className="mt-1 block w-full"
          />
        </div>

        {resetMessage && <p className="text-sm text-green-600">{resetMessage}</p>}

        <button 
          type="submit" 
          disabled={updatingProfile}
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {updatingProfile ? 'Waa la kaydinayaa...' : 'Kaydi Isbeddelka'}
        </button>
      </form>
    </div>
  );
}
