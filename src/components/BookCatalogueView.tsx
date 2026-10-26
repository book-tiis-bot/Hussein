import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { Book, BookCategory, Profile } from '../types';
import { BookCard } from './BookCard';
import { bookService } from '../services/bookService';

interface BookCatalogueViewProps {
  currentUser?: Profile | null;
  onSelectBook: (book: Book) => void;
  ownedBookIds: Set<string>;
  initialCategory?: string;
  initialSearch?: string;
}

const CATEGORIES = [
  'Dhammaan',
  'Diinta',
  'Taariikh',
  'Ganacsiga',
  'Cilmi',
  'Suugaanta',
  'Teknoolojiga',
  'Caafimaadka'
];

export const BookCatalogueView: React.FC<BookCatalogueViewProps> = ({
  currentUser,
  onSelectBook,
  ownedBookIds,
  initialCategory,
  initialSearch,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'Dhammaan');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch || '');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'title'>('newest');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookService.getBooks({
        onlyPublished: true,
        category: selectedCategory === 'Dhammaan' ? undefined : selectedCategory,
        is_free: priceFilter === 'all' ? undefined : priceFilter === 'free',
        search: searchQuery.trim(),
      });

      if (res.error) {
        setError(res.error);
      }

      let sorted = [...(res.books || [])];
      if (sortBy === 'newest') {
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'price-asc') {
        sorted.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortBy === 'price-desc') {
        sorted.sort((a, b) => Number(b.price) - Number(a.price));
      } else if (sortBy === 'title') {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
      }

      setBooks(sorted);
    } catch (e: any) {
      console.error('Error fetching catalogue books:', e);
      setError(e?.message || 'Cillad ayaa dhacday soo qaadashada buugaagta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, searchQuery, priceFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Buugaagta Maktabadda <span className="text-[#087A43]">BOOK-TIIS</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          Ka dhex baaro qaybaha kala duwan ee cilmiga, taariikhda, ganacsiga, diinta, iyo suugaanta Soomaaliyeed.
        </p>

        <div className="relative pt-2">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Raadi buug ama qoraa…"
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#D1EADE] rounded-2xl text-sm shadow-sm focus:outline-none focus:border-[#087A43] focus:ring-2 focus:ring-[#087A43]/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-5 text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              Tir
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#087A43] text-white shadow-sm shadow-[#087A43]/20'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 text-xs self-start">
            <button
              onClick={() => setPriceFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                priceFilter === 'all' ? 'bg-[#EAF7EF] text-[#087A43]' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dhammaan
            </button>
            <button
              onClick={() => setPriceFilter('free')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                priceFilter === 'free' ? 'bg-[#EAF7EF] text-[#087A43]' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bilaash kaliya
            </button>
            <button
              onClick={() => setPriceFilter('paid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                priceFilter === 'paid' ? 'bg-[#EAF7EF] text-[#087A43]' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lacag kaliya
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-gray-500 font-semibold">Kala hormari:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#087A43] cursor-pointer"
            >
              <option value="newest">Ugu Cusub</option>
              <option value="price-asc">Qiimaha ugu Hooseeya</option>
              <option value="price-desc">Qiimaha ugu Sarreeya</option>
              <option value="title">Magaca (A-Z)</option>
            </select>
            <button
              onClick={fetchBooks}
              className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-[#087A43] hover:border-[#D1EADE] rounded-xl transition-colors cursor-pointer"
              title="Cusboonaysii liiska buugaagta"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#087A43]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-red-800">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Cillad ayaa dhacday intii buugaagta laga soo qaadayay Supabase:</span>
              <span>{error}</span>
            </div>
          </div>
          <button
            onClick={fetchBooks}
            className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
          >
            Isku day mar kale
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-2xl aspect-[3/5] animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={onSelectBook}
              isOwned={ownedBookIds.has(book.id)}
            />
          ))}
        </div>
      ) : (
        <div className="p-4">
