import React, { useState, useEffect } from 'react';
import { Library, BookOpen, Clock, CheckCircle2, XCircle, ShoppingBag, ArrowRight, User } from 'lucide-react';
import { Book, Order, PaymentRequest, Profile, ReadingProgress } from '../types';
import { BookCover } from './BookCover';
import { orderService } from '../services/orderService';
import { bookService } from '../services/bookService';

interface MyLibraryViewProps {
  currentUser: Profile | null;
  onOpenBookDetails: (book: Book) => void;
  onReadBook: (book: Book) => void;
  onNavigateToCatalogue: () => void;
  onOpenAuth: () => void;
}

export const MyLibraryView: React.FC<MyLibraryViewProps> = ({
  currentUser,
  onOpenBookDetails,
  onReadBook,
  onNavigateToCatalogue,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'books' | 'orders'>('books');
  const [libraryBooks, setLibraryBooks] = useState<Book[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLibrary = async () => {
      setLoading(true);
      try {
        if (!currentUser) {
          // If not logged in, show only free books as preview
          const freeRes = await bookService.getBooks({ is_free: true });
          if (isMounted) {
            setLibraryBooks(freeRes.books || []);
            setLoading(false);
          }
          return;
        }

        const [books, orders, reqs] = await Promise.all([
          orderService.getUserLibraryBooks(currentUser.id),
          orderService.getUserOrders(currentUser.id),
          orderService.getUserPaymentRequests(currentUser.id),
        ]);

        if (isMounted) {
          setLibraryBooks(books);
          setUserOrders(orders);
          setPaymentRequests(reqs);

          // Fetch reading progress for each book
          const map: Record<string, ReadingProgress> = {};
          for (const b of books) {
            const prog = await orderService.getReadingProgress(currentUser.id, b.id);
            if (prog) {
              map[b.id] = prog;
            }
          }
          setProgressMap(map);
        }
      } catch (err) {
        console.error('Error fetching library:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLibrary();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#087A43] to-[#12A85A] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
            <Library className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#EAF7EF]">
              Kaydkaaga Shakhsiga ah
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-0.5">
              Maktabaddayda
            </h1>
            <p className="text-xs text-[#EAF7EF]/90 mt-1">
              Buugaagta aad iibsatay, kuwa bilaashka ah, iyo heerka akhriskaaga.
            </p>
          </div>
        </div>

        {currentUser && (
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs">
            <div className="text-[#EAF7EF] text-[10px] uppercase font-bold">Macaamilka:</div>
            <div className="font-bold text-white text-sm">{currentUser.full_name}</div>
          </div>
        )}
      </div>

      {/* Guest Notice */}
      {!currentUser && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Kuma jirtid koontadaada. Fadlan gal si aad u aragto buugaagtii aad iibsatay iyo dalabaadkaaga EVC Plus.
            </span>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors"
          >
            Gal Hadda
          </button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('books')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'books'
              ? 'border-[#087A43] text-[#087A43]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Buugaagtayda ({libraryBooks.length})</span>
        </button>

        {currentUser && (
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#087A43] text-[#087A43]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Dalabaadka & Xaaladda Bixinta ({userOrders.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: MY BOOKS */}
      {activeTab === 'books' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : libraryBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {libraryBooks.map((book) => {
                const progress = progressMap[book.id];
                const lastPage = progress?.last_page || 1;
                const totalPages = progress?.total_pages || book.sample_content?.length || 5;
                const percent = Math.round((lastPage / totalPages) * 100);

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover */}
                      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                        <BookCover
                          coverPath={book.cover_path}
                          title={book.title}
                          author={book.author}
                          category={book.category}
                          aspectClassName="w-full h-full"
                        />
                        <div className="absolute top-3 left-3 bg-[#087A43] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs z-10">
                          {book.is_free ? 'Bilaash' : 'La Iibsaday'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <div className="text-[11px] font-bold text-[#087A43] uppercase tracking-wider">
                          {book.category}
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {book.author}
                        </p>

                        {/* Reading Progress Bar */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                            <span>Akhriska: Bogga {lastPage}</span>
                            <span className="font-bold text-[#087A43]">{percent}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#087A43] h-full rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenBookDetails(book)}
                        className="py-2 px-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Faahfaahin
                      </button>
                      <button
                        onClick={() => onReadBook(book)}
                        className="py-2 px-3 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{lastPage > 1 ? 'Sii Wad' : 'Akhri'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-xs space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#EAF7EF] text-[#087A43] flex items-center justify-center">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Maktabaddaadu weli waa bannaan tahay
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ka baaro buugaagta tayada sare leh ee ku jira kaydka BOOK-TIIS, oo bilow akhriska buugaag bilaash ah ama iibso buugaagta aad xiiseyneyso.
              </p>
              <button
                onClick={onNavigateToCatalogue}
                className="py-3 px-6 bg-[#087A43] hover:bg-[#066336] text-white rounded-xl text-xs font-bold shadow-md shadow-[#087A43]/20 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Baadh Buugaagta Hadda</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ORDERS & PAYMENT STATUS */}
      {activeTab === 'orders' && currentUser && (
        <div className="space-y-4">
          {paymentRequests.length > 0 || userOrders.length > 0 ? (
            <div className="space-y-3">
              {paymentRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">
                        Buugga: {req.book?.title || req.order?.book?.title || 'Buug Dijitaal ah'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Qiimaha: <strong className="text-gray-800">${Number(req.order?.amount || req.book?.price || 0).toFixed(2)}</strong></span>
                      <span>Taariikhda: {new Date(req.created_at).toLocaleDateString()}</span>
                      <span>Tixraaca EVC: <strong className="font-mono text-gray-800">{req.transaction_reference}</strong></span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>Sugaya Xaqiijin (Pending)</span>
                      </div>
                    )}
                    {req.status === 'approved' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-[#12A85A]" />
                        <span>La Ogolaaday (Paid)</span>
                      </div>
                    )}
                    {req.status === 'rejected' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>La Diiday</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 text-xs text-gray-500">
              Weli ma jiraan dalabaad ama codsiyo lacag-bixin oo aad gudbisay.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
