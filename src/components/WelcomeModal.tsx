import React from 'react';
import { BookOpen, Sparkles, CheckCircle2, ShieldCheck, Smartphone, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onStart,
  onLogin,
  onRegister,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D1EADE] text-center">
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Xidh"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Graphic */}
        <div className="bg-gradient-to-b from-[#EAF7EF] to-white pt-10 pb-6 px-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-[#087A43] to-[#12A85A] flex items-center justify-center text-white shadow-xl shadow-[#087A43]/25 mb-4 transform hover:scale-105 transition-transform">
            <BookOpen className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#087A43]">
            BOOK-TIIS
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-[#12A85A] mt-1">
            Your Digital Library
          </p>
          <p className="text-gray-600 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
            Ku soo dhowow maktabadda dijitaalka ah ee ugu weyn uguna casrisan buugaagta tayada sare leh ee Af-Soomaaliga.
          </p>
        </div>

        {/* Value Highlights */}
        <div className="px-6 py-2 grid grid-cols-3 gap-2 text-left bg-gray-50/60 border-y border-gray-100">
          <div className="p-2.5 rounded-xl bg-white border border-[#D1EADE]/60">
            <CheckCircle2 className="w-4 h-4 text-[#12A85A] mb-1" />
            <div className="text-[11px] font-bold text-gray-800">Akhris Qani ah</div>
            <div className="text-[10px] text-gray-500">PDF tayo sare leh</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#D1EADE]/60">
            <Smartphone className="w-4 h-4 text-[#12A85A] mb-1" />
            <div className="text-[11px] font-bold text-gray-800">EVC Plus</div>
            <div className="text-[10px] text-gray-500">Bixin toos ah oo fudud</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#D1EADE]/60">
            <ShieldCheck className="w-4 h-4 text-[#12A85A] mb-1" />
            <div className="text-[11px] font-bold text-gray-800">Kayd Aamin ah</div>
            <div className="text-[10px] text-gray-500">Maktabad shakhsi ah</div>
          </div>
        </div>

        {/* Buttons: Bilow, Gal, Isdiiwaangeli */}
        <div className="p-6 space-y-3">
          <button
            onClick={() => {
              onStart();
              onClose();
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-[#087A43] hover:bg-[#066336] text-white font-bold text-base shadow-lg shadow-[#087A43]/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-xl"
          >
            <Sparkles className="w-5 h-5 text-emerald-200" />
            <span>Bilow</span>
          </button>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                onClose();
                onLogin();
              }}
              className="py-3 px-4 rounded-xl border-2 border-[#087A43] text-[#087A43] hover:bg-[#EAF7EF] font-bold text-sm transition-all cursor-pointer"
            >
              Gal
            </button>
            <button
              onClick={() => {
                onClose();
                onRegister();
              }}
              className="py-3 px-4 rounded-xl bg-[#12A85A] hover:bg-[#0f8e4c] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Isdiiwaangeli
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
