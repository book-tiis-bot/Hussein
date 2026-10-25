import React, { useState } from 'react';
import { X, Database, Copy, Check, ShieldCheck, Terminal, HardDrive, KeyRound, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const isConfigured = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleCopySql = () => {
    fetch('/supabase/schema.sql')
      .then(res => res.text())
      .then(text => {
        navigator.clipboard.writeText(text);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2500);
      })
      .catch(() => {
        // Fallback SQL sample
        navigator.clipboard.writeText('-- Ka eeg faylka /supabase/schema.sql');
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2500);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D1EADE] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#087A43] to-[#12A85A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black">
                Habaynta Supabase & Database (BOOK-TIIS)
              </h3>
              <p className="text-xs text-[#EAF7EF]">
                Xaaladda Hadda: {isConfigured ? '✅ Supabase waa xidhiidhsan yahay' : '⚡ Habka Tijaabada (Demo Mode)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step navigation tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 px-4 py-2 gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveStep(1)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeStep === 1 ? 'bg-[#087A43] text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            1. Mashruuca & Keys
          </button>
          <button
            onClick={() => setActiveStep(2)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeStep === 2 ? 'bg-[#087A43] text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            2. SQL Schema & RLS
          </button>
          <button
            onClick={() => setActiveStep(3)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeStep === 3 ? 'bg-[#087A43] text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            3. Storage Buckets
          </button>
          <button
            onClick={() => setActiveStep(4)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeStep === 4 ? 'bg-[#087A43] text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            4. Maamulaha (Admin)
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-gray-700 flex-1">
          {activeStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#087A43]" />
                Tallaabada 1: Abuur Mashruuc Supabase & Ku dar Furayaasha
              </h4>
              <p>
                1. Tag bogga rasmiga ah ee <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#087A43] font-bold underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a> oo abuur mashruuc cusub (New Project).
              </p>
              <p>
                2. Tag <strong className="text-gray-900">Project Settings &gt; API</strong> oo koobiyay:
              </p>
              <div className="bg-gray-900 text-gray-200 p-3 rounded-xl font-mono text-[11px] space-y-1">
                <div>Project URL (tusaale: https://xyzcompany.supabase.co)</div>
                <div>Project API Keys &gt; anon / public key</div>
              </div>
              <p>
                3. Geli qiimayaashan faylkaaga <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-800">.env</code>:
              </p>
              <div className="bg-gray-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] space-y-1">
                <div>VITE_SUPABASE_URL="https://mashruucaaga.supabase.co"</div>
                <div>VITE_SUPABASE_PUBLISHABLE_KEY="furahaaga-anon-public-key"</div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#087A43]" />
                Tallaabada 2: Daar Tables-ka & Xeerarka Amniga (RLS Policies)
              </h4>
              <p>
                Waxaan kuu diyaarinay SQL Script dhameystiran oo abuuraya tables-ka <code className="font-mono">profiles</code>, <code className="font-mono">books</code>, <code className="font-mono">orders</code>, iyo <code className="font-mono">payment_requests</code>, triggers-ka, iyo xeerarka adag ee Row Level Security (RLS).
              </p>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-900 text-xs">Xeerarka Amniga: supabase/secure_policies.sql</div>
                    <div className="text-[11px] text-emerald-700">Xeerarka adag ee RLS (Admin-only manage, Customer read-only & verified PDF)</div>
                  </div>
                  <button
                    onClick={() => {
                      fetch('/supabase/secure_policies.sql')
                        .then(res => res.text())
                        .then(text => {
                          navigator.clipboard.writeText(text);
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 2500);
                        })
                        .catch(() => {
                          navigator.clipboard.writeText('-- Ka eeg faylka /supabase/secure_policies.sql');
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 2500);
                        });
                    }}
                    className="py-2 px-4 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSql ? 'La koobiyay!' : 'Koobiyeey Secure RLS'}</span>
                  </button>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs text-gray-700">
                  <span>Schema-ka buuxa ee bilowga ah: <code className="font-mono text-gray-800">supabase/schema.sql</code></span>
                  <button
                    onClick={handleCopySql}
                    className="text-xs font-bold text-[#087A43] hover:underline cursor-pointer"
                  >
                    Koobiyeey schema.sql
                  </button>
                </div>
              </div>

              <p>
                Geli <strong className="text-gray-900">Supabase Dashboard &gt; SQL Editor</strong>, daji SQL-ka, kadibna riix <strong className="text-gray-900">Run</strong>.
              </p>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#087A43]" />
                Tallaabada 3: Kaydka Faylasha (Storage Buckets)
              </h4>
              <p>
                Tag qaybta <strong className="text-gray-900">Storage</strong> ee Supabase oo xaqiiji labadan buckets:
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="font-bold text-gray-900 flex items-center justify-between">
                    <span>1. book-covers</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">Public</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Waxaa lagu kaydiyaa sawirrada jeldiyada buugaagta. Qof kastaa wuu arki karaa.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="font-bold text-gray-900 flex items-center justify-between">
                    <span>2. book-pdfs</span>
                    <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono">Private</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Waxaa lagu kaydiyaa PDF-yada sirta ah. Waxaa heli kara kaliya macaamiisha lacagta laga xaqiijiyay ama buugaagta bilaashka ah.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#087A43]" />
                Tallaabada 4: Amniga & Siinta Doorka Maamulaha (Grant Admin Role)
              </h4>
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <strong className="block font-bold">Xeerka Amniga (Strict Role Protection):</strong>
                <span>
                  Doorka maamulka (<code className="font-mono">role = 'admin'</code>) laguma beddeli karo dhanka hore ee biraawsarka ama xogta uu qoro qofku. Dhammaan koontooyinka cusub waxay si toos ah ku bilaabmaan <code className="font-mono">customer</code>. Waxaa maamule loogu dalacsiin karaa kaliya xog-kaydka Supabase SQL Editor.
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    Koodhka SQL ee Akoonka Cusub (Xusenaadan11@gmail.com):
                  </span>
                  <button
                    onClick={() => {
                      const sql = `-- Dalacsiinta doorka Maamulaha ee BOOK-TIIS\nINSERT INTO public.profiles (id, full_name, role)\nSELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Maamule'), 'admin'\nFROM auth.users\nWHERE LOWER(email) = 'xusenaadan11@gmail.com'\nON CONFLICT (id) DO UPDATE\nSET role = 'admin';\n\n-- Hubinta doorka:\nSELECT p.id, u.email, p.full_name, p.role\nFROM public.profiles p\nJOIN auth.users u ON p.id = u.id\nWHERE LOWER(u.email) = 'xusenaadan11@gmail.com';`;
                      navigator.clipboard.writeText(sql);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2500);
                    }}
                    className="py-1 px-3 bg-[#087A43] hover:bg-[#066336] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'La koobiyay!' : 'Koobiyey SQL-ka Admin-ka'}</span>
                  </button>
                </div>

                <div className="bg-gray-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed select-all">
                  -- 1. U beddel doorka admin akoonka Xusenaadan11@gmail.com<br />
                  INSERT INTO public.profiles (id, full_name, role)<br />
                  SELECT id, COALESCE(raw_user_meta_data-&gt;&gt;&#39;full_name&#39;, &#39;Maamule&#39;), &#39;admin&#39;<br />
                  FROM auth.users<br />
                  WHERE LOWER(email) = &#39;xusenaadan11@gmail.com&#39;<br />
                  ON CONFLICT (id) DO UPDATE<br />
                  SET role = &#39;admin&#39;;<br /><br />
                  -- 2. Xaqiiji in uu admin noqday<br />
                  SELECT p.id, u.email, p.full_name, p.role<br />
                  FROM public.profiles p<br />
                  JOIN auth.users u ON p.id = u.id<br />
                  WHERE LOWER(u.email) = &#39;xusenaadan11@gmail.com&#39;;
                </div>
              </div>

              <p className="text-gray-600 text-[11px]">
                Marka aad SQL-kan ku shaqaysiiso Supabase SQL Editor, dib ugu noqo BOOK-TIIS oo gal koontadaada ama riix badhanka <strong>"Dib u hubi Doorka Maamulka"</strong>. Badhanka <strong>"Maamulka"</strong> ayaa toos kuugu soo bixi doona!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Faylka buuxa ee README.md wuxuu ku yaal xididka mashruuca.
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Waan Fahmay
          </button>
        </div>
      </div>
    </div>
  );
};
