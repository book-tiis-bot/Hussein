import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Smartphone, 
  Compass, 
  GraduationCap, 
  HeartPulse, 
  TrendingUp, 
  History, 
  Feather, 
  Cpu, 
  ScrollText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Book, BookCategory } from '../types';
import { BookCard } from './BookCard';
import { EVC_PLUS_NUMBER } from '../services/orderService';

interface HomeViewProps {
  books: Book[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onSelectBook: (book: Book) => void;
  onNavigateToCatalogue: (category?: string, search?: string) => void;
  onNavigateToLibrary: () => void;
  onNavigateToAdmin?: () => void;
  ownedBookIds: Set<string>;
}

const CATEGORIES_DATA: Array<{ name: BookCategory; label: string; icon: any; count: string }> = [
  { name: 'Diinta', label: 'Diinta & Akhlaaqda', icon: ScrollText, count: 'Buugaag qiimo leh' },
  { name: 'Taariikh', label: 'Taariikhda Guud', icon: History, count: 'Soomaaliya & Dunida' },
  { name: 'Ganacsiga', label: 'Ganacsiga & Suuq-geynta', icon: TrendingUp, count: 'Meheradaha casriga ah' },
  { name: 'Cilmi', label: 'Sayniska & Cilmiga', icon: GraduationCap, count: 'Baaritaanno & STEM' },
  { name: 'Suugaanta', label: 'Suugaanta & Maansada', icon: Feather, count: 'Gabayo & Maahmaahyo' },
  { name: 'Teknoolojiga', label: 'Teknoolojiga & AI', icon: Cpu, count: 'Barnaamij-samayn & Xog' },
  { name: 'Caafimaadka', label: 'Caafimaadka Qoyska', icon: HeartPulse, count: 'Nafaqada & Daryeelka' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  books,
  loading = false,
  error = null,
  onRefresh,
  onSelectBook,
  onNavigateToCatalogue,
  onNavigateToLibrary,
  onNavigateToAdmin,
  ownedBookIds,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateToCatalogue(undefined, searchInput.trim());
  };

  const featuredBooks = books.filter(b => b.featured || b.price > 0).slice(0, 4);
  const latestBooks = [...books]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);
  const freeBooks = books.filter(b => b.is_free).slice(0, 4);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* HERO SECTION - Badankii cagaaraanaa waa laga saaray */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF7EF] via-[#EAF7EF]/40 to-white pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-[#D1EADE]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Fur Daaqadda <span className="text-[#087A43]">Aqoonta!</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Ka hel buugaag tayo leh afkaaga hooyo. Ku bixi EVC Plus, kuna bilow akhriska isla markiiba.
          </p>

          {/* Search bar labeled "Raadi buug…" */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-xl mx-auto flex items-center bg-white rounded-2xl shadow-xl shadow-[#087A43]/10 border border-[#D1EADE] p-1.5 focus-within:border-[#087A43] transition-all"
          >
            <div className="pl-3.5 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Raadi buug…"
              className="flex-1 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent font-medium"
            />
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-[#087A43] hover:bg-[#066336] text-white text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              Raadi
            </button>
          </form>

          {/* Quick CTA Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigateToCatalogue()}
              className="px-5 py-2.5 rounded-xl bg-[#087A43] text-white text-xs font-bold hover:bg-[#066336] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Dhammaan Buugaagta</span>
            </button>
            <button
              onClick={onNavigateToLibrary}
              className="px-5 py-2.5 rounded-xl bg-white border border-[#D1EADE] text-[#087A43] text-xs font-bold hover:bg-[#EAF7EF] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Fur Maktabaddayda</span>
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2.5 rounded-xl bg-white/80 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Dib u cusboonaysii liiska buugaagta Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Cusboonaysii</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ERROR BANNER IF ANY */}
      {error && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-red-800">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Cillad ayaa dhacday intii buugaagta laga soo qaadayay Supabase:</span>
                <span>{error}</span>
              </div>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
              >
                Isku day mar kale
              </button>
            )}
          </div>
        </section>
      )}

      {/* CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Qaybaha Buugaagta (Categories)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Xulo cilmiga ama mawduuca aad doonayso inaad barato maanta.
            </p>
          </div>
          <button
            onClick={() => onNavigateToCatalogue()}
            className="text-xs font-bold text-[#087A43] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Arag dhammaan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {CATEGORIES_DATA.map((cat) => {
            const Icon = cat.icon;
            const countForCat = books.filter(b => b.category === cat.name).length;
            return (
              <button
                key={cat.name}
                onClick={() => onNavigateToCatalogue(cat.name)}
                className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-[#D1EADE] shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] group-hover:bg-[#087A43] text-[#087A43] group-hover:text-white flex items-center justify-center transition-colors mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 group-hover:text-[#087A43] transition-colors">
                    {cat.name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                    {countForCat > 0 ? `${countForCat} buug` : cat.count}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* LOADING SKELETON */}
      {loading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-[#087A43] mb-4">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Soo dejinaya buugaagta Supabase...</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
            ))}
          </div>
        </section>
      )}

      {/* FEATURED BOOKS SECTION */}
      {!loading && books.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#087A43]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>La Soo Xulay</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                Buugaagta Caanka ah (Featured Books)
              </h2>
            </div>
            <button
              onClick={() => onNavigateToCatalogue()}
              className="text-xs font-bold text-[#087A43] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Wax badan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {(featuredBooks.length > 0 ? featuredBooks : books.slice(0, 4)).map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={onSelectBook}
                isOwned={ownedBookIds.has(book.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* EMPTY BOOKS STATE */}
      {!loading && books.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-12 sm:p-16 text-center bg-white rounded-3xl border border-[#D1EADE] shadow-xs space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#EAF7EF] text-[#087A43] flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900">
              Weli ma jiraan buugaag ku jira xog-kaydka Supabase
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Buug kasta oo aad ku darto Qeybta Maamulka (Admin Panel) wuxuu si toos ah ugu kaydsami doonaa table-ka <code>books</code> ee Supabase, wuxuuna isla markiiba ka soo muuqan doonaa boggan hore.
            </p>
            {onNavigateToAdmin && (
              <div className="pt-2">
                <button
                  onClick={onNavigateToAdmin}
                  className="py-3 px-6 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-md shadow-[#087A43]/20 inline-flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Fur Qeybta Maamulka si aad buug ugu darto</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* EVC PLUS PAYMENT SPOTLIGHT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#087A43] via-[#087A43] to-[#12A85A] text-white rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden relative">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold text-[#EAF7EF]">
              <Smartphone className="w-4 h-4" />
              <span>Lacag-bixinta EVC Plus</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Si fudud ugu iibso EVC Plus lambarka: <br className="hidden sm:inline" />
              <span className="font-mono text-amber-300 underline decoration-amber-300/40">
                {EVC_PLUS_NUMBER}
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-[#EAF7EF]/90 leading-relaxed">
              Dooro buugga aad rabto, u dir lacagta lambarka EVC Plus, geli Transaction ID-ga, buuggana si toos ah ayaa laguugu furayaa marka maamulka xaqiijiyo.
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <div className="font-black text-amber-300 text-sm">1. Iibso</div>
                <div className="text-white/80 text-[11px] mt-0.5">Xulo buugga aad u baahan tahay</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <div className="font-black text-amber-300 text-sm">2. Dir EVC Plus</div>
                <div className="text-white/80 text-[11px] mt-0.5">U dir {EVC_PLUS_NUMBER}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <div className="font-black text-amber-300 text-sm">3. Akhri</div>
                <div className="text-white/80 text-[11px] mt-0.5">Ka akhriso maktabaddaada</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LATEST BOOKS SECTION */}
      {!loading && latestBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Buugaagtii ugu Dambeeyay (Latest Books)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Buugaag cusub oo toos looga keenay xog-kaydka Supabase.
              </p>
            </div>
            <button
              onClick={() => onNavigateToCatalogue()}
              className="text-xs font-bold text-[#087A43] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Arag dhammaan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {latestBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={onSelectBook}
                isOwned={ownedBookIds.has(book.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* FREE BOOKS SPOTLIGHT */}
      {!loading && freeBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-50 to-[#EAF7EF] rounded-3xl border border-[#D1EADE]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#12A85A]">
                  Bilaash Hadda
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                  Buugaag Bilaash ah oo aad isla hadda akhrisan karto
                </h3>
              </div>
              <button
                onClick={() => onNavigateToCatalogue(undefined, undefined)}
                className="text-xs font-bold text-[#087A43] hover:underline cursor-pointer"
              >
                Dhammaan Bilaashka →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {freeBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onSelect={onSelectBook}
                  isOwned={ownedBookIds.has(book.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
