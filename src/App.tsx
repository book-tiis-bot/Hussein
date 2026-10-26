import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Profile } from './types';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { BookCatalogueView } from './components/BookCatalogueView';
import { MyLibraryView } from './components/MyLibraryView';

export function AccountView({ currentUser, onLogout, onOpenAuth, onRefreshProfile }: {
  currentUser: Profile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onRefreshProfile: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar_url || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
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
      setAvatarPreview(avatarUrl || '');
      setResetMessage('Xogta profaylka si guul leh ayaa loo kaydiyay! ✅');
      
      await onRefreshProfile();

      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (err: any) {
      console.error("Cilladda Profaylka:", err);
      setResetMessage('Cillad ayaa dhacday: ' + (err.message || 'Fadlan dib u day.'));
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-8 max-w-md mx-auto text-center bg-white rounded-xl shadow-md space-y-4 mt-10">
        <h2 className="text-xl font-bold text-gray-800">Fadlan Soo Geli (Login)</h2>
        <p className="text-gray-600 text-sm">Waa inaad soo gashaa si aad u aragto oo aad u maamusho koontadaada.</p>
        <button
          onClick={onOpenAuth}
          className="w-full bg-[#087A43] text-white py-2 px-4 rounded-md font-semibold hover:bg-[#066135] transition"
        >
          Soo Geli / Is-diiwaangeli
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6 mt-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">Habaynta Koontada (Account Settings)</h2>
      
      <div className="flex items-center space-x-4">
        <img 
          src={avatarPreview || currentUser.avatar_url || 'https://via.placeholder.com/150'} 
          alt="Avatar" 
          className="w-20 h-20 rounded-full object-cover border-2 border-[#087A43]"
        />
        <div>
          <h3 className="font-bold text-lg text-gray-900">{currentUser.full_name || 'Isticmaale'}</h3>
          <p className="text-sm text-gray-500">{currentUser.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-green-100 text-[#087A43] rounded-full uppercase">
            {currentUser.role || 'user'}
          </span>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Magaca Buuxa:</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#087A43] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beddel Sawirka Profaylka:</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setAvatarFile(e.target.files[0]);
              }
            }} 
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-[#087A43] hover:file:bg-green-100"
          />
        </div>

        {resetMessage && <p className="text-sm font-medium text-green-600">{resetMessage}</p>}

        <button 
          type="submit" 
          disabled={updatingProfile}
          className="w-full bg-[#087A43] text-white py-2 rounded-md font-semibold hover:bg-[#066135] disabled:opacity-50 transition"
        >
          {updatingProfile ? 'Waa la kaydinayaa...' : 'Kaydi Isbeddelka'}
        </button>
      </form>

      <div className="pt-4 border-t flex justify-between items-center">
        <button
          onClick={onLogout}
          className="text-red-600 hover:text-red-800 text-sm font-semibold transition"
        >
          Ka Bax (Logout)
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'catalogue' | 'library' | 'admin' | 'account'>('home');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setCurrentUser(data);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
        onOpenAuth={() => setCurrentView('account')}
        onLogout={async () => {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setCurrentView('home');
        }}
      />
      <main className="flex-1 pb-16">
        {currentView === 'home' && <HomeView onNavigate={setCurrentView} />}
        {currentView === 'catalogue' && <BookCatalogueView currentUser={currentUser} />}
        {currentView === 'library' && <MyLibraryView currentUser={currentUser} />}
        {currentView === 'account' && (
          <AccountView
            currentUser={currentUser}
            onLogout={async () => {
              await supabase.auth.signOut();
              setCurrentUser(null);
              setCurrentView('home');
            }}
            onOpenAuth={() => setCurrentView('account')}
            onRefreshProfile={refreshProfile}
          />
        )}
      </main>
    </div>
  );
}
