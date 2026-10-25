import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { BooksCatalogueView } from './components/BooksCatalogueView';
import { MyLibraryView } from './components/MyLibraryView';
import { AdminPanel } from './components/AdminPanel';
import { AccountView } from './components/AccountView';
import { WelcomeModal } from './components/WelcomeModal';
import { AuthModal, AuthTab } from './components/AuthModal';
import { BookDetailsModal } from './components/BookDetailsModal';
import { PaymentModal } from './components/PaymentModal';
import { PdfReaderModal } from './components/PdfReaderModal';
import { SupabaseGuideModal } from './components/SupabaseGuideModal';
import { Book, Profile, PaymentRequest } from './types';
import { authService } from './services/authService';
import { bookService } from './services/bookService';
import { orderService } from './services/orderService';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type ViewMode = 'home' | 'catalogue' | 'library' | 'admin' | 'account';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState<boolean>(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [ownedBookIds, setOwnedBookIds] = useState<Set<string>>(new Set());

  // Catalogue search/category prefill
  const [catalogueCategory, setCatalogueCategory] = useState<string>('Dhammaan');
  const [catalogueSearch, setCatalogueSearch] = useState<string>('');

  // Modals state
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<AuthTab>('login');
  const [supabaseGuideOpen, setSupabaseGuideOpen] = useState(false);

  // Active book interactions
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [buyingBook, setBuyingBook] = useState<Book | null>(null);
  const [readingBook, setReadingBook] = useState<Book | null>(null);

  const fetchBooks = async () => {
    setBooksLoading(true);
    setBooksError(null);
    try {
      const res = await bookService.getBooks({ onlyPublished: true });
      if (res.error) {
        setBooksError(res.error);
      }
      setBooks(res.books || []);
    } catch (e: any) {
      setBooksError(e?.message || 'Cillad ayaa dhacday soo qaadashada buugaagta');
    } finally {
      setBooksLoading(false);
    }
  };

  // Initial load & Supabase Auth listeners
  useEffect(() => {
    // Show splash welcome once per session
    const hasSeenWelcome = sessionStorage.getItem('booktiis_welcome_seen');
    if (!hasSeenWelcome) {
      setWelcomeOpen(true);
      sessionStorage.setItem('booktiis_welcome_seen', 'true');
    }

    loadInitialData();

    // Check for password recovery hash/query on URL
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      search.includes('flow=recovery')
    ) {
      setAuthInitialTab('update-password');
      setAuthModalOpen(true);
    }

    // Subscribe to real-time auth events (Password recovery, sign-in, token refresh)
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setAuthInitialTab('update-password');
          setAuthModalOpen(true);
        } else if (event === 'SIGNED_IN' && session?.user) {
          const user = await authService.getCurrentProfile();
          if (user) {
            setCurrentUser(user);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setOwnedBookIds(new Set());
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const user = await authService.getCurrentProfile();
      setCurrentUser(user);

      await fetchBooks();

      if (user) {
        const orders = await orderService.getUserOrders(user.id);
        const paidIds = new Set(orders.filter(o => o.status === 'paid').map(o => o.book_id));
        setOwnedBookIds(paidIds);
      } else {
        setOwnedBookIds(new Set());
      }
    } catch (e) {
      console.error('Error in loadInitialData:', e);
    }
  };

  // Re-fetch owned books when user changes
  useEffect(() => {
    const refreshUserLibrary = async () => {
      if (currentUser) {
        const orders = await orderService.getUserOrders(currentUser.id);
        const paidIds = new Set(orders.filter(o => o.status === 'paid').map(o => o.book_id));
        setOwnedBookIds(paidIds);
      } else {
        setOwnedBookIds(new Set());
      }
    };
    refreshUserLibrary();
  }, [currentUser]);

  // Auth Handlers
  const handleOpenAuth = (tab: AuthTab = 'login') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (profile: Profile) => {
    setCurrentUser(profile);
    setAuthModalOpen(false);
    if (profile.role === 'admin') {
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setCurrentView('home');
  };

  const handleRefreshProfile = async () => {
    const updated = await authService.refreshCurrentProfile();
    if (updated) {
      setCurrentUser(updated);
    }
  };

  // Navigation handlers
  const handleNavigateToCatalogue = (category?: string, search?: string) => {
    if (category) setCatalogueCategory(category);
    if (search !== undefined) setCatalogueSearch(search);
    setCurrentView('catalogue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToLibrary = () => {
    setCurrentView('library');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Payment completed
  const handlePaymentSubmitted = (paymentReq: PaymentRequest) => {
    // Refresh user state
    if (currentUser) {
      orderService.getUserOrders(currentUser.id).then(orders => {
        const paidIds = new Set(orders.filter(o => o.status === 'paid').map(o => o.book_id));
        setOwnedBookIds(paidIds);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans selection:bg-[#EAF7EF] selection:text-[#087A43]">
      {/* Global Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenSupabaseGuide={() => setSupabaseGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-0">
        {currentView === 'home' && (
          <HomeView
            books={books}
            loading={booksLoading}
            error={booksError}
            onRefresh={fetchBooks}
            onSelectBook={(book) => setSelectedBook(book)}
            onNavigateToCatalogue={handleNavigateToCatalogue}
            onNavigateToLibrary={handleNavigateToLibrary}
            onNavigateToAdmin={() => setCurrentView('admin')}
            ownedBookIds={ownedBookIds}
          />
        )}

        {currentView === 'catalogue' && (
          <BooksCatalogueView
            onSelectBook={(book) => setSelectedBook(book)}
            ownedBookIds={ownedBookIds}
            initialCategory={catalogueCategory}
            initialSearch={catalogueSearch}
          />
        )}

        {currentView === 'library' && (
          <MyLibraryView
            currentUser={currentUser}
            onOpenBookDetails={(book) => setSelectedBook(book)}
            onReadBook={(book) => setReadingBook(book)}
            onNavigateToCatalogue={() => handleNavigateToCatalogue()}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            currentUser={currentUser}
            onOpenBook={(book) => setSelectedBook(book)}
            onBooksUpdated={fetchBooks}
            onRefreshProfile={handleRefreshProfile}
          />
        )}

        {currentView === 'account' && (
          <AccountView
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenAuth={() => handleOpenAuth('login')}
            onRefreshProfile={handleRefreshProfile}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#D1EADE] py-10 mt-12 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-black text-[#087A43] text-base tracking-tight">BOOK-TIIS</span>
              <span className="text-[10px] uppercase font-bold text-gray-400">• Your Digital Library</span>
            </div>
            <p className="text-gray-500 text-[11px]">
              Maktabadda dijitaalka ah ee buugaagta tayada sare leh ee Af-Soomaaliga.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <button
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#087A43] cursor-pointer"
            >
              Bogga Hore
            </button>
            <button
              onClick={() => handleNavigateToCatalogue()}
              className="hover:text-[#087A43] cursor-pointer"
            >
              Buugaag
            </button>
            <button
              onClick={handleNavigateToLibrary}
              className="hover:text-[#087A43] cursor-pointer"
            >
              Maktabaddayda
            </button>
            <button
              onClick={() => setSupabaseGuideOpen(true)}
              className="text-[#087A43] underline cursor-pointer"
            >
              Supabase & SQL Guide
            </button>
          </div>

          <div className="text-[11px] text-gray-400">
            © {new Date().getFullYear()} BOOK-TIIS. Dhammaan xuquuqda way dhowran tahay.
          </div>
        </div>
      </footer>

      {/* Splash / Welcome Modal */}
      <WelcomeModal
        isOpen={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        onStart={() => {
          setWelcomeOpen(false);
          handleNavigateToCatalogue();
        }}
        onLogin={() => handleOpenAuth('login')}
        onRegister={() => handleOpenAuth('register')}
      />

      {/* Auth Modal (Login / Register / Password Reset) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialTab={authInitialTab}
      />

      {/* Book Details Modal */}
      <BookDetailsModal
        book={selectedBook}
        isOpen={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
        currentUser={currentUser}
        onReadBook={(book) => {
          setSelectedBook(null);
          setReadingBook(book);
        }}
        onBuyBook={(book) => {
          setSelectedBook(null);
          setBuyingBook(book);
        }}
        onRequireAuth={() => handleOpenAuth('login')}
      />

      {/* EVC Plus Payment Modal */}
      {buyingBook && (
        <PaymentModal
          isOpen={Boolean(buyingBook)}
          onClose={() => setBuyingBook(null)}
          book={buyingBook}
          currentUser={currentUser}
          onPaymentSubmitted={handlePaymentSubmitted}
          onRequireAuth={() => handleOpenAuth('login')}
        />
      )}

      {/* PDF Reader Modal */}
      {readingBook && (
        <PdfReaderModal
          book={readingBook}
          isOpen={Boolean(readingBook)}
          onClose={() => {
            setReadingBook(null);
            // Reload books / progress
            loadInitialData();
          }}
          currentUser={currentUser}
        />
      )}

      {/* Supabase Guide & SQL Modal */}
      <SupabaseGuideModal
        isOpen={supabaseGuideOpen}
        onClose={() => setSupabaseGuideOpen(false)}
      />
    </div>
  );
}
