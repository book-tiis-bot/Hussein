import React, { useState } from 'react';
import { BookOpen, User, ShieldCheck, LogIn, LogOut, Database, Menu, X, Library, Compass } from 'lucide-react';
import { Profile } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  currentView: 'home' | 'catalogue' | 'library' | 'admin' | 'account';
  onNavigate: (view: 'home' | 'catalogue' | 'library' | 'admin' | 'account') => void;
  currentUser: Profile | null;
  onOpenAuth: (initialTab?: 'login' | 'register' | 'forgot' | 'update-password') => void;
  onLogout: () => void;
  onOpenSupabaseGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenSupabaseGuide,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isConfigured = isSupabaseConfigured();

  const handleNav = (view: 'home' | 'catalogue' | 'library' | 'admin' | 'account') => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Notice Bar */}
      <div className="bg-[#087A43] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#12A85A] animate-pulse"></span>
            <span className="font-medium">
              BOOK-TIIS: Maktabaddaada Dijitaalka ah ee Buugaagta Af-Soomaaliga
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSupabaseGuide}
              className="flex items-center gap-1.5 hover:text-[#EAF7EF] transition-colors cursor-pointer text-xs underline decoration-white/40"
              title="Fiiri macluumaadka Supabase & SQL"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isConfigured ? 'Supabase: Xidhiidhsan' : 'Supabase: Habka Tijaabada'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D1EADE] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo & Tagline */}
            <div
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#087A43] to-[#12A85A] flex items-center justify-center text-white shadow-md shadow-[#087A43]/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black tracking-tight text-[#087A43]">BOOK-TIIS</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-[#EAF7EF] text-[#087A43] px-2 py-0.5 rounded-md">
                    Library
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
                  Your Digital Library
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => handleNav('home')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  currentView === 'home'
                    ? 'bg-[#EAF7EF] text-[#087A43]'
                    : 'text-gray-700 hover:text-[#087A43] hover:bg-gray-50'
                }`}
              >
                Bogga Hore
              </button>

              <button
                onClick={() => handleNav('catalogue')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'catalogue'
                    ? 'bg-[#EAF7EF] text-[#087A43]'
                    : 'text-gray-700 hover:text-[#087A43] hover:bg-gray-50'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Buugaag</span>
              </button>

              <button
                onClick={() => handleNav('library')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'library'
                    ? 'bg-[#EAF7EF] text-[#087A43]'
                    : 'text-gray-700 hover:text-[#087A43] hover:bg-gray-50'
                }`}
              >
                <Library className="w-4 h-4" />
                <span>Maktabaddayda</span>
              </button>

              {/* Admin Panel button - ONLY visible for admin */}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => handleNav('admin')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'admin'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Maamulka</span>
                </button>
              )}
            </nav>

            {/* User Profile / Login actions */}
            <div className="hidden md:flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleNav('account')}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {/* Sawirka ama Xarafka ku jira Navbar-ka */}
                    {currentUser.avatar_url ? (
                      <img
                        src={currentUser.avatar_url}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-[#D1EADE]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#EAF7EF] text-[#087A43] border border-[#D1EADE] flex items-center justify-center font-bold text-xs">
                        {currentUser.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="text-xs font-semibold text-gray-800 line-clamp-1 max-w-[120px]">
                        {currentUser.full_name}
                      </div>
                      <div className="text-[10px] text-gray-500 capitalize">
                        {currentUser.role === 'admin' ? 'Maamule' : 'Macaamil'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={onLogout}
                    title="Ka bax koontada"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#087A43] cursor-pointer"
                  >
                    Gal
                  </button>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-4 py-2 text-sm font-bold bg-[#087A43] hover:bg-[#066336] text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Isdiiwaangeli
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <div className="flex items-center gap-2 md:hidden">
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => handleNav('admin')}
                  className="p-2 text-amber-700 bg-amber-50 rounded-lg"
                  title="Maamulka"
                >
                  <ShieldCheck className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-[#087A43] rounded-lg"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-5 space-y-3">
            <div className="space-y-1">
              <button
                onClick={() => handleNav('home')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  currentView === 'home' ? 'bg-[#EAF7EF] text-[#087A43]' : 'text-gray-700'
                }`}
              >
                Bogga Hore
              </button>
              <button
                onClick={() => handleNav('catalogue')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                  currentView === 'catalogue' ? 'bg-[#EAF7EF] text-[#087A43]' : 'text-gray-700'
                }`}
              >
                <Compass className="w-4 h-4" />
                Buugaag
              </button>
              <button
                onClick={() => handleNav('library')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                  currentView === 'library' ? 'bg-[#EAF7EF] text-[#087A43]' : 'text-gray-700'
                }`}
              >
                <Library className="w-4 h-4" />
                Maktabaddayda
              </button>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => handleNav('admin')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 ${
                    currentView === 'admin' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Maamulka (Admin Dashboard)
                </button>
              )}
              {currentUser && (
                <button
                  onClick={() => handleNav('account')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    currentView === 'account' ? 'bg-[#EAF7EF] text-[#087A43]' : 'text-gray-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Koontadayda ({currentUser.full_name})
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              {currentUser ? (
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Ka bax Koontada
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onOpenAuth('login');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg"
                  >
                    <LogIn className="w-4 h-4" />
                    Gal
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth('register');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center px-4 py-2.5 text-sm font-bold text-white bg-[#087A43] rounded-lg"
                  >
                    Isdiiwaangeli
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar for iPhone/Android */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D1EADE] py-2 px-3 flex items-center justify-around shadow-lg">
        <button
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer ${
            currentView === 'home' ? 'text-[#087A43] font-bold' : 'text-gray-500'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Hore</span>
        </button>

        <button
          onClick={() => handleNav('catalogue')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer ${
            currentView === 'catalogue' ? 'text-[#087A43] font-bold' : 'text-gray-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Buugaag</span>
        </button>

        <button
          onClick={() => handleNav('library')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer ${
            currentView === 'library' ? 'text-[#087A43] font-bold' : 'text-gray-500'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px]">Maktabadda</span>
        </button>

        {currentUser?.role === 'admin' ? (
          <button
            onClick={() => handleNav('admin')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer ${
              currentView === 'admin' ? 'text-amber-700 font-bold' : 'text-amber-800'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px]">Maamul</span>
          </button>
        ) : (
          <button
            onClick={() => (currentUser ? handleNav('account') : onOpenAuth('login'))}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer ${
              currentView === 'account' ? 'text-[#087A43] font-bold' : 'text-gray-500'
            }`}
          >
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover border border-[#087A43]"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="text-[10px]">{currentUser ? 'Koonto' : 'Gal'}</span>
          </button>
        )}
      </div>
    </>
  );
};
